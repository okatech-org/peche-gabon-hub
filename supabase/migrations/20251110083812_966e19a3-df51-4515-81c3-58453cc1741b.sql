-- Ajouter les colonnes manquantes à la table sorties_peche
ALTER TABLE public.sorties_peche
ADD COLUMN IF NOT EXISTS heure_depart time,
ADD COLUMN IF NOT EXISTS heure_retour time,
ADD COLUMN IF NOT EXISTS pecheur_id uuid REFERENCES auth.users(id);

-- Créer un index sur pecheur_id pour les performances
CREATE INDEX IF NOT EXISTS idx_sorties_peche_pecheur ON public.sorties_peche(pecheur_id);

-- Mettre à jour les RLS policies pour inclure pecheur_id
DROP POLICY IF EXISTS "Pêcheurs peuvent voir leurs sorties" ON public.sorties_peche;
CREATE POLICY "Pêcheurs peuvent voir leurs sorties"
ON public.sorties_peche FOR SELECT
USING (
  pecheur_id = auth.uid() OR
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Pêcheurs peuvent créer leurs sorties" ON public.sorties_peche;
CREATE POLICY "Pêcheurs peuvent créer leurs sorties"
ON public.sorties_peche FOR INSERT
WITH CHECK (
  pecheur_id = auth.uid() OR
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Pêcheurs peuvent modifier leurs sorties" ON public.sorties_peche;
CREATE POLICY "Pêcheurs peuvent modifier leurs sorties"
ON public.sorties_peche FOR UPDATE
USING (
  pecheur_id = auth.uid() OR
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);