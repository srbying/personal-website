CREATE TABLE IF NOT EXISTS conversation_digest_attempts (
  provider_message_id TEXT PRIMARY KEY,
  digest_id TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS conversation_digest_attempts_digest
  ON conversation_digest_attempts (digest_id, attempted_at);
