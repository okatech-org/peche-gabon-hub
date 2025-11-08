-- Créer une table pour les seuils d'alertes
CREATE TABLE public.seuils_alertes_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  indicateur TEXT NOT NULL, -- 'captures_totales', 'cpue_moyen', 'nombre_sites'
  type_variation TEXT NOT NULL, -- 'hausse', 'baisse', 'tout'
  seuil_pourcentage NUMERIC NOT NULL DEFAULT 20, -- Variation en %
  actif BOOLEAN NOT NULL DEFAULT true,
  categorie_id UUID REFERENCES public.categories_rapports(id) ON DELETE SET NULL,
  region TEXT, -- Si null, s'applique à toutes les régions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Créer une table pour les alertes déclenchées
CREATE TABLE public.alertes_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rapport_nouveau_id UUID NOT NULL REFERENCES public.rapports_zones(id) ON DELETE CASCADE,
  rapport_reference_id UUID NOT NULL REFERENCES public.rapports_zones(id) ON DELETE CASCADE,
  seuil_id UUID NOT NULL REFERENCES public.seuils_alertes_rapports(id) ON DELETE CASCADE,
  indicateur TEXT NOT NULL,
  valeur_precedente NUMERIC NOT NULL,
  valeur_actuelle NUMERIC NOT NULL,
  variation_pourcentage NUMERIC NOT NULL,
  type_variation TEXT NOT NULL, -- 'hausse' ou 'baisse'
  severite TEXT NOT NULL DEFAULT 'moyenne', -- 'faible', 'moyenne', 'elevee'
  statut TEXT NOT NULL DEFAULT 'nouvelle', -- 'nouvelle', 'vue', 'traitee', 'ignoree'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vue_par UUID REFERENCES auth.users(id),
  vue_le TIMESTAMP WITH TIME ZONE,
  traitee_par UUID REFERENCES auth.users(id),
  traitee_le TIMESTAMP WITH TIME ZONE
);

-- Index pour recherche rapide
CREATE INDEX idx_seuils_alertes_actif ON public.seuils_alertes_rapports(actif);
CREATE INDEX idx_seuils_alertes_categorie ON public.seuils_alertes_rapports(categorie_id);
CREATE INDEX idx_alertes_rapports_nouveau ON public.alertes_rapports(rapport_nouveau_id);
CREATE INDEX idx_alertes_rapports_statut ON public.alertes_rapports(statut);
CREATE INDEX idx_alertes_rapports_created ON public.alertes_rapports(created_at DESC);

-- Enable RLS
ALTER TABLE public.seuils_alertes_rapports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes_rapports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour seuils_alertes_rapports
CREATE POLICY "Ministre peut voir tous seuils"
ON public.seuils_alertes_rapports
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Ministre peut gérer seuils"
ON public.seuils_alertes_rapports
FOR ALL
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Politiques RLS pour alertes_rapports
CREATE POLICY "Ministre peut voir alertes"
ON public.alertes_rapports
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Ministre peut mettre à jour alertes"
ON public.alertes_rapports
FOR UPDATE
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Système peut créer alertes"
ON public.alertes_rapports
FOR INSERT
WITH CHECK (true); -- L'edge function créera les alertes

-- Insérer des seuils par défaut
INSERT INTO public.seuils_alertes_rapports (nom, description, indicateur, type_variation, seuil_pourcentage, created_by) 
SELECT 
  'Baisse significative des captures',
  'Alerte en cas de baisse de plus de 20% des captures totales',
  'captures_totales',
  'baisse',
  20,
  id
FROM auth.users
LIMIT 1;

INSERT INTO public.seuils_alertes_rapports (nom, description, indicateur, type_variation, seuil_pourcentage, created_by) 
SELECT 
  'Hausse importante du CPUE',
  'Alerte en cas de hausse de plus de 30% du CPUE moyen',
  'cpue_moyen',
  'hausse',
  30,
  id
FROM auth.users
LIMIT 1;

INSERT INTO public.seuils_alertes_rapports (nom, description, indicateur, type_variation, seuil_pourcentage, created_by) 
SELECT 
  'Variation forte du nombre de sites',
  'Alerte en cas de variation de plus de 15% du nombre de sites actifs',
  'nombre_sites',
  'tout',
  15,
  id
FROM auth.users
LIMIT 1;