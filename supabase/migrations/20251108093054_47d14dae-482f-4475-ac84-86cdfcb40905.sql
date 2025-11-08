-- Activer realtime sur la table formations_planifiees
ALTER PUBLICATION supabase_realtime ADD TABLE public.formations_planifiees;

-- Activer realtime sur la table formateurs_disponibilites
ALTER PUBLICATION supabase_realtime ADD TABLE public.formateurs_disponibilites;

-- Créer une table pour tracker les utilisateurs actifs sur le calendrier
CREATE TABLE public.calendrier_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'viewing',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_calendrier_presence_user ON public.calendrier_presence(user_id);
CREATE INDEX idx_calendrier_presence_last_seen ON public.calendrier_presence(last_seen);

-- Trigger pour updated_at
CREATE TRIGGER update_calendrier_presence_updated_at
  BEFORE UPDATE ON public.calendrier_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer realtime sur la table de présence
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendrier_presence;

-- RLS pour calendrier_presence
ALTER TABLE public.calendrier_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture présence pour rôles autorisés"
  ON public.calendrier_presence
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

CREATE POLICY "Gestion présence par utilisateurs autorisés"
  ON public.calendrier_presence
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );