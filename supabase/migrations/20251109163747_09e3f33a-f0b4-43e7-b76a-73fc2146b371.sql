-- Add voice settings columns to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_silence_duration INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS voice_silence_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS voice_continuous_mode BOOLEAN DEFAULT false;