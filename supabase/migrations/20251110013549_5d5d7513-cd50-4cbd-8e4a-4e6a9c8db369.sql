-- Add focus mode to user preferences and sessions
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS voice_focus_mode BOOLEAN DEFAULT false;

ALTER TABLE conversation_sessions 
ADD COLUMN IF NOT EXISTS focus_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS focus_topic TEXT,
ADD COLUMN IF NOT EXISTS focus_depth INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS focus_started_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_focus 
ON conversation_sessions(focus_mode, focus_topic) 
WHERE focus_mode = true;

COMMENT ON COLUMN user_preferences.voice_focus_mode IS 'Active le mode focus pour des conversations approfondies sur un seul sujet';
COMMENT ON COLUMN conversation_sessions.focus_mode IS 'Indique si la session est en mode focus';
COMMENT ON COLUMN conversation_sessions.focus_topic IS 'Le sujet principal de la conversation en mode focus';
COMMENT ON COLUMN conversation_sessions.focus_depth IS 'Profondeur actuelle de la conversation (nombre de questions de suivi)';
COMMENT ON COLUMN conversation_sessions.focus_started_at IS 'Début du mode focus pour cette session';