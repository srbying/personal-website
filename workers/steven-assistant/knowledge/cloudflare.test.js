import assert from "node:assert/strict";
import { test } from "node:test";
import { createCloudflareAdapters } from "./cloudflare.js";

const config = {
  indexName: "test-index",
  embeddingModel: "@cf/test/embedding-model",
  embeddingDimensions: 3
};

function fakeEnvironment(dimensions = 3) {
  const calls = [];
  const env = {
    AI: { run: async (model, input) => { calls.push(["run", model, input]); return { data: [[0.1, 0.2, 0.3]] }; } },
    KNOWLEDGE: { describe: async () => { calls.push(["describe"]); return { name: config.indexName, dimensions }; } }
  };
  return { env, calls };
}

test("lazily loads runtime bindings and checks index dimensions before embedding", async () => {
  const { env, calls } = fakeEnvironment();
  let loads = 0;
  const adapters = createCloudflareAdapters({ config, getEnvironment: async () => { loads += 1; return env; } });
  assert.equal(loads, 0);
  assert.deepEqual(await adapters.embeddings.embed("approved text"), [0.1, 0.2, 0.3]);
  assert.equal(loads, 1);
  assert.deepEqual(calls.map(([name]) => name), ["describe", "run"]);
});

test("rejects incompatible Vectorize dimensions before calling the embedding model", async () => {
  const { env, calls } = fakeEnvironment(4);
  const adapters = createCloudflareAdapters({ config, getEnvironment: async () => env });
  await assert.rejects(adapters.embeddings.embed("approved text"), /dimensions/);
  assert.deepEqual(calls.map(([name]) => name), ["describe"]);
});

test("rejects missing and non-finite embedding values", async () => {
  for (const data of [[], [[1, 2]], [[1, 2, Infinity]]]) {
    const { env } = fakeEnvironment();
    env.AI.run = async () => ({ data });
    const adapters = createCloudflareAdapters({ config, getEnvironment: async () => env });
    await assert.rejects(adapters.embeddings.embed("approved text"), /3 finite numbers/);
  }
});
