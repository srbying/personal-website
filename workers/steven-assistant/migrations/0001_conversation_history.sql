CREATE TABLE IF NOT EXISTS conversation_exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  digest_delivery_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (digest_delivery_state IN ('pending', 'in_progress', 'delivered')),
  digest_id TEXT,
  delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS conversation_exchanges_digest_expiry
  ON conversation_exchanges (digest_delivery_state, expires_at, conversation_id, id);
