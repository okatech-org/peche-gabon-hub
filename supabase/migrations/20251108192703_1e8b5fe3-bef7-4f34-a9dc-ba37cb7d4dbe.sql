-- Table pour les remontées terrain
CREATE TABLE public.remontees_terrain (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_reference TEXT UNIQUE,
  type_remontee TEXT NOT NULL CHECK (type_remontee IN ('reclamation', 'suggestion', 'denonciation', 'article_presse', 'commentaire_reseau', 'avis_reseau_social')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT, -- Nom de la source (journal, réseau social, etc.)
  url_source TEXT, -- Lien vers l'article ou le post
  localisation TEXT, -- Lieu concerné
  niveau_priorite TEXT DEFAULT 'moyen' CHECK (niveau_priorite IN ('bas', 'moyen', 'haut', 'critique')),
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_analyse', 'en_traitement', 'resolu', 'rejete', 'archive')),
  sentiment TEXT CHECK (sentiment IN ('positif', 'neutre', 'negatif')),
  categorie TEXT, -- Catégorie thématique (surpêche, pollution, etc.)
  mots_cles TEXT[], -- Tags pour la recherche
  piece_jointe_url TEXT,
  soumis_par UUID REFERENCES auth.users(id),
  institution_source TEXT,
  date_incident DATE,
  impact_estime TEXT, -- Estimation de l'impact
  nb_personnes_concernees INTEGER,
  validation_status TEXT DEFAULT 'en_attente' CHECK (validation_status IN ('en_attente', 'valide', 'refuse')),
  valide_par UUID REFERENCES auth.users(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  commentaire_validation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les actions prises suite aux remontées
CREATE TABLE public.actions_remontees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remontee_id UUID NOT NULL REFERENCES public.remontees_terrain(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('investigation', 'mesure_corrective', 'reglementation', 'communication', 'formation', 'sanction')),
  description TEXT NOT NULL,
  responsable UUID REFERENCES auth.users(id),
  institution_responsable TEXT,
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  budget_alloue NUMERIC(12, 2),
  resultats TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les synthèses générées
CREATE TABLE public.syntheses_remontees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  types_remontees TEXT[], -- Types de remontées incluses
  categories TEXT[], -- Catégories analysées
  nombre_remontees INTEGER,
  synthese_texte TEXT, -- Synthèse textuelle générée
  points_cles JSONB, -- Points clés structurés
  recommandations JSONB, -- Recommandations structurées
  tendances JSONB, -- Analyse des tendances
  genere_par UUID REFERENCES auth.users(id),
  genere_automatiquement BOOLEAN DEFAULT false,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide', 'publie')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour lier les remontées aux synthèses
CREATE TABLE public.remontees_syntheses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remontee_id UUID NOT NULL REFERENCES public.remontees_terrain(id) ON DELETE CASCADE,
  synthese_id UUID NOT NULL REFERENCES public.syntheses_remontees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(remontee_id, synthese_id)
);

-- Enable RLS
ALTER TABLE public.remontees_terrain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_remontees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syntheses_remontees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remontees_syntheses ENABLE ROW LEVEL SECURITY;

-- Policies pour remontees_terrain
-- Les utilisateurs authentifiés peuvent créer des remontées
CREATE POLICY "Les utilisateurs authentifiés peuvent créer des remontées"
ON public.remontees_terrain
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = soumis_par);

-- Tous les utilisateurs authentifiés peuvent voir les remontées validées
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les remontées validées"
ON public.remontees_terrain
FOR SELECT
TO authenticated
USING (
  validation_status = 'valide' 
  OR soumis_par = auth.uid()
  OR has_role(auth.uid(), 'ministre')
  OR has_role(auth.uid(), 'admin')
);

-- Les créateurs peuvent modifier leurs remontées en attente
CREATE POLICY "Les créateurs peuvent modifier leurs remontées"
ON public.remontees_terrain
FOR UPDATE
TO authenticated
USING (soumis_par = auth.uid() AND validation_status = 'en_attente')
WITH CHECK (soumis_par = auth.uid());

-- Les ministres et admins peuvent tout modifier
CREATE POLICY "Les ministres et admins peuvent modifier toutes les remontées"
ON public.remontees_terrain
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

-- Policies pour actions_remontees
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les actions"
ON public.actions_remontees
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les ministres et admins peuvent créer des actions"
ON public.actions_remontees
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Les ministres et admins peuvent modifier des actions"
ON public.actions_remontees
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

-- Policies pour syntheses_remontees
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les synthèses publiées"
ON public.syntheses_remontees
FOR SELECT
TO authenticated
USING (
  statut = 'publie' 
  OR genere_par = auth.uid()
  OR has_role(auth.uid(), 'ministre')
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Les ministres et admins peuvent créer des synthèses"
ON public.syntheses_remontees
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Les ministres et admins peuvent modifier des synthèses"
ON public.syntheses_remontees
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

-- Policies pour remontees_syntheses
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les liens"
ON public.remontees_syntheses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les ministres et admins peuvent gérer les liens"
ON public.remontees_syntheses
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'ministre') OR has_role(auth.uid(), 'admin'));

-- Fonction pour générer un numéro de référence unique
CREATE OR REPLACE FUNCTION public.generer_numero_remontee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  annee TEXT;
  compteur INTEGER;
  prefix TEXT;
BEGIN
  annee := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Déterminer le préfixe selon le type
  prefix := CASE NEW.type_remontee
    WHEN 'reclamation' THEN 'REC'
    WHEN 'suggestion' THEN 'SUG'
    WHEN 'denonciation' THEN 'DEN'
    WHEN 'article_presse' THEN 'ART'
    WHEN 'commentaire_reseau' THEN 'COM'
    WHEN 'avis_reseau_social' THEN 'AVI'
    ELSE 'REM'
  END;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_reference FROM '\d+$') AS INTEGER)), 0) + 1
  INTO compteur
  FROM remontees_terrain
  WHERE numero_reference LIKE prefix || '/' || annee || '%';
  
  NEW.numero_reference := prefix || '/' || annee || '/' || LPAD(compteur::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$;

-- Trigger pour générer le numéro de référence
CREATE TRIGGER trigger_generer_numero_remontee
BEFORE INSERT ON public.remontees_terrain
FOR EACH ROW
WHEN (NEW.numero_reference IS NULL)
EXECUTE FUNCTION public.generer_numero_remontee();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_remontees_terrain_updated_at
BEFORE UPDATE ON public.remontees_terrain
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actions_remontees_updated_at
BEFORE UPDATE ON public.actions_remontees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_syntheses_remontees_updated_at
BEFORE UPDATE ON public.syntheses_remontees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexs pour améliorer les performances
CREATE INDEX idx_remontees_type ON public.remontees_terrain(type_remontee);
CREATE INDEX idx_remontees_statut ON public.remontees_terrain(statut);
CREATE INDEX idx_remontees_priorite ON public.remontees_terrain(niveau_priorite);
CREATE INDEX idx_remontees_validation ON public.remontees_terrain(validation_status);
CREATE INDEX idx_remontees_date ON public.remontees_terrain(created_at DESC);
CREATE INDEX idx_remontees_categorie ON public.remontees_terrain(categorie);
CREATE INDEX idx_actions_remontee ON public.actions_remontees(remontee_id);
CREATE INDEX idx_syntheses_periode ON public.syntheses_remontees(periode_debut, periode_fin);