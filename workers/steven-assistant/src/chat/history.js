export const MAX_HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const HISTORY_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function run(statement) {
  const result = await statement.run();
  if (!result?.success) throw new Error("Conversation history operation failed");
  return result;
}

async function all(statement) {
  const result = await statement.all();
  if (!result?.success) throw new Error("Conversation history query failed");
  return Array.isArray(result.results) ? result.results : [];
}

async function digestExchanges(database, digestId, now) {
  return all(database.prepare(`
    SELECT
      id,
      conversation_id AS conversationId,
      question,
      answer,
      created_at AS createdAt,
      expires_at AS expiresAt,
      digest_delivery_state AS digestDeliveryState,
      digest_id AS digestId
    FROM conversation_exchanges
    WHERE digest_id = ?
      AND expires_at > ?
      AND digest_delivery_state = 'in_progress'
    ORDER BY conversation_id ASC, created_at ASC, id ASC
  `).bind(digestId, now));
}

export function createConversationHistory(database) {
  return Object.freeze({
    async recordExchange({ conversationId, question, answer, createdAt = Date.now() }) {
      const expiresAt = createdAt + MAX_HISTORY_RETENTION_MS - HISTORY_CLEANUP_INTERVAL_MS;
      return run(database.prepare(`
        INSERT INTO conversation_exchanges
          (conversation_id, question, answer, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(conversationId, question, answer, createdAt, expiresAt));
    },

    async listDigestEligible(now = Date.now()) {
      return all(database.prepare(`
        SELECT
          id,
          conversation_id AS conversationId,
          question,
          answer,
          created_at AS createdAt,
          expires_at AS expiresAt,
          digest_delivery_state AS digestDeliveryState,
          digest_id AS digestId
        FROM conversation_exchanges
        WHERE expires_at > ?
          AND digest_delivery_state != 'delivered'
        ORDER BY conversation_id ASC, created_at ASC, id ASC
      `).bind(now));
    },

    async claimNextDigest(now = Date.now()) {
      const existing = await database.prepare(`
        SELECT digest_id AS digestId
        FROM conversation_exchanges
        WHERE digest_delivery_state = 'in_progress'
          AND digest_id IS NOT NULL
          AND expires_at > ?
        GROUP BY digest_id
        ORDER BY MIN(created_at) ASC, digest_id ASC
        LIMIT 1
      `).bind(now).first();

      if (existing?.digestId) {
        const exchanges = await digestExchanges(database, existing.digestId, now);
        return exchanges.length ? { digestId: existing.digestId, exchanges } : null;
      }

      const digestId = crypto.randomUUID();
      const claimed = await run(database.prepare(`
        UPDATE conversation_exchanges
        SET digest_delivery_state = 'in_progress', digest_id = ?
        WHERE id IN (
          SELECT id
          FROM conversation_exchanges
          WHERE digest_delivery_state = 'pending'
            AND digest_id IS NULL
            AND expires_at > ?
        )
      `).bind(digestId, now));
      if (!claimed.meta?.changes) return null;

      const exchanges = await digestExchanges(database, digestId, now);
      return exchanges.length ? { digestId, exchanges } : null;
    },

    async recordDigestAttempt({ digestId, providerMessageId, attemptedAt = Date.now() }) {
      return run(database.prepare(`
        INSERT OR IGNORE INTO conversation_digest_attempts
          (provider_message_id, digest_id, attempted_at)
        VALUES (?, ?, ?)
      `).bind(providerMessageId, digestId, attemptedAt));
    },

    async findDigestIdByProviderMessageId(providerMessageId) {
      const result = await database.prepare(`
        SELECT digest_id AS digestId
        FROM conversation_digest_attempts
        WHERE provider_message_id = ?
      `).bind(providerMessageId).first();
      return result?.digestId ?? null;
    },

    async confirmDigestDelivered(digestId, deliveredAt = Date.now()) {
      const results = await database.batch([
        database.prepare(`
          UPDATE conversation_exchanges
          SET digest_delivery_state = 'delivered', delivered_at = ?
          WHERE digest_id = ?
            AND digest_delivery_state = 'in_progress'
        `).bind(deliveredAt, digestId),
        database.prepare(`
          DELETE FROM conversation_exchanges
          WHERE digest_id = ?
            AND digest_delivery_state = 'delivered'
        `).bind(digestId),
        database.prepare(`
          UPDATE conversation_digest_attempts
          SET delivered_at = COALESCE(delivered_at, ?)
          WHERE digest_id = ?
        `).bind(deliveredAt, digestId)
      ]);
      if (!Array.isArray(results) || results.some((result) => !result?.success)) {
        throw new Error("Conversation history operation failed");
      }
      return Number(results[1]?.meta?.changes ?? 0);
    },

    async deleteExpired(now = Date.now()) {
      const result = await run(database.prepare(`
        DELETE FROM conversation_exchanges
        WHERE expires_at <= ?
      `).bind(now));
      await run(database.prepare(`
        DELETE FROM conversation_digest_attempts
        WHERE attempted_at <= ?
          OR (
            delivered_at IS NULL
            AND NOT EXISTS (
              SELECT 1
              FROM conversation_exchanges
              WHERE conversation_exchanges.digest_id = conversation_digest_attempts.digest_id
            )
          )
      `).bind(now - MAX_HISTORY_RETENTION_MS));
      return result;
    }
  });
}
