import assert from "node:assert/strict";
import { test } from "node:test";
import { loadKnowledgeConfig } from "./config.js";

const valid = {
  EMBEDDING_MODEL: "@cf/test/embedding-model",
  EMBEDDING_DIMENSIONS: "3",
  VECTOR_TOP_K: "8"
};

test("loads required knowledge settings without reading .dev.vars", () => {
  assert.deepEqual(loadKnowledgeConfig(valid), {
    indexName: "steven-knowledge",
    embeddingModel: "@cf/test/embedding-model",
    embeddingDimensions: 3,
    vectorTopK: 8
  });
  for (const key of Object.keys(valid)) {
    const missing = { ...valid };
    delete missing[key];
    assert.throws(() => loadKnowledgeConfig(missing), /missing or invalid/);
  }
});

test("rejects malformed model names and unsafe vector settings", () => {
  assert.throws(() => loadKnowledgeConfig({ ...valid, EMBEDDING_MODEL: "model-from-user-input" }), /EMBEDDING_MODEL/);
  assert.throws(() => loadKnowledgeConfig({ ...valid, EMBEDDING_DIMENSIONS: "0" }), /EMBEDDING_DIMENSIONS/);
  assert.throws(() => loadKnowledgeConfig({ ...valid, VECTOR_TOP_K: "51" }), /VECTOR_TOP_K/);
});
