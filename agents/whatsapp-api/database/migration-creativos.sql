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
