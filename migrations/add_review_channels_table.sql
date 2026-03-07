-- Migration: Create sn_review_channels table
-- Run this SQL on your PostgreSQL database

CREATE TABLE IF NOT EXISTS sn_review_channels (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES sn_users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  channel_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_review_channels_user_id ON sn_review_channels(user_id);

-- Optional: Remove the old column from sn_users if it exists
-- ALTER TABLE sn_users DROP COLUMN IF EXISTS discord_review_channel_id;
