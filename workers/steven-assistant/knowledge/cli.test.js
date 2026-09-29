import assert from "node:assert/strict";
import { test } from "node:test";
import { runKnowledgeCommand } from "./cli.js";

const plan = {
  indexName: "test-index",
  additions: [{ id: "role:0001", hash: "a".repeat(64), text: "Approved local preview." }],
  edits: [],
  removals: []
};

test("sync displays its plan and requires exact APPLY confirmation", async () => {
  const output = [];
  let accepted;
  const result = await runKnowledgeCommand("sync", {
    service: {
      sync: async ({ confirm }) => {
        accepted = await confirm(plan);
        return { status: accepted ? "synced" : "cancelled" };
      }
    },
    write: (text) => output.push(text),
    prompt: async () => "APPLY"
  });
  assert.equal(accepted, true);
  assert.match(output[0], /role:0001/);
  assert.match(output[0], /Approved local preview/);
  assert.deepEqual(result, { status: "synced" });
});

test("non-exact confirmation cancels rebuild", async () => {
  let accepted;
  const result = await runKnowledgeCommand("rebuild", {
    service: {
      rebuild: async ({ confirm }) => {
        accepted = await confirm(plan);
        return { status: accepted ? "rebuilt" : "cancelled" };
      }
    },
    write: () => {},
    prompt: async () => "apply"
  });
  assert.equal(accepted, false);
  assert.deepEqual(result, { status: "cancelled" });
});

test("preview reports a plan without prompting", async () => {
  const output = [];
  const result = await runKnowledgeCommand("preview", {
    service: { preview: async () => plan },
    write: (text) => output.push(text),
    prompt: async () => assert.fail("Preview must not prompt")
  });
  assert.equal(output.length, 1);
  assert.match(output[0], /Add/);
  assert.deepEqual(result, plan);
});


test("confirmation rejects whitespace and extra text", async () => {
  for (const answer of ["APPLY ", " APPLY", "APPLY NOW"]) {
    let accepted;
    await runKnowledgeCommand("sync", {
      service: { sync: async ({ confirm }) => { accepted = await confirm(plan); return { status: accepted ? "synced" : "cancelled" }; } },
      write: () => {},
      prompt: async () => answer
    });
    assert.equal(accepted, false);
  }
});
