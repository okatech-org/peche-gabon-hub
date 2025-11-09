-- Table pour stocker les taxes calculées sur les captures
CREATE TABLE IF NOT EXISTS public.taxes_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Références selon le type
  capture_pa_id UUID REFERENCES public.captures_pa(id) ON DELETE CASCADE,
  maree_industrielle_id UUID REFERENCES public.marees_industrielles(id) ON DELETE CASCADE,
  
  -- Informations de taxation
  type_taxe TEXT NOT NULL DEFAULT 'capture', -- capture, licence, exportation
  bareme_id UUID REFERENCES public.bareme_taxes(id),
  
  -- Calculs
  poids_taxable_kg NUMERIC NOT NULL,
  taux_applique NUMERIC, -- pourcentage si applicable
  montant_unitaire NUMERIC, -- montant par kg si applicable
  montant_taxe NUMERIC NOT NULL,
  
  -- Espèce concernée
  espece_id UUID REFERENCES public.especes(id),
  
  -- Statut de paiement
  statut_paiement TEXT DEFAULT 'impaye', -- impaye, paye, exonere
  date_paiement TIMESTAMP WITH TIME ZONE,
  quittance_numero TEXT,
  
  -- Métadonnées
  notes TEXT
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_taxes_captures_pa ON public.taxes_captures(capture_pa_id);
CREATE INDEX IF NOT EXISTS idx_taxes_captures_maree ON public.taxes_captures(maree_industrielle_id);
CREATE INDEX IF NOT EXISTS idx_taxes_captures_statut ON public.taxes_captures(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_taxes_captures_espece ON public.taxes_captures(espece_id);

-- Vue pour calculer le total des taxes par utilisateur/armement
CREATE OR REPLACE VIEW public.taxes_dues_summary AS
SELECT 
  COALESCE(
    cp.declare_par,
    (SELECT a.user_id FROM armements a 
     JOIN navires n ON n.armement_id = a.id 
     JOIN marees_industrielles mi ON mi.navire_id = n.id 
     WHERE mi.id = tc.maree_industrielle_id LIMIT 1)
  ) as user_id,
  tc.statut_paiement,
  COUNT(*) as nombre_taxes,
  SUM(tc.montant_taxe) as montant_total,
  MIN(tc.created_at) as date_plus_ancienne,
  MAX(tc.created_at) as date_plus_recente
FROM public.taxes_captures tc
LEFT JOIN public.captures_pa cp ON tc.capture_pa_id = cp.id
GROUP BY 
  COALESCE(
    cp.declare_par,
    (SELECT a.user_id FROM armements a 
     JOIN navires n ON n.armement_id = a.id 
     JOIN marees_industrielles mi ON mi.navire_id = n.id 
     WHERE mi.id = tc.maree_industrielle_id LIMIT 1)
  ),
  tc.statut_paiement;

-- Fonction pour calculer les taxes sur une capture PA
CREATE OR REPLACE FUNCTION public.calculer_taxes_capture_pa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
BEGIN
  -- Supprimer les anciennes taxes pour cette capture
  DELETE FROM public.taxes_captures WHERE capture_pa_id = NEW.id;
  
  -- Parcourir les barèmes actifs
  FOR v_bareme IN 
    SELECT * FROM public.bareme_taxes
    WHERE actif = true
      AND type_taxe = 'capture'
      AND date_debut <= NEW.date_capture
      AND (date_fin IS NULL OR date_fin >= NEW.date_capture)
      AND (espece_id IS NULL OR espece_id = NEW.espece_id)
      AND (seuil_min_kg IS NULL OR NEW.poids_kg >= seuil_min_kg)
      AND (seuil_max_kg IS NULL OR NEW.poids_kg <= seuil_max_kg)
  LOOP
    -- Calculer le montant
    IF v_bareme.montant_fixe_kg IS NOT NULL THEN
      v_montant_taxe := NEW.poids_kg * v_bareme.montant_fixe_kg;
    ELSIF v_bareme.taux_pourcentage IS NOT NULL THEN
      -- Supposer un prix moyen de 1000 FCFA/kg pour calcul
      v_montant_taxe := NEW.poids_kg * 1000 * v_bareme.taux_pourcentage / 100;
    ELSE
      v_montant_taxe := 0;
    END IF;

    -- Insérer la taxe calculée
    INSERT INTO public.taxes_captures (
      capture_pa_id,
      type_taxe,
      bareme_id,
      poids_taxable_kg,
      taux_applique,
      montant_unitaire,
      montant_taxe,
      espece_id,
      statut_paiement
    ) VALUES (
      NEW.id,
      'capture',
      v_bareme.id,
      NEW.poids_kg,
      v_bareme.taux_pourcentage,
      v_bareme.montant_fixe_kg,
      v_montant_taxe,
      NEW.espece_id,
      'impaye'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger pour calculer automatiquement les taxes sur captures PA
DROP TRIGGER IF EXISTS trigger_calculer_taxes_capture_pa ON public.captures_pa;
CREATE TRIGGER trigger_calculer_taxes_capture_pa
  AFTER INSERT OR UPDATE OF poids_kg, espece_id, date_capture
  ON public.captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_capture_pa();

-- Fonction pour calculer les taxes sur une marée industrielle
CREATE OR REPLACE FUNCTION public.calculer_taxes_maree_industrielle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
  v_capture_detail RECORD;
BEGIN
  -- Supprimer les anciennes taxes pour cette marée
  DELETE FROM public.taxes_captures WHERE maree_industrielle_id = NEW.id;
  
  -- Calculer les taxes par espèce capturée
  FOR v_capture_detail IN 
    SELECT * FROM public.captures_industrielles_detail
    WHERE maree_id = NEW.id
  LOOP
    FOR v_bareme IN 
      SELECT * FROM public.bareme_taxes
      WHERE actif = true
        AND type_taxe = 'capture'
        AND date_debut <= NEW.date_depart
        AND (date_fin IS NULL OR date_fin >= NEW.date_depart)
        AND (espece_id IS NULL OR espece_id = v_capture_detail.espece_id)
        AND (seuil_min_kg IS NULL OR v_capture_detail.poids_kg >= seuil_min_kg)
        AND (seuil_max_kg IS NULL OR v_capture_detail.poids_kg <= seuil_max_kg)
    LOOP
      -- Calculer le montant
      IF v_bareme.montant_fixe_kg IS NOT NULL THEN
        v_montant_taxe := v_capture_detail.poids_kg * v_bareme.montant_fixe_kg;
      ELSIF v_bareme.taux_pourcentage IS NOT NULL THEN
        -- Supposer un prix moyen de 2000 FCFA/kg pour pêche industrielle
        v_montant_taxe := v_capture_detail.poids_kg * 2000 * v_bareme.taux_pourcentage / 100;
      ELSE
        v_montant_taxe := 0;
      END IF;

      -- Insérer la taxe calculée
      INSERT INTO public.taxes_captures (
        maree_industrielle_id,
        type_taxe,
        bareme_id,
        poids_taxable_kg,
        taux_applique,
        montant_unitaire,
        montant_taxe,
        espece_id,
        statut_paiement
      ) VALUES (
        NEW.id,
        'capture',
        v_bareme.id,
        v_capture_detail.poids_kg,
        v_bareme.taux_pourcentage,
        v_bareme.montant_fixe_kg,
        v_montant_taxe,
        v_capture_detail.espece_id,
        'impaye'
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger pour calculer les taxes sur marées industrielles
DROP TRIGGER IF EXISTS trigger_calculer_taxes_maree_industrielle ON public.marees_industrielles;
CREATE TRIGGER trigger_calculer_taxes_maree_industrielle
  AFTER INSERT OR UPDATE OF capture_totale_kg
  ON public.marees_industrielles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_maree_industrielle();

-- Trigger aussi sur les détails des captures industrielles
DROP TRIGGER IF EXISTS trigger_calculer_taxes_capture_industrielle_detail ON public.captures_industrielles_detail;
CREATE TRIGGER trigger_calculer_taxes_capture_industrielle_detail
  AFTER INSERT OR UPDATE OR DELETE
  ON public.captures_industrielles_detail
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_maree_industrielle();

-- RLS Policies pour taxes_captures
ALTER TABLE public.taxes_captures ENABLE ROW LEVEL SECURITY;

-- Les pêcheurs peuvent voir leurs taxes
CREATE POLICY "Pêcheurs peuvent voir leurs taxes"
ON public.taxes_captures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM captures_pa cp
    WHERE cp.id = taxes_captures.capture_pa_id 
    AND cp.declare_par = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role)
);

-- Les armateurs peuvent voir leurs taxes
CREATE POLICY "Armateurs peuvent voir leurs taxes"
ON public.taxes_captures
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM marees_industrielles mi
    JOIN navires n ON mi.navire_id = n.id
    JOIN armements a ON n.armement_id = a.id
    WHERE mi.id = taxes_captures.maree_industrielle_id 
    AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role)
);

-- Admins peuvent gérer les taxes
CREATE POLICY "Admins peuvent gérer taxes"
ON public.taxes_captures
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);