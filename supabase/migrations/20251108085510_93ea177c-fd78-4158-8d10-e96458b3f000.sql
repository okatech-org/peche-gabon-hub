-- Table des formations planifiées/implémentées
CREATE TABLE IF NOT EXISTS public.formations_planifiees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  type_formation TEXT NOT NULL,
  objectifs TEXT[] NOT NULL DEFAULT '{}',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
  lieu TEXT,
  formateur TEXT,
  participants_cibles TEXT[] NOT NULL DEFAULT '{}',
  nb_participants_max INTEGER,
  nb_participants_inscrits INTEGER DEFAULT 0,
  budget_prevu NUMERIC,
  budget_reel NUMERIC,
  priorite TEXT NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('haute', 'moyenne', 'basse')),
  indicateurs_cibles TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des participants aux formations
CREATE TABLE IF NOT EXISTS public.formations_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations_planifiees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  statut_participation TEXT NOT NULL DEFAULT 'inscrit' CHECK (statut_participation IN ('inscrit', 'present', 'absent', 'abandonne')),
  date_inscription TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_completion TIMESTAMP WITH TIME ZONE,
  note_satisfaction INTEGER CHECK (note_satisfaction >= 1 AND note_satisfaction <= 5),
  commentaires TEXT,
  competences_acquises TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(formation_id, user_id)
);

-- Table des évaluations d'impact des formations
CREATE TABLE IF NOT EXISTS public.formations_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations_planifiees(id) ON DELETE CASCADE,
  date_evaluation DATE NOT NULL,
  periode_avant_debut DATE NOT NULL,
  periode_avant_fin DATE NOT NULL,
  periode_apres_debut DATE NOT NULL,
  periode_apres_fin DATE NOT NULL,
  efficacite_avant NUMERIC NOT NULL,
  efficacite_apres NUMERIC NOT NULL,
  amelioration_pct NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN efficacite_avant > 0 
      THEN ((efficacite_apres - efficacite_avant) / efficacite_avant * 100)
      ELSE 0
    END
  ) STORED,
  indicateurs_impactes TEXT[] NOT NULL DEFAULT '{}',
  nb_actions_analysees INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  recommandations TEXT,
  evaluateur_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.formations_planifiees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour formations_planifiees
CREATE POLICY "Ministre et admins peuvent tout gérer sur formations"
  ON public.formations_planifiees
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Directions provinciales peuvent voir formations"
  ON public.formations_planifiees
  FOR SELECT
  USING (
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'agent_collecte'::app_role)
  );

-- RLS Policies pour formations_participants
CREATE POLICY "Ministre et admins peuvent tout gérer sur participants"
  ON public.formations_participants
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Utilisateurs peuvent voir et modifier leurs participations"
  ON public.formations_participants
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies pour formations_evaluations
CREATE POLICY "Ministre et admins peuvent tout gérer sur évaluations"
  ON public.formations_evaluations
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Directions provinciales peuvent voir évaluations"
  ON public.formations_evaluations
  FOR SELECT
  USING (
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

-- Trigger pour mettre à jour le nombre de participants inscrits
CREATE OR REPLACE FUNCTION public.update_nb_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE formations_planifiees
  SET nb_participants_inscrits = (
    SELECT COUNT(*)
    FROM formations_participants
    WHERE formation_id = COALESCE(NEW.formation_id, OLD.formation_id)
      AND statut_participation != 'abandonne'
  )
  WHERE id = COALESCE(NEW.formation_id, OLD.formation_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_formations_participants_count
AFTER INSERT OR UPDATE OR DELETE ON public.formations_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_nb_participants();

-- Trigger pour updated_at
CREATE TRIGGER update_formations_planifiees_updated_at
BEFORE UPDATE ON public.formations_planifiees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formations_participants_updated_at
BEFORE UPDATE ON public.formations_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formations_evaluations_updated_at
BEFORE UPDATE ON public.formations_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes pour performance
CREATE INDEX idx_formations_planifiees_statut ON public.formations_planifiees(statut);
CREATE INDEX idx_formations_planifiees_dates ON public.formations_planifiees(date_debut, date_fin);
CREATE INDEX idx_formations_participants_formation ON public.formations_participants(formation_id);
CREATE INDEX idx_formations_participants_user ON public.formations_participants(user_id);
CREATE INDEX idx_formations_evaluations_formation ON public.formations_evaluations(formation_id);