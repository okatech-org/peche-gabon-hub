-- Create voice presets (favoris) table
CREATE TABLE IF NOT EXISTS public.voice_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  voice_silence_duration INTEGER NOT NULL DEFAULT 2000,
  voice_silence_threshold INTEGER NOT NULL DEFAULT 10,
  voice_continuous_mode BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own presets"
  ON public.voice_presets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presets"
  ON public.voice_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets"
  ON public.voice_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets"
  ON public.voice_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_voice_presets_updated_at
  BEFORE UPDATE ON public.voice_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_sessions_updated_at();

-- Add index for faster queries
CREATE INDEX idx_voice_presets_user_id ON public.voice_presets(user_id);
CREATE INDEX idx_voice_presets_is_default ON public.voice_presets(user_id, is_default) WHERE is_default = true;