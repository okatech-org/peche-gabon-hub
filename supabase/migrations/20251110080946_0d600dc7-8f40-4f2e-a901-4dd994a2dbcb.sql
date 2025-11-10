-- Fonction pour calculer et créer automatiquement une taxe lors d'une capture
CREATE OR REPLACE FUNCTION public.calculer_taxe_capture()
RETURNS TRIGGER AS $$
DECLARE
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
BEGIN
  -- Ne rien faire si pas de déclarant
  IF NEW.declare_par IS NULL THEN
    RETURN NEW;
  END IF;

  -- Trouver le barème applicable
  SELECT * INTO v_bareme
  FROM public.bareme_taxes
  WHERE espece_id = NEW.espece_id
    AND actif = true
    AND date_debut <= NEW.date_capture
    AND (date_fin IS NULL OR date_fin >= NEW.date_capture)
    AND (seuil_min_kg IS NULL OR NEW.poids_kg >= seuil_min_kg)
    AND (seuil_max_kg IS NULL OR NEW.poids_kg <= seuil_max_kg)
  ORDER BY date_debut DESC
  LIMIT 1;

  -- Si un barème existe, calculer et insérer la taxe
  IF v_bareme.id IS NOT NULL THEN
    IF v_bareme.type_taxe = 'montant_fixe_kg' AND v_bareme.montant_fixe_kg IS NOT NULL THEN
      v_montant_taxe := NEW.poids_kg * v_bareme.montant_fixe_kg;
    ELSIF v_bareme.type_taxe = 'pourcentage' AND v_bareme.taux_pourcentage IS NOT NULL THEN
      v_montant_taxe := NEW.poids_kg * v_bareme.taux_pourcentage / 100;
    ELSE
      v_montant_taxe := 0;
    END IF;

    -- Insérer la taxe
    INSERT INTO public.taxes_captures (
      capture_pa_id,
      bareme_id,
      espece_id,
      poids_taxable_kg,
      montant_unitaire,
      montant_taxe,
      statut_paiement,
      date_echeance
    ) VALUES (
      NEW.id,
      v_bareme.id,
      NEW.espece_id,
      NEW.poids_kg,
      CASE 
        WHEN v_bareme.type_taxe = 'montant_fixe_kg' THEN v_bareme.montant_fixe_kg
        ELSE NULL
      END,
      v_montant_taxe,
      'impaye',
      NEW.date_capture + INTERVAL '30 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table captures_pa
DROP TRIGGER IF EXISTS trigger_calculer_taxe_capture ON public.captures_pa;
CREATE TRIGGER trigger_calculer_taxe_capture
  AFTER INSERT ON public.captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxe_capture();

-- Générer les taxes pour les captures récentes qui n'en ont pas
DO $$
DECLARE
  v_capture RECORD;
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
  v_count INTEGER := 0;
BEGIN
  FOR v_capture IN 
    SELECT cp.* 
    FROM public.captures_pa cp
    LEFT JOIN public.taxes_captures tc ON tc.capture_pa_id = cp.id
    WHERE tc.id IS NULL 
      AND cp.declare_par IS NOT NULL
      AND cp.date_capture >= '2025-11-07'
  LOOP
    SELECT * INTO v_bareme
    FROM public.bareme_taxes
    WHERE espece_id = v_capture.espece_id
      AND actif = true
      AND date_debut <= v_capture.date_capture
      AND (date_fin IS NULL OR date_fin >= v_capture.date_capture)
      AND (seuil_min_kg IS NULL OR v_capture.poids_kg >= seuil_min_kg)
      AND (seuil_max_kg IS NULL OR v_capture.poids_kg <= seuil_max_kg)
    ORDER BY date_debut DESC
    LIMIT 1;

    IF v_bareme.id IS NOT NULL THEN
      IF v_bareme.type_taxe = 'montant_fixe_kg' AND v_bareme.montant_fixe_kg IS NOT NULL THEN
        v_montant_taxe := v_capture.poids_kg * v_bareme.montant_fixe_kg;
      ELSIF v_bareme.type_taxe = 'pourcentage' AND v_bareme.taux_pourcentage IS NOT NULL THEN
        v_montant_taxe := v_capture.poids_kg * v_bareme.taux_pourcentage / 100;
      ELSE
        v_montant_taxe := 0;
      END IF;

      INSERT INTO public.taxes_captures (
        capture_pa_id,
        bareme_id,
        espece_id,
        poids_taxable_kg,
        montant_unitaire,
        montant_taxe,
        statut_paiement,
        date_echeance
      ) VALUES (
        v_capture.id,
        v_bareme.id,
        v_capture.espece_id,
        v_capture.poids_kg,
        CASE 
          WHEN v_bareme.type_taxe = 'montant_fixe_kg' THEN v_bareme.montant_fixe_kg
          ELSE NULL
        END,
        v_montant_taxe,
        'impaye',
        v_capture.date_capture + INTERVAL '30 days'
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '% taxes créées pour les captures récentes', v_count;
END $$;