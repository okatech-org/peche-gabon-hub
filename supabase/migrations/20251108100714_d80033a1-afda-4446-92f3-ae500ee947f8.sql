-- Créer une table pour les formations en attente de validation
CREATE TABLE IF NOT EXISTS public.formations_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  type_formation TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  formateur_id UUID REFERENCES public.formateurs(id),
  formateur_nom TEXT NOT NULL,
  priorite TEXT NOT NULL DEFAULT 'moyenne',
  urgence INTEGER NOT NULL DEFAULT 50,
  raison_prediction TEXT NOT NULL,
  objectifs TEXT[] NOT NULL DEFAULT '{}',
  participants_cibles TEXT[] NOT NULL DEFAULT '{}',
  indicateurs_cibles TEXT[] NOT NULL DEFAULT '{}',
  nb_participants_max INTEGER DEFAULT 20,
  score_adequation_formateur INTEGER NOT NULL,
  score_confiance_prediction INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'modifiee')),
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes_revision TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_formations_validation_statut ON public.formations_validation(statut);
CREATE INDEX IF NOT EXISTS idx_formations_validation_formateur ON public.formations_validation(formateur_id);
CREATE INDEX IF NOT EXISTS idx_formations_validation_created_by ON public.formations_validation(created_by);

-- Trigger pour updated_at
CREATE TRIGGER update_formations_validation_updated_at
  BEFORE UPDATE ON public.formations_validation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.formations_validation ENABLE ROW LEVEL SECURITY;

-- Politique: Les ministres et admins peuvent tout voir
CREATE POLICY "Ministre et admins peuvent voir formations validation"
  ON public.formations_validation
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- Politique: Les utilisateurs autorisés peuvent créer des demandes
CREATE POLICY "Utilisateurs autorisés peuvent créer formations validation"
  ON public.formations_validation
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- Politique: Les ministres et admins peuvent modifier
CREATE POLICY "Ministre et admins peuvent modifier formations validation"
  ON public.formations_validation
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- Politique: Les admins peuvent supprimer
CREATE POLICY "Admins peuvent supprimer formations validation"
  ON public.formations_validation
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );