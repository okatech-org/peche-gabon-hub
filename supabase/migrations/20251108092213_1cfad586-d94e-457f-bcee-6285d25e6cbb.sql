-- Créer la table des formateurs
CREATE TABLE public.formateurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE,
  telephone TEXT,
  specialites TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'archive')),
  note_moyenne NUMERIC,
  nb_formations_donnees INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des disponibilités
CREATE TABLE public.formateurs_disponibilites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formateur_id UUID NOT NULL REFERENCES public.formateurs(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (date_fin >= date_debut)
);

-- Créer la table des évaluations
CREATE TABLE public.formateurs_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formateur_id UUID NOT NULL REFERENCES public.formateurs(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations_planifiees(id) ON DELETE CASCADE,
  note_pedagogie INTEGER NOT NULL CHECK (note_pedagogie BETWEEN 1 AND 5),
  note_expertise INTEGER NOT NULL CHECK (note_expertise BETWEEN 1 AND 5),
  note_communication INTEGER NOT NULL CHECK (note_communication BETWEEN 1 AND 5),
  note_organisation INTEGER NOT NULL CHECK (note_organisation BETWEEN 1 AND 5),
  note_globale NUMERIC,
  commentaires TEXT,
  points_forts TEXT,
  points_amelioration TEXT,
  evaluateur_id UUID REFERENCES auth.users(id),
  date_evaluation DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(formateur_id, formation_id)
);

-- Ajouter une colonne formateur_id dans formations_planifiees
ALTER TABLE public.formations_planifiees 
ADD COLUMN formateur_id UUID REFERENCES public.formateurs(id) ON DELETE SET NULL;

-- Créer un index pour les recherches
CREATE INDEX idx_formateurs_specialites ON public.formateurs USING GIN(specialites);
CREATE INDEX idx_disponibilites_formateur ON public.formateurs_disponibilites(formateur_id, date_debut, date_fin);
CREATE INDEX idx_evaluations_formateur ON public.formateurs_evaluations(formateur_id);
CREATE INDEX idx_evaluations_formation ON public.formateurs_evaluations(formation_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_formateurs_updated_at
  BEFORE UPDATE ON public.formateurs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disponibilites_updated_at
  BEFORE UPDATE ON public.formateurs_disponibilites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.formateurs_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour recalculer la note moyenne d'un formateur
CREATE OR REPLACE FUNCTION public.recalculer_note_formateur()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE formateurs
  SET 
    note_moyenne = (
      SELECT AVG(note_globale)
      FROM formateurs_evaluations
      WHERE formateur_id = COALESCE(NEW.formateur_id, OLD.formateur_id)
    ),
    nb_formations_donnees = (
      SELECT COUNT(DISTINCT formation_id)
      FROM formateurs_evaluations
      WHERE formateur_id = COALESCE(NEW.formateur_id, OLD.formateur_id)
    )
  WHERE id = COALESCE(NEW.formateur_id, OLD.formateur_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour recalculer automatiquement la note moyenne
CREATE TRIGGER trigger_recalculer_note_formateur
  AFTER INSERT OR UPDATE OR DELETE ON public.formateurs_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculer_note_formateur();

-- Fonction pour calculer la note globale automatiquement
CREATE OR REPLACE FUNCTION public.calculer_note_globale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.note_globale = (NEW.note_pedagogie + NEW.note_expertise + NEW.note_communication + NEW.note_organisation) / 4.0;
  RETURN NEW;
END;
$$;

-- Trigger pour calculer la note globale avant insert/update
CREATE TRIGGER trigger_calculer_note_globale
  BEFORE INSERT OR UPDATE ON public.formateurs_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_note_globale();

-- RLS pour formateurs
ALTER TABLE public.formateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture formateurs pour rôles autorisés"
  ON public.formateurs
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

CREATE POLICY "Gestion formateurs par admins et direction"
  ON public.formateurs
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- RLS pour disponibilités
ALTER TABLE public.formateurs_disponibilites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture disponibilités pour rôles autorisés"
  ON public.formateurs_disponibilites
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

CREATE POLICY "Gestion disponibilités par admins et direction"
  ON public.formateurs_disponibilites
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- RLS pour évaluations
ALTER TABLE public.formateurs_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture évaluations pour rôles autorisés"
  ON public.formateurs_evaluations
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

CREATE POLICY "Création évaluations par admins et direction"
  ON public.formateurs_evaluations
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Modification évaluations par créateur ou admin"
  ON public.formateurs_evaluations
  FOR UPDATE
  USING (
    auth.uid() = evaluateur_id OR
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Suppression évaluations par admin uniquement"
  ON public.formateurs_evaluations
  FOR DELETE
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );