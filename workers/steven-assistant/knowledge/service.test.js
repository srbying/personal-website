import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { createKnowledgeSyncService } from "./service.js";

const config = {
  indexName: "test-index",
  embeddingModel: "@cf/test/embedding-model",
  embeddingDimensions: 3
};
const digest = (value) => createHash("sha256").update(value).digest("hex");
const chunk = (id, hash, text = id) => ({
  id,
  noteId: id.split(":")[0],
  ordinal: Number(id.split(":")[1]),
  hash: digest(hash),
  text
});
const manifest = (chunks) => ({
  indexName: config.indexName,
  embeddingModel: config.embeddingModel,
  embeddingDimensions: config.embeddingDimensions,
  chunks: chunks.map(({ id, hash }) => ({ id, hash }))
});

function createHarness({ chunks, previousManifest = null, sourceError, visibilityDelay = 0, omitUpsert = false, omitDelete = false, waitOptions = {} } = {}) {
  const events = [];
  const state = new Map();
  const writes = [];
  let getCalls = 0;
  let storedManifest = previousManifest;
  const service = createKnowledgeSyncService({
    source: {
      load: async () => {
        events.push("source");
        if (sourceError) throw sourceError;
        return { notes: [], chunks };
      }
    },
    manifest: {
      read: async () => storedManifest,
      write: async (value) => {
        events.push("manifest");
        writes.push(value);
        storedManifest = value;
      }
    },
    embeddings: {
      embed: async (text) => {
        events.push(`embed:${text}`);
        return [0.1, 0.2, 0.3];
      }
    },
    vectorStore: {
      upsert: async (vectors) => {
        events.push("upsert");
        if (!omitUpsert) for (const vector of vectors) state.set(vector.id, vector);
        return { mutationId: "upsert-1" };
      },
      deleteByIds: async (ids) => {
        events.push("delete");
        if (!omitDelete) for (const id of ids) state.delete(id);
        return { mutationId: "delete-1" };
      },
      getByIds: async (ids) => {
        events.push("get");
        getCalls += 1;
        if (getCalls <= visibilityDelay) return [];
        return ids.flatMap((id) => state.has(id) ? [state.get(id)] : []);
      },
      query: async () => ({ matches: [] })
    },
    config,
    indexName: config.indexName,
    waitOptions: { attempts: 1, sleep: async () => {}, ...waitOptions }
  });
  for (const item of previousManifest?.chunks ?? []) {
    state.set(item.id, {
      id: item.id,
      values: [0.1, 0.2, 0.3],
      metadata: { text: "old", hash: item.hash, model: config.embeddingModel, noteId: item.noteId }
    });
  }
  return { service, events, state, writes, getManifest: () => storedManifest, getCalls: () => getCalls };
}

test("invalid or empty source fails before embeddings, Vectorize, or manifest writes", async () => {
  const { service, events, writes } = createHarness({
    chunks: [],
    sourceError: new Error("No approved Markdown")
  });
  await assert.rejects(service.sync({ confirm: async () => true }), /No approved Markdown/);
  assert.deepEqual(events, ["source"]);
  assert.deepEqual(writes, []);
});

test("sync requires confirmation before remote work; cancel makes no changes", async () => {
  const item = chunk("role:0001", "hash", "Approved test-only fact");
  const { service, events } = createHarness({ chunks: [item] });
  let seenPlan;
  const result = await service.sync({
    confirm: async (plan) => {
      seenPlan = plan;
      return false;
    }
  });
  assert.equal(result.status, "cancelled");
  assert.deepEqual(seenPlan.additions.map(({ id }) => id), ["role:0001"]);
  assert.deepEqual(events, ["source"]);
});

test("sync upserts and verifies before deleting stale IDs; writes manifest last", async () => {
  const current = chunk("role:0001", "new-hash", "Current approved text");
  const removed = chunk("old:0001", "old-hash", "Old");
  const unchanged = chunk("steady:0001", "steady-hash", "Steady approved content");
  const { service, events, writes, state } = createHarness({
    chunks: [current, unchanged],
    previousManifest: manifest([chunk("role:0001", "previous"), removed, unchanged])
  });
  const result = await service.sync({ confirm: async () => true });

  assert.equal(result.status, "synced");
  assert.equal(state.has("role:0001"), true);
  assert.equal(state.has("old:0001"), false);
  assert.ok(events.indexOf("upsert") < events.indexOf("delete"));
  assert.ok(events.indexOf("get") < events.indexOf("delete"));
  assert.equal(events.includes("embed:Steady approved content"), false);
  assert.equal(events.at(-1), "manifest");
  assert.equal(writes.length, 1);
  assert.deepEqual(Object.keys(writes[0].chunks[0]).sort(), ["hash", "id"]);
});

test("verify reports remote metadata mismatch without mutating the index", async () => {
  const item = chunk("role:0001", "hash", "Expected approved text");
  const saved = manifest([item]);
  const { service, events } = createHarness({ chunks: [item], previousManifest: saved });
  const result = await service.verify();
  assert.equal(result.ok, false);
  assert.ok(result.changed.includes("role:0001"));
  assert.equal(events.includes("upsert"), false);
  assert.equal(events.includes("delete"), false);
});

test("rebuild re-embeds unchanged chunks and requires confirmation", async () => {
  const item = chunk("role:0001", "hash", "Approved test-only fact");
  const { service, events } = createHarness({
    chunks: [item],
    previousManifest: manifest([item])
  });
  const result = await service.rebuild({ confirm: async () => true });
  assert.equal(result.status, "rebuilt");
  assert.equal(events.includes("embed:Approved test-only fact"), true);
});


test("preview and declined sync never call remote adapters", async () => {
  const item = chunk("role:0001", "hash", "Approved test-only fact");
  const { service, events } = createHarness({ chunks: [item] });
  await service.preview();
  const previewEvents = events.slice();
  assert.equal(previewEvents.includes("upsert"), false);
  assert.equal(previewEvents.includes("get"), false);
  assert.equal(previewEvents.some((event) => event.startsWith("embed:")), false);
  await service.sync({ confirm: async () => false });
  assert.equal(events.includes("upsert"), false);
  assert.equal(events.includes("delete"), false);
});

test("sync polls asynchronous upsert visibility before writing the manifest", async () => {
  const item = chunk("role:0001", "hash", "Approved test-only fact");
  const { service, events, writes, getCalls } = createHarness({
    chunks: [item],
    visibilityDelay: 1,
    waitOptions: { attempts: 2, delays: [0], sleep: async () => events.push("poll-wait") }
  });
  await service.sync({ confirm: async () => true });
  assert.equal(getCalls(), 2);
  assert.ok(events.indexOf("poll-wait") > events.indexOf("get"));
  assert.equal(events.at(-1), "manifest");
  assert.equal(writes.length, 1);
});

test("failed upsert verification or deletion never commits the manifest", async () => {
  const current = chunk("role:0001", "new-hash", "Current approved text");
  const { service: upsertService, events: upsertEvents, writes: upsertWrites } = createHarness({
    chunks: [current], omitUpsert: true
  });
  await assert.rejects(upsertService.sync({ confirm: async () => true }), /did not verify/);
  assert.equal(upsertEvents.includes("delete"), false);
  assert.equal(upsertWrites.length, 0);

  const old = chunk("old:0001", "old-hash", "Old managed chunk");
  const { service: deleteService, events: deleteEvents, writes: deleteWrites } = createHarness({
    chunks: [current], previousManifest: manifest([old]), omitDelete: true
  });
  await assert.rejects(deleteService.sync({ confirm: async () => true }), /did not verify removal/);
  assert.equal(deleteEvents.includes("manifest"), false);
  assert.equal(deleteWrites.length, 0);
});


test("preview and the accepted apply use the same deterministic change plan", async () => {
  const current = chunk("role:0001", "hash", "Approved test-only fact");
  const old = chunk("gone:0001", "old", "Removed managed chunk");
  const { service } = createHarness({ chunks: [current], previousManifest: manifest([old]) });
  const preview = await service.preview();
  let appliedPlan;
  await service.sync({ confirm: async (plan) => { appliedPlan = plan; return true; } });
  assert.deepEqual(appliedPlan, preview);
});


test("read-only query uses embeddings and retrieval without changing sync state", async () => {
  const item = chunk("role:0001", "hash", "Approved test-only fact");
  const { service, events, writes } = createHarness({ chunks: [item] });
  await service.query("What is approved?");
  assert.equal(events.includes("upsert"), false);
  assert.equal(events.includes("delete"), false);
  assert.equal(events.includes("manifest"), false);
  assert.deepEqual(writes, []);
});
