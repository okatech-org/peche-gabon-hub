-- Table pour stocker les briefings quotidiens
CREATE TABLE IF NOT EXISTS public.briefings_quotidiens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_briefing DATE NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  contenu_structure JSONB NOT NULL,
  contenu_vocal TEXT NOT NULL,
  audio_url TEXT,
  points_cles JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions_strategiques JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertes_prioritaires JSONB NOT NULL DEFAULT '[]'::jsonb,
  statistiques_resumees JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut TEXT NOT NULL DEFAULT 'genere' CHECK (statut IN ('genere', 'lu', 'archive')),
  genere_par TEXT DEFAULT 'system',
  lu_le TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_briefings_date ON public.briefings_quotidiens(date_briefing DESC);
CREATE INDEX idx_briefings_statut ON public.briefings_quotidiens(statut);

-- RLS
ALTER TABLE public.briefings_quotidiens ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture (ministre et admin)
CREATE POLICY "Ministre peut voir briefings"
  ON public.briefings_quotidiens
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Politique pour mise à jour du statut
CREATE POLICY "Ministre peut marquer briefing comme lu"
  ON public.briefings_quotidiens
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger pour updated_at
CREATE TRIGGER update_briefings_quotidiens_updated_at
  BEFORE UPDATE ON public.briefings_quotidiens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les préférences de briefing du ministre
CREATE TABLE IF NOT EXISTS public.preferences_briefing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heure_generation TIME NOT NULL DEFAULT '06:00:00',
  sections_incluses JSONB NOT NULL DEFAULT '["alertes", "finances", "captures", "formations", "remontees"]'::jsonb,
  niveau_detail TEXT NOT NULL DEFAULT 'standard' CHECK (niveau_detail IN ('minimal', 'standard', 'detaille')),
  inclure_comparaisons BOOLEAN NOT NULL DEFAULT true,
  inclure_predictions BOOLEAN NOT NULL DEFAULT true,
  voix_preferee TEXT,
  notification_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS pour préférences
ALTER TABLE public.preferences_briefing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent gérer leurs préférences"
  ON public.preferences_briefing
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_preferences_briefing_updated_at
  BEFORE UPDATE ON public.preferences_briefing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();