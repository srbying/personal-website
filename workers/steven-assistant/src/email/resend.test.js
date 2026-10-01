import assert from "node:assert/strict";
import { test } from "node:test";
import { createResendProvider } from "./resend.js";

const API_KEY = "re_test_secret";
const SECRET_BYTES = new TextEncoder().encode("test-webhook-secret");
const WEBHOOK_SECRET = `whsec_${Buffer.from(SECRET_BYTES).toString("base64")}`;

async function signedHeaders(rawBody, now = 1_800_000_000_000) {
  const id = "event-123";
  const timestamp = String(Math.floor(now / 1_000));
  const key = await crypto.subtle.importKey(
    "raw",
    SECRET_BYTES,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)
  );
  return new Headers({
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${Buffer.from(signature).toString("base64")}`
  });
}

test("Resend adapter keys retries by Eastern date while keeping the digest tag stable", async () => {
  let request;
  const provider = createResendProvider({
    apiKey: API_KEY,
    from: "Steven <digest@example.com>",
    to: "steven@example.com",
    webhookSecret: WEBHOOK_SECRET,
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return new Response(JSON.stringify({ id: "resend-email-1" }), { status: 200 });
    }
  });

  const accepted = await provider.sendDigest({
    digestId: "stable-digest-id",
    date: "2026-09-30",
    subject: "Daily Chat Digest",
    text: "Question: Hello\nAnswer: Hi"
  });

  assert.deepEqual(accepted, { id: "resend-email-1" });
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.init.headers.Authorization, `Bearer ${API_KEY}`);
  assert.equal(request.init.headers["Idempotency-Key"], "2026-09-30:stable-digest-id");
  assert.deepEqual(JSON.parse(request.init.body), {
    from: "Steven <digest@example.com>",
    to: ["steven@example.com"],
    subject: "Daily Chat Digest",
    text: "Question: Hello\nAnswer: Hi",
    tags: [{ name: "digest_id", value: "stable-digest-id" }]
  });
});

test("Resend adapter recognizes only a verified delivered email event", async () => {
  const provider = createResendProvider({
    apiKey: API_KEY,
    from: "digest@example.com",
    to: "steven@example.com",
    webhookSecret: WEBHOOK_SECRET
  });
  const now = 1_800_000_000_000;
  const deliveredBody = JSON.stringify({
    type: "email.delivered",
    data: {
      email_id: "resend-email-1",
      tags: { digest_id: "stable-digest-id" }
    }
  });
  const headers = await signedHeaders(deliveredBody, now);

  assert.deepEqual(await provider.parseDeliveryEvent({
    rawBody: deliveredBody,
    headers,
    now
  }), {
    providerMessageId: "resend-email-1",
    digestId: "stable-digest-id"
  });

  const sentBody = JSON.stringify({ type: "email.sent", data: { email_id: "resend-email-2" } });
  assert.equal(await provider.parseDeliveryEvent({
    rawBody: sentBody,
    headers: await signedHeaders(sentBody, now),
    now
  }), null);
});

test("Resend adapter rejects invalid and stale webhook signatures", async () => {
  const provider = createResendProvider({
    apiKey: API_KEY,
    from: "digest@example.com",
    to: "steven@example.com",
    webhookSecret: WEBHOOK_SECRET
  });
  const now = 1_800_000_000_000;
  const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "email-1" } });

  await assert.rejects(provider.parseDeliveryEvent({
    rawBody,
    headers: new Headers(),
    now
  }), /Invalid Resend webhook/);

  await assert.rejects(provider.parseDeliveryEvent({
    rawBody,
    headers: await signedHeaders(rawBody, now - 10 * 60 * 1_000),
    now
  }), /Invalid Resend webhook/);
});
