import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatLimits, selectRecentMessages } from "./portfolioChatMessages.js";

const limits = {
  maxMessages: 5,
  maxMessageLength: 20,
  maxTotalMessageLength: 50
};

test("validates the runtime limits before using them", () => {
  assert.deepEqual(parseChatLimits(limits), limits);
  assert.throws(() => parseChatLimits(null), /invalid/);
  assert.throws(() => parseChatLimits({ ...limits, maxMessages: "5" }), /invalid/);
  assert.throws(() => parseChatLimits({ ...limits, maxTotalMessageLength: 0 }), /invalid/);
});

test("keeps the largest recent suffix satisfying message count and total length", () => {
  const messages = [
    { role: "user", content: "older question" },
    { role: "assistant", content: "older answer" },
    { role: "user", content: "recent question" },
    { role: "assistant", content: "recent answer" },
    { role: "user", content: "current" }
  ];

  assert.deepEqual(
    selectRecentMessages(messages, { ...limits, maxMessages: 3, maxTotalMessageLength: 40 }),
    messages.slice(2)
  );
});

test("drops old turns when their content violates message length or total length", () => {
  const messages = [
    { role: "user", content: "old" },
    { role: "assistant", content: "answer that is too long" },
    { role: "user", content: "recent" },
    { role: "assistant", content: "ok" },
    { role: "user", content: "last" }
  ];

  assert.deepEqual(
    selectRecentMessages(messages, { ...limits, maxTotalMessageLength: 30 }),
    messages.slice(2)
  );
  assert.deepEqual(
    selectRecentMessages(messages, {
      ...limits,
      maxMessageLength: 30,
      maxTotalMessageLength: 10
    }),
    messages.slice(4)
  );
});

test("rejects a current request that cannot fit the effective Worker limits", () => {
  assert.equal(
    selectRecentMessages([{ role: "user", content: "question that is too long" }], limits),
    null
  );
});
