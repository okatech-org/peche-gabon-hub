-- Ajouter les colonnes pour les paramètres de détection vocale
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS voice_silence_duration INTEGER DEFAULT 2000 CHECK (voice_silence_duration >= 1000 AND voice_silence_duration <= 5000),
ADD COLUMN IF NOT EXISTS voice_silence_threshold INTEGER DEFAULT 10 CHECK (voice_silence_threshold >= 5 AND voice_silence_threshold <= 30);

-- Commenter les colonnes
COMMENT ON COLUMN public.user_preferences.voice_silence_duration IS 'Durée de silence en millisecondes avant d''arrêter l''enregistrement (1000-5000ms)';
COMMENT ON COLUMN public.user_preferences.voice_silence_threshold IS 'Seuil de détection du silence (5-30, plus bas = plus sensible)';