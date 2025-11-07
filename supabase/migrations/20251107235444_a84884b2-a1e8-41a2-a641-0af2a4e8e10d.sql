-- Create table for external factors
CREATE TABLE public.facteurs_externes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  type_facteur TEXT NOT NULL, -- 'saison', 'economique', 'carburant', 'evenement'
  nom TEXT NOT NULL,
  description TEXT,
  impact_prevu NUMERIC NOT NULL, -- Impact en % sur le taux de recouvrement
  impact_reel NUMERIC, -- Impact réel observé
  importance TEXT NOT NULL DEFAULT 'moyenne', -- 'faible', 'moyenne', 'forte'
  valeur_numerique NUMERIC, -- Pour prix carburant, indices éco, etc.
  unite TEXT, -- FCFA/L pour carburant, % pour indices, etc.
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for seasonal patterns
CREATE TABLE public.modeles_saisonniers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  coefficient_saisonnier NUMERIC NOT NULL DEFAULT 1.0, -- 1.0 = normal, >1 = période favorable, <1 = défavorable
  nb_annees_analyse INTEGER NOT NULL DEFAULT 1,
  fiabilite NUMERIC NOT NULL DEFAULT 50, -- % de fiabilité
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mois)
);

-- Insert default seasonal pattern (neutral)
INSERT INTO public.modeles_saisonniers (mois, coefficient_saisonnier, nb_annees_analyse, fiabilite)
VALUES 
  (1, 1.0, 1, 50), (2, 1.0, 1, 50), (3, 1.0, 1, 50),
  (4, 1.0, 1, 50), (5, 1.0, 1, 50), (6, 1.0, 1, 50),
  (7, 1.0, 1, 50), (8, 1.0, 1, 50), (9, 1.0, 1, 50),
  (10, 1.0, 1, 50), (11, 1.0, 1, 50), (12, 1.0, 1, 50);

-- Enable RLS
ALTER TABLE public.facteurs_externes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modeles_saisonniers ENABLE ROW LEVEL SECURITY;

-- Create policies for facteurs_externes
CREATE POLICY "Lecture facteurs externes pour rôles autorisés"
ON public.facteurs_externes
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

CREATE POLICY "Admins et analystes peuvent gérer facteurs externes"
ON public.facteurs_externes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Create policies for modeles_saisonniers
CREATE POLICY "Lecture modèles saisonniers pour rôles autorisés"
ON public.modeles_saisonniers
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

CREATE POLICY "Admins et analystes peuvent gérer modèles saisonniers"
ON public.modeles_saisonniers
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Create indexes
CREATE INDEX idx_facteurs_externes_dates ON public.facteurs_externes(date_debut, date_fin);
CREATE INDEX idx_facteurs_externes_type ON public.facteurs_externes(type_facteur);
CREATE INDEX idx_facteurs_externes_actif ON public.facteurs_externes(actif);

-- Create triggers for updated_at
CREATE TRIGGER update_facteurs_externes_updated_at
BEFORE UPDATE ON public.facteurs_externes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modeles_saisonniers_updated_at
BEFORE UPDATE ON public.modeles_saisonniers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();