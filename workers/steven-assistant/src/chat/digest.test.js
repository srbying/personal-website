import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDigestEmail,
  isDigestDeliveryWindow,
  sendDailyChatDigest
} from "./digest.js";

test("digest window follows Eastern time through both daylight-saving transitions", () => {
  assert.equal(isDigestDeliveryWindow(Date.parse("2026-03-08T12:00:00Z")), true);
  assert.equal(isDigestDeliveryWindow(Date.parse("2026-11-01T13:00:00Z")), true);
  assert.equal(isDigestDeliveryWindow(Date.parse("2026-03-08T11:00:00Z")), false);
  assert.equal(isDigestDeliveryWindow(Date.parse("2026-11-01T12:00:00Z")), false);
});

test("digest email groups actual exchanges by conversation in chronological order", () => {
  const email = formatDigestEmail([
    {
      conversationId: "conversation-b",
      question: "Second conversation question",
      answer: "Second conversation answer",
      createdAt: 2_000
    },
    {
      conversationId: "conversation-a",
      question: "Follow-up question",
      answer: "Follow-up answer",
      createdAt: 3_000
    },
    {
      conversationId: "conversation-a",
      question: "First question",
      answer: "First answer",
      createdAt: 1_000
    }
  ], Date.parse("2026-09-30T12:00:00Z"));

  assert.equal(email.subject, "Daily Chat Digest — 2026-09-30");
  assert.match(email.text, /Conversation 1:\nQuestion: First question\nAnswer: First answer\n\nQuestion: Follow-up question\nAnswer: Follow-up answer/);
  assert.match(email.text, /Conversation 2:\nQuestion: Second conversation question\nAnswer: Second conversation answer/);
  assert.ok(!email.text.includes("conversation-a"));
});

test("empty window does not send email", async () => {
  let sendCount = 0;
  const result = await sendDailyChatDigest({
    history: { claimNextDigest: async () => null },
    provider: { sendDigest: async () => { sendCount += 1; return { id: "email-1" }; } },
    scheduledTime: Date.parse("2026-09-30T12:00:00Z")
  });

  assert.deepEqual(result, { status: "empty" });
  assert.equal(sendCount, 0);
});

test("provider acceptance records an attempt but does not confirm delivery", async () => {
  const recorded = [];
  let confirmed = false;
  const result = await sendDailyChatDigest({
    history: {
      claimNextDigest: async () => ({
        digestId: "stable-digest-id",
        exchanges: [{
          conversationId: "conversation-a",
          question: "Question",
          answer: "Answer",
          createdAt: 1_000
        }]
      }),
      recordDigestAttempt: async (attempt) => recorded.push(attempt),
      confirmDigestDelivered: async () => { confirmed = true; }
    },
    provider: {
      sendDigest: async (message) => {
        assert.equal(message.digestId, "stable-digest-id");
        return { id: "provider-email-id" };
      }
    },
    scheduledTime: Date.parse("2026-09-30T12:00:00Z")
  });

  assert.deepEqual(result, { status: "accepted", digestId: "stable-digest-id" });
  assert.deepEqual(recorded, [{
    digestId: "stable-digest-id",
    providerMessageId: "provider-email-id",
    attemptedAt: Date.parse("2026-09-30T12:00:00Z")
  }]);
  assert.equal(confirmed, false);
});

test("retry sends same stable digest identity", async () => {
  const sent = [];
  const history = {
    claimNextDigest: async () => ({
      digestId: "retry-stable-id",
      exchanges: [{
        conversationId: "conversation-a",
        question: "Question",
        answer: "Answer",
        createdAt: 1_000
      }]
    }),
    recordDigestAttempt: async () => {}
  };
  const provider = { sendDigest: async ({ digestId }) => {
    sent.push(digestId);
    return { id: `provider-email-${sent.length}` };
  } };

  await sendDailyChatDigest({
    history,
    provider,
    scheduledTime: Date.parse("2026-09-30T12:00:00Z")
  });
  await sendDailyChatDigest({
    history,
    provider,
    scheduledTime: Date.parse("2026-10-01T12:00:00Z")
  });

  assert.deepEqual(sent, ["retry-stable-id", "retry-stable-id"]);
});

test("provider failure leaves digest attempt unrecorded for a later retry", async () => {
  let recordedAttempts = 0;
  await assert.rejects(sendDailyChatDigest({
    history: {
      claimNextDigest: async () => ({
        digestId: "failed-send-id",
        exchanges: [{
          conversationId: "conversation-a",
          question: "Question",
          answer: "Answer",
          createdAt: 1_000
        }]
      }),
      recordDigestAttempt: async () => { recordedAttempts += 1; }
    },
    provider: { sendDigest: async () => { throw new Error("provider unavailable"); } },
    scheduledTime: Date.parse("2026-09-30T12:00:00Z")
  }), /provider unavailable/);

  assert.equal(recordedAttempts, 0);
});
