const RESEND_API_URL = "https://api.resend.com/emails";
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

function decodeBase64(value) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function webhookSignatures(value) {
  if (typeof value !== "string") return [];
  return value.split(/\s+/).flatMap((entry) => {
    const [version, signature] = entry.split(",", 2);
    return version === "v1" && signature ? [signature] : [];
  });
}

async function hasValidSignature({ rawBody, headers, secret, now }) {
  const id = headers.get("svix-id");
  const timestampText = headers.get("svix-timestamp");
  const timestamp = Number(timestampText);
  const signatures = webhookSignatures(headers.get("svix-signature"));
  if (
    !id ||
    !Number.isInteger(timestamp) ||
    Math.abs(now / 1_000 - timestamp) > MAX_WEBHOOK_AGE_SECONDS ||
    signatures.length === 0
  ) return false;

  const encodedSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const secretBytes = decodeBase64(encodedSecret);
  if (!secretBytes) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signedContent = new TextEncoder().encode(`${id}.${timestampText}.${rawBody}`);
    for (const signature of signatures) {
      const signatureBytes = decodeBase64(signature);
      if (!signatureBytes) continue;
      if (await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        signedContent
      )) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function createResendProvider({
  apiKey,
  from,
  to,
  webhookSecret,
  fetchImpl = globalThis.fetch
}) {
  return Object.freeze({
    async sendDigest({ digestId, subject, text }) {
      if (![apiKey, from, to].every((value) => typeof value === "string" && value.trim())) {
        throw new Error("Resend send configuration is incomplete");
      }
      const response = await fetchImpl(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": digestId
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          tags: [{ name: "digest_id", value: digestId }]
        })
      });
      if (!response.ok) throw new Error("Resend did not accept the digest");

      let body;
      try {
        body = await response.json();
      } catch {
        throw new Error("Resend returned an invalid response");
      }
      if (typeof body?.id !== "string" || !body.id) {
        throw new Error("Resend returned an invalid response");
      }
      return { id: body.id };
    },

    async parseDeliveryEvent({ rawBody, headers, now = Date.now() }) {
      if (typeof webhookSecret !== "string" || !webhookSecret.trim()) {
        throw new Error("Invalid Resend webhook");
      }
      if (!await hasValidSignature({ rawBody, headers, secret: webhookSecret, now })) {
        throw new Error("Invalid Resend webhook");
      }

      let event;
      try {
        event = JSON.parse(rawBody);
      } catch {
        throw new Error("Invalid Resend webhook");
      }
      if (event?.type !== "email.delivered") return null;
      if (typeof event.data?.email_id !== "string" || !event.data.email_id) {
        throw new Error("Invalid Resend webhook");
      }
      const tags = event.data.tags;
      const digestId = Array.isArray(tags)
        ? tags.find((tag) => tag?.name === "digest_id")?.value
        : tags?.digest_id;
      return {
        providerMessageId: event.data.email_id,
        ...(typeof digestId === "string" && digestId ? { digestId } : {})
      };
    }
  });
}
