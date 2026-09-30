export const MAX_HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const HISTORY_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function run(statement) {
  const result = await statement.run();
  if (!result?.success) throw new Error("Conversation history operation failed");
  return result;
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
      const result = await database.prepare(`
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
        ORDER BY conversation_id ASC, id ASC
      `).bind(now).all();
      if (!result?.success) throw new Error("Conversation history query failed");
      return Array.isArray(result?.results) ? result.results : [];
    },

    async deleteExpired(now = Date.now()) {
      return run(database.prepare(`
        DELETE FROM conversation_exchanges
        WHERE expires_at <= ?
      `).bind(now));
    }
  });
}
