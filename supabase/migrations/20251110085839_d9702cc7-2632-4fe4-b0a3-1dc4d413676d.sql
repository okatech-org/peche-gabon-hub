-- Table pour stocker les rappels de déclaration envoyés
CREATE TABLE IF NOT EXISTS public.rappels_declaration_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sortie_id UUID NOT NULL REFERENCES public.sorties_peche(id) ON DELETE CASCADE,
  pecheur_id UUID NOT NULL,
  date_retour TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_envoyee_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_lue BOOLEAN DEFAULT false,
  notification_lue_le TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_rappels_pecheur ON public.rappels_declaration_captures(pecheur_id);
CREATE INDEX idx_rappels_sortie ON public.rappels_declaration_captures(sortie_id);
CREATE INDEX idx_rappels_date ON public.rappels_declaration_captures(notification_envoyee_le);

-- RLS Policies
ALTER TABLE public.rappels_declaration_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pêcheurs peuvent voir leurs rappels"
ON public.rappels_declaration_captures
FOR SELECT
USING (auth.uid() = pecheur_id);

CREATE POLICY "Pêcheurs peuvent mettre à jour leurs rappels"
ON public.rappels_declaration_captures
FOR UPDATE
USING (auth.uid() = pecheur_id);

CREATE POLICY "Système peut créer des rappels"
ON public.rappels_declaration_captures
FOR INSERT
WITH CHECK (true);

-- Table pour les notifications générales
CREATE TABLE IF NOT EXISTS public.notifications_pecheurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type_notification TEXT NOT NULL DEFAULT 'info',
  lue BOOLEAN DEFAULT false,
  lue_le TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_notifications_user ON public.notifications_pecheurs(user_id);
CREATE INDEX idx_notifications_lue ON public.notifications_pecheurs(lue);
CREATE INDEX idx_notifications_created ON public.notifications_pecheurs(created_at);

-- RLS Policies
ALTER TABLE public.notifications_pecheurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leurs notifications"
ON public.notifications_pecheurs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs notifications"
ON public.notifications_pecheurs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Système peut créer des notifications"
ON public.notifications_pecheurs
FOR INSERT
WITH CHECK (true);

-- Activer realtime pour les notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_pecheurs;