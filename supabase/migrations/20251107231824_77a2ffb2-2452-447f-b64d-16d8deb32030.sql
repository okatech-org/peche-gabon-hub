-- Table des licences de pêche
CREATE TABLE public.licences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pirogue_id UUID NOT NULL REFERENCES public.pirogues(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  annee INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  montant_total NUMERIC NOT NULL CHECK (montant_total >= 0),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'rejetee', 'expiree')),
  especes_cibles UUID[] NOT NULL DEFAULT '{}',
  engins_autorises UUID[] NOT NULL DEFAULT '{}',
  valide_par UUID REFERENCES public.profiles(id),
  valide_le TIMESTAMP WITH TIME ZONE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (numero, annee)
);

-- Index pour performance
CREATE INDEX idx_licences_pirogue ON public.licences(pirogue_id);
CREATE INDEX idx_licences_annee ON public.licences(annee);
CREATE INDEX idx_licences_statut ON public.licences(statut);

-- Table des quittances (paiements mensuels)
CREATE TABLE public.quittances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  licence_id UUID NOT NULL REFERENCES public.licences(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  montant NUMERIC NOT NULL CHECK (montant >= 0),
  date_echeance DATE NOT NULL,
  date_paiement DATE,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'en_retard', 'annule')),
  numero_recu TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (licence_id, mois, annee)
);

-- Index pour performance
CREATE INDEX idx_quittances_licence ON public.quittances(licence_id);
CREATE INDEX idx_quittances_echeance ON public.quittances(date_echeance);
CREATE INDEX idx_quittances_statut ON public.quittances(statut);

-- Fonction pour vérifier si on est dans la fenêtre de paiement J-5/J+5
CREATE OR REPLACE FUNCTION public.est_dans_fenetre_paiement(p_date_echeance DATE)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CURRENT_DATE BETWEEN (p_date_echeance - INTERVAL '5 days') 
                          AND (p_date_echeance + INTERVAL '5 days')
$$;

-- Trigger pour mettre à jour updated_at sur licences
CREATE TRIGGER update_licences_updated_at
  BEFORE UPDATE ON public.licences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur quittances
CREATE TRIGGER update_quittances_updated_at
  BEFORE UPDATE ON public.quittances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS sur licences
ALTER TABLE public.licences ENABLE ROW LEVEL SECURITY;

-- Policies pour licences
CREATE POLICY "Lecture licences pour rôles autorisés"
  ON public.licences
  FOR SELECT
  USING (
    has_role(auth.uid(), 'pecheur'::app_role) OR
    has_role(auth.uid(), 'agent_collecte'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'inspecteur'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'analyste'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Agents peuvent gérer licences"
  ON public.licences
  FOR ALL
  USING (
    has_role(auth.uid(), 'agent_collecte'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Enable RLS sur quittances
ALTER TABLE public.quittances ENABLE ROW LEVEL SECURITY;

-- Policies pour quittances
CREATE POLICY "Lecture quittances pour rôles autorisés"
  ON public.quittances
  FOR SELECT
  USING (
    has_role(auth.uid(), 'pecheur'::app_role) OR
    has_role(auth.uid(), 'agent_collecte'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'inspecteur'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'analyste'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Agents peuvent gérer quittances"
  ON public.quittances
  FOR ALL
  USING (
    has_role(auth.uid(), 'agent_collecte'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );