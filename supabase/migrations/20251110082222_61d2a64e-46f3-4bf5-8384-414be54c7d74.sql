-- Supprimer toutes les taxes existantes pour éviter les doublons
DELETE FROM public.taxes_captures;

-- Générer les taxes uniquement pour les captures récentes du pêcheur (depuis le 7 nov)
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
    WHERE cp.declare_par IS NOT NULL
      AND cp.date_capture >= '2025-11-07'
    ORDER BY cp.date_capture DESC
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
  
  RAISE NOTICE '% taxes créées correctement (une par capture)', v_count;
END $$;