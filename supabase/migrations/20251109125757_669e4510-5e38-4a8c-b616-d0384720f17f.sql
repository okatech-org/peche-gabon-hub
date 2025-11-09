-- Table pour stocker les conversations iAsted
CREATE TABLE public.conversations_iasted (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les messages de chaque conversation
CREATE TABLE public.messages_iasted (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations_iasted(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_conversations_iasted_user_id ON public.conversations_iasted(user_id);
CREATE INDEX idx_conversations_iasted_created_at ON public.conversations_iasted(created_at DESC);
CREATE INDEX idx_messages_iasted_conversation_id ON public.messages_iasted(conversation_id);
CREATE INDEX idx_messages_iasted_created_at ON public.messages_iasted(created_at);

-- Index pour la recherche full-text sur les messages
CREATE INDEX idx_messages_iasted_content_search ON public.messages_iasted USING gin(to_tsvector('french', content));

-- Fonction pour mettre à jour le updated_at
CREATE OR REPLACE FUNCTION public.update_conversations_iasted_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations_iasted 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour mettre à jour updated_at quand un message est ajouté
CREATE TRIGGER update_conversation_updated_at
AFTER INSERT ON public.messages_iasted
FOR EACH ROW
EXECUTE FUNCTION public.update_conversations_iasted_updated_at();

-- Enable RLS
ALTER TABLE public.conversations_iasted ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_iasted ENABLE ROW LEVEL SECURITY;

-- Policies pour conversations_iasted
CREATE POLICY "Utilisateurs peuvent voir leurs conversations"
ON public.conversations_iasted FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs conversations"
ON public.conversations_iasted FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs conversations"
ON public.conversations_iasted FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs conversations"
ON public.conversations_iasted FOR DELETE
USING (auth.uid() = user_id);

-- Policies pour messages_iasted
CREATE POLICY "Utilisateurs peuvent voir messages de leurs conversations"
ON public.messages_iasted FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations_iasted
    WHERE conversations_iasted.id = messages_iasted.conversation_id
    AND conversations_iasted.user_id = auth.uid()
  )
);

CREATE POLICY "Utilisateurs peuvent créer messages dans leurs conversations"
ON public.messages_iasted FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations_iasted
    WHERE conversations_iasted.id = messages_iasted.conversation_id
    AND conversations_iasted.user_id = auth.uid()
  )
);

CREATE POLICY "Utilisateurs peuvent supprimer messages de leurs conversations"
ON public.messages_iasted FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations_iasted
    WHERE conversations_iasted.id = messages_iasted.conversation_id
    AND conversations_iasted.user_id = auth.uid()
  )
);