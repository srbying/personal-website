import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { planSync } from "./planner.js";

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
const manifest = (chunks, overrides = {}) => ({
  indexName: config.indexName,
  embeddingModel: config.embeddingModel,
  embeddingDimensions: config.embeddingDimensions,
  chunks: chunks.map(({ id, hash }) => ({ id, hash })),
  ...overrides
});

test("plans additions, edits, removals, and unchanged chunks deterministically", () => {
  const oldChunks = [
    chunk("one:0001", "old-hash"),
    chunk("two:0001", "same-hash"),
    chunk("removed:0001", "gone-hash")
  ];
  const desired = [
    chunk("one:0001", "new-hash", "updated"),
    chunk("two:0001", "same-hash", "same"),
    chunk("three:0001", "added-hash", "added")
  ];

  const first = planSync(desired, manifest(oldChunks), config);
  const retry = planSync(desired, manifest(oldChunks), config);
  assert.deepEqual(first.additions.map(({ id }) => id), ["three:0001"]);
  assert.deepEqual(first.edits.map(({ id }) => id), ["one:0001"]);
  assert.deepEqual(first.removals.map(({ id }) => id), ["removed:0001"]);
  assert.deepEqual(first.unchanged.map(({ id }) => id), ["two:0001"]);
  assert.deepEqual(first, retry);
});

test("first sync upserts all desired chunks and never schedules unknown deletes", () => {
  const plan = planSync([chunk("role:0001", "hash")], null, config);
  assert.deepEqual(plan.additions.map(({ id }) => id), ["role:0001"]);
  assert.deepEqual(plan.removals, []);
});

test("model changes re-embed every chunk; dimension or index changes fail closed", () => {
  const existing = manifest([chunk("role:0001", "hash")]);
  const modelChanged = planSync([chunk("role:0001", "hash")], existing, {
    ...config,
    embeddingModel: "@cf/test/new-model"
  });
  assert.deepEqual(modelChanged.edits.map(({ id }) => id), ["role:0001"]);
  assert.throws(() => planSync([chunk("role:0001", "hash")], existing, { ...config, embeddingDimensions: 4 }), /dimensions/);
  assert.throws(() => planSync([chunk("role:0001", "hash")], existing, { ...config, indexName: "other-index" }), /index/);
});

test("rebuild forces all desired chunks through embedding and preserves stale managed IDs for deletion", () => {
  const existing = manifest([chunk("role:0001", "same"), chunk("old:0001", "old")]);
  const plan = planSync([chunk("role:0001", "same")], existing, config, { rebuild: true });
  assert.deepEqual(plan.edits.map(({ id }) => id), ["role:0001"]);
  assert.deepEqual(plan.removals.map(({ id }) => id), ["old:0001"]);
});
