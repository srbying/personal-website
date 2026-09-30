import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createConversationHistory, MAX_HISTORY_RETENTION_MS } from "./history.js";

const migration = await readFile(
  new URL("../../migrations/0001_conversation_history.sql", import.meta.url),
  "utf8"
);

async function withHistory(run) {
  const sqlite = new DatabaseSync(":memory:");
  const database = {
    exec: (sql) => sqlite.exec(sql),
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...boundValues) {
          values = boundValues;
          return statement;
        },
        async run() {
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
        async all() {
          return { success: true, results: sqlite.prepare(sql).all(...values) };
        },
        async first() {
          return sqlite.prepare(sql).get(...values) ?? null;
        }
      };
      return statement;
    }
  };
  try {
    database.exec(migration);
    await run(createConversationHistory(database), database);
  } finally {
    sqlite.close();
  }
}

test("stores each completed exchange as a pending row with seven-day expiry", async () => {
  await withHistory(async (history, database) => {
    const createdAt = 1_000;
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Question one",
      answer: "Answer one",
      createdAt
    });

    const result = await database.prepare(`
      SELECT conversation_id, question, answer, created_at, expires_at, digest_delivery_state
      FROM conversation_exchanges
    `).first();
    assert.deepEqual({ ...result }, {
      conversation_id: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Question one",
      answer: "Answer one",
      created_at: createdAt,
      expires_at: createdAt + MAX_HISTORY_RETENTION_MS,
      digest_delivery_state: "pending"
    });
  });
});

test("digest selection groups conversations, orders exchanges, and excludes expired rows", async () => {
  await withHistory(async (history) => {
    const firstConversation = "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32";
    const secondConversation = "c33cc7c6-dbd4-4e1f-8a6a-a1e0decdfb43";
    await history.recordExchange({
      conversationId: firstConversation,
      question: "First question",
      answer: "First answer",
      createdAt: 1_000
    });
    await history.recordExchange({
      conversationId: secondConversation,
      question: "Other conversation",
      answer: "Other answer",
      createdAt: 2_000
    });
    await history.recordExchange({
      conversationId: firstConversation,
      question: "Follow-up question",
      answer: "Follow-up answer",
      createdAt: 3_000
    });
    await history.recordExchange({
      conversationId: "d44dd8d7-ec05-4f20-9b7b-b2f1efd4c054",
      question: "Expired conversation",
      answer: "Expired answer",
      createdAt: 3_000 - MAX_HISTORY_RETENTION_MS
    });

    const rows = await history.listDigestEligible(3_000);
    assert.deepEqual(rows.map(({ conversationId, question }) => [conversationId, question]), [
      [firstConversation, "First question"],
      [firstConversation, "Follow-up question"],
      [secondConversation, "Other conversation"]
    ]);
  });
});

test("hourly cleanup deletes expired exchanges at the seven-day boundary", async () => {
  await withHistory(async (history, database) => {
    const createdAt = 1_000;
    const expiresAt = createdAt + MAX_HISTORY_RETENTION_MS;
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Expired question",
      answer: "Expired answer",
      createdAt
    });

    assert.equal((await history.listDigestEligible(expiresAt - 1)).length, 1);
    assert.equal((await history.listDigestEligible(expiresAt)).length, 0);
    await history.deleteExpired(expiresAt);

    const remaining = await database.prepare(
      "SELECT COUNT(*) AS count FROM conversation_exchanges"
    ).first();
    assert.equal(remaining.count, 0);
  });
});
