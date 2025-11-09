-- Ajouter la colonne pour le mode conversation continue
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS voice_continuous_mode BOOLEAN DEFAULT false;

-- Commenter la colonne
COMMENT ON COLUMN public.user_preferences.voice_continuous_mode IS 'Active le mode conversation continue où iAsted écoute automatiquement après chaque réponse';