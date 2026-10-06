const DIGEST_TIME_ZONE = "America/New_York";
const DIGEST_HOUR = 8;

function timestamp(value) {
  if (value instanceof Date) return value.getTime();
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error("Invalid scheduled time");
  return result;
}

function easternParts(value) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DIGEST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(timestamp(value)));
  return Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
}

function easternDate(value) {
  const { year, month, day } = easternParts(value);
  return `${year}-${month}-${day}`;
}

export function isDigestDeliveryWindow(scheduledTime) {
  return Number(easternParts(scheduledTime).hour) === DIGEST_HOUR;
}

export function formatDigestEmail(exchanges, scheduledTime) {
  const date = easternDate(scheduledTime);
  const conversations = new Map();
  for (const exchange of exchanges) {
    const current = conversations.get(exchange.conversationId) ?? [];
    current.push(exchange);
    conversations.set(exchange.conversationId, current);
  }

  const groups = [...conversations.entries()].map(([id, rows]) => {
    const orderedRows = rows.sort((left, right) =>
      left.createdAt - right.createdAt || left.id - right.id
    );
    return { id, rows: orderedRows, firstCreatedAt: orderedRows[0].createdAt };
  }).sort((left, right) =>
    left.firstCreatedAt - right.firstCreatedAt || left.id.localeCompare(right.id)
  );

  const sections = groups.map(({ rows }, index) => {
    const turns = rows.map(({ question, answer }) =>
      `Question: ${question}\nAnswer: ${answer}`
    );
    return [`Conversation ${index + 1}:`, turns.join("\n\n")].join("\n");
  });

  return {
    subject: `Daily Chat Digest — ${date}`,
    text: [`Daily Chat Digest — ${date}`, ...sections].join("\n\n")
  };
}

export async function sendDailyChatDigest({ history, provider, scheduledTime }) {
  const now = timestamp(scheduledTime);
  if (!isDigestDeliveryWindow(now)) return { status: "outside_window" };

  const digest = await history.claimNextDigest(now);
  if (!digest) return { status: "empty" };

  const email = formatDigestEmail(digest.exchanges, now);
  const accepted = await provider.sendDigest({
    digestId: digest.digestId,
    date: easternDate(now),
    ...email
  });
  if (!accepted || typeof accepted.id !== "string" || !accepted.id) {
    throw new Error("Email provider did not accept the digest");
  }

  await history.recordDigestAttempt({
    digestId: digest.digestId,
    providerMessageId: accepted.id,
    attemptedAt: now
  });

  return { status: "accepted", digestId: digest.digestId };
}
