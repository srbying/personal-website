import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import {
  createConversationHistory,
  HISTORY_CLEANUP_INTERVAL_MS,
  MAX_HISTORY_RETENTION_MS
} from "./history.js";

const migrations = await Promise.all(
  ["0001_conversation_history.sql", "0002_daily_chat_digest.sql"].map((name) =>
    readFile(new URL(`../../migrations/${name}`, import.meta.url), "utf8")
  )
);

async function withHistory(run) {
  const sqlite = new DatabaseSync(":memory:");
  const database = {
    exec: (sql) => sqlite.exec(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
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
    for (const migration of migrations) database.exec(migration);
    await run(createConversationHistory(database), database);
  } finally {
    sqlite.close();
  }
}

test("stores each completed exchange as a pending row within seven-day limit", async () => {
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
      expires_at: createdAt + MAX_HISTORY_RETENTION_MS - HISTORY_CLEANUP_INTERVAL_MS,
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

test("hourly cleanup deletes expired exchanges by the seven-day limit", async () => {
  await withHistory(async (history, database) => {
    const createdAt = 1_000;
    const expiresAt = createdAt + MAX_HISTORY_RETENTION_MS - HISTORY_CLEANUP_INTERVAL_MS;
    const cleanupAt =
      Math.ceil(expiresAt / HISTORY_CLEANUP_INTERVAL_MS) * HISTORY_CLEANUP_INTERVAL_MS;
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Expired question",
      answer: "Expired answer",
      createdAt
    });

    assert.equal((await history.listDigestEligible(expiresAt - 1)).length, 1);
    assert.equal((await history.listDigestEligible(expiresAt)).length, 0);
    assert.ok(cleanupAt <= createdAt + MAX_HISTORY_RETENTION_MS);
    await history.deleteExpired(cleanupAt);

    const remaining = await database.prepare(
      "SELECT COUNT(*) AS count FROM conversation_exchanges"
    ).first();
    assert.equal(remaining.count, 0);
  });
});

test("digest retries keep one identity and exclude exchanges added later", async () => {
  await withHistory(async (history) => {
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "First question",
      answer: "First answer",
      createdAt: 1_000
    });

    const firstAttempt = await history.claimNextDigest(1_000);
    assert.ok(firstAttempt?.digestId);
    assert.deepEqual(firstAttempt.exchanges.map(({ question }) => question), ["First question"]);

    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Newer question",
      answer: "Newer answer",
      createdAt: 2_000
    });

    const retry = await history.claimNextDigest(3_000);
    assert.equal(retry.digestId, firstAttempt.digestId);
    assert.deepEqual(retry.exchanges.map(({ question }) => question), ["First question"]);
  });
});

test("delivery confirmation deletes only its digest exchanges and is idempotent", async () => {
  await withHistory(async (history) => {
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Included question",
      answer: "Included answer",
      createdAt: 1_000
    });
    const digest = await history.claimNextDigest(1_000);

    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Newer question",
      answer: "Newer answer",
      createdAt: 2_000
    });

    assert.equal(await history.confirmDigestDelivered(digest.digestId), 1);
    assert.equal(await history.confirmDigestDelivered(digest.digestId), 0);
    assert.deepEqual((await history.listDigestEligible(3_000)).map(({ question }) => question), [
      "Newer question"
    ]);
  });
});

test("provider attempts map delivery callbacks to a stable digest after confirmation", async () => {
  await withHistory(async (history, database) => {
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Question",
      answer: "Answer",
      createdAt: 1_000
    });
    const digest = await history.claimNextDigest(1_000);
    await history.recordDigestAttempt({
      digestId: digest.digestId,
      providerMessageId: "provider-email-1",
      attemptedAt: 2_000
    });

    assert.equal(await history.findDigestIdByProviderMessageId("provider-email-1"), digest.digestId);
    assert.equal(await history.confirmDigestDelivered(digest.digestId, 3_000), 1);
    assert.equal(await history.findDigestIdByProviderMessageId("provider-email-1"), digest.digestId);
    const attempt = await database.prepare(`
      SELECT delivered_at FROM conversation_digest_attempts WHERE provider_message_id = ?
    `).bind("provider-email-1").first();
    assert.equal(attempt.delivered_at, 3_000);
    assert.equal(await history.confirmDigestDelivered(digest.digestId, 4_000), 0);
  });
});

test("hourly expiry removes undelivered rows and their provider attempt records", async () => {
  await withHistory(async (history) => {
    const createdAt = 1_000;
    await history.recordExchange({
      conversationId: "b22bb6b5-cac3-4d0e-9f5f-90fcdcbfca32",
      question: "Expired question",
      answer: "Expired answer",
      createdAt
    });
    const digest = await history.claimNextDigest(createdAt);
    await history.recordDigestAttempt({
      digestId: digest.digestId,
      providerMessageId: "expired-provider-email",
      attemptedAt: createdAt
    });

    await history.deleteExpired(createdAt + MAX_HISTORY_RETENTION_MS);

    assert.equal((await history.listDigestEligible(createdAt + MAX_HISTORY_RETENTION_MS)).length, 0);
    assert.equal(await history.findDigestIdByProviderMessageId("expired-provider-email"), null);
  });
});
