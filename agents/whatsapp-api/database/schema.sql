CREATE TABLE IF NOT EXISTS inbound_messages (
  id TEXT PRIMARY KEY,
  phone_number_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message_type TEXT NOT NULL,
  text_body TEXT,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS inbound_received ON inbound_messages(received_at);
CREATE TABLE IF NOT EXISTS outbound_replies (
  inbound_id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  reply_text TEXT,
  meta_message_id TEXT,
  updated_at INTEGER NOT NULL
);
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

CREATE TABLE IF NOT EXISTS creative_briefs (
  business_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  step INTEGER NOT NULL,
  brief_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(business_id,channel,sender)
);
CREATE TABLE IF NOT EXISTS creative_jobs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  business_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('pdf','image')),
  brief_json TEXT NOT NULL,
  state TEXT NOT NULL,
  asset_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS creative_jobs_work ON creative_jobs(business_id,state,created_at);
CREATE INDEX IF NOT EXISTS creative_jobs_customer ON creative_jobs(business_id,channel,sender,created_at);
