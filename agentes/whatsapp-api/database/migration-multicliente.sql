-- Run in D1 before deploying the new Worker. No existing rows are deleted.
CREATE TABLE IF NOT EXISTS conversation_controls (
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1)),
  reason TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(channel,sender)
);
CREATE TABLE IF NOT EXISTS ai_reservations (
  message_id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_reservations_channel_time ON ai_reservations(channel,created_at);
CREATE INDEX IF NOT EXISTS ai_reservations_sender_time ON ai_reservations(channel,sender,created_at);
