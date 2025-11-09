-- Ajouter une colonne cooperative_id aux users via profiles ou user_roles
-- Les pêcheurs appartenant à une coopérative doivent avoir cette info

-- Table pour lier les pêcheurs aux coopératives
CREATE TABLE IF NOT EXISTS public.pecheurs_cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pecheur_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cooperative_id UUID NOT NULL REFERENCES public.cooperatives(id) ON DELETE CASCADE,
  date_adhesion DATE DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'actif', -- actif, suspendu, inactif
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pecheur_user_id, cooperative_id)
);

CREATE INDEX IF NOT EXISTS idx_pecheurs_cooperatives_pecheur ON public.pecheurs_cooperatives(pecheur_user_id);
CREATE INDEX IF NOT EXISTS idx_pecheurs_cooperatives_coop ON public.pecheurs_cooperatives(cooperative_id);

-- Ajouter user_id aux coopératives pour lier un gestionnaire
ALTER TABLE public.cooperatives ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_cooperatives_user_id ON public.cooperatives(user_id);

-- Table pour gérer les paiements groupés de taxes
CREATE TABLE IF NOT EXISTS public.paiements_groupes_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id UUID NOT NULL REFERENCES public.cooperatives(id),
  gestionnaire_id UUID NOT NULL REFERENCES auth.users(id),
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_total NUMERIC NOT NULL,
  mode_paiement TEXT, -- especes, cheque, virement, mobile_money
  reference_paiement TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paiements_groupes_coop ON public.paiements_groupes_taxes(cooperative_id);

-- Table de liaison entre paiements groupés et taxes individuelles
CREATE TABLE IF NOT EXISTS public.paiements_taxes_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paiement_groupe_id UUID NOT NULL REFERENCES public.paiements_groupes_taxes(id) ON DELETE CASCADE,
  taxe_capture_id UUID NOT NULL REFERENCES public.taxes_captures(id) ON DELETE CASCADE,
  montant_paye NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paiements_taxes_detail_groupe ON public.paiements_taxes_detail(paiement_groupe_id);
CREATE INDEX IF NOT EXISTS idx_paiements_taxes_detail_taxe ON public.paiements_taxes_detail(taxe_capture_id);

-- Mettre à jour les RLS pour pecheurs_cooperatives
ALTER TABLE public.pecheurs_cooperatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestionnaires voient membres de leur coop"
ON public.pecheurs_cooperatives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cooperatives c
    WHERE c.id = pecheurs_cooperatives.cooperative_id 
    AND c.user_id = auth.uid()
  ) OR
  pecheur_user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);

CREATE POLICY "Gestionnaires gèrent membres de leur coop"
ON public.pecheurs_cooperatives
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cooperatives c
    WHERE c.id = pecheurs_cooperatives.cooperative_id 
    AND c.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cooperatives c
    WHERE c.id = pecheurs_cooperatives.cooperative_id 
    AND c.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);

-- RLS pour paiements_groupes_taxes
ALTER TABLE public.paiements_groupes_taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestionnaires voient paiements de leur coop"
ON public.paiements_groupes_taxes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cooperatives c
    WHERE c.id = paiements_groupes_taxes.cooperative_id 
    AND c.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);

CREATE POLICY "Gestionnaires créent paiements pour leur coop"
ON public.paiements_groupes_taxes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cooperatives c
    WHERE c.id = paiements_groupes_taxes.cooperative_id 
    AND c.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS pour paiements_taxes_detail
ALTER TABLE public.paiements_taxes_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès paiements detail via groupe"
ON public.paiements_taxes_detail
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM paiements_groupes_taxes pg
    JOIN cooperatives c ON pg.cooperative_id = c.id
    WHERE pg.id = paiements_taxes_detail.paiement_groupe_id 
    AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM paiements_groupes_taxes pg
    JOIN cooperatives c ON pg.cooperative_id = c.id
    WHERE pg.id = paiements_taxes_detail.paiement_groupe_id 
    AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Mettre à jour la policy des taxes_captures pour que les gestionnaires voient les taxes de leurs membres
CREATE POLICY "Gestionnaires voient taxes de leurs membres"
ON public.taxes_captures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM captures_pa cp
    JOIN pecheurs_cooperatives pc ON cp.declare_par = pc.pecheur_user_id
    JOIN cooperatives c ON pc.cooperative_id = c.id
    WHERE cp.id = taxes_captures.capture_pa_id 
    AND c.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM captures_pa cp
    WHERE cp.id = taxes_captures.capture_pa_id 
    AND cp.declare_par = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);