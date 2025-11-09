-- 1) Sessions de conversation avec mémoire
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  language TEXT,
  title TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  memory_summary TEXT,
  memory_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_conv_sessions_user ON public.conversation_sessions(user_id, started_at DESC);

-- RLS pour sessions
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.conversation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.conversation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.conversation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.conversation_sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 2) Messages de conversation
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool','router')),
  content TEXT,
  content_json JSONB,
  audio_url TEXT,
  lang TEXT,
  tokens INT,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conv_msgs_session_time ON public.conversation_messages(session_id, created_at);

-- RLS pour messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own sessions" ON public.conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_sessions 
      WHERE id = conversation_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own sessions" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_sessions 
      WHERE id = conversation_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages" ON public.conversation_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 3) Événements analytics
CREATE TABLE IF NOT EXISTS public.analytics_voice_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_voice_events(session_id, at);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_voice_events(event_type, at DESC);

-- RLS pour analytics
ALTER TABLE public.analytics_voice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON public.analytics_voice_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics_voice_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON public.analytics_voice_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_sessions_timestamp
  BEFORE UPDATE ON public.conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_sessions_updated_at();