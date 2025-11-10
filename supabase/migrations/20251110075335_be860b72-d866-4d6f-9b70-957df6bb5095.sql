-- Insérer des barèmes de taxes par défaut pour les captures
INSERT INTO public.bareme_taxes (nom, type_taxe, montant_fixe_kg, date_debut, actif, espece_id, description)
SELECT 
  'Taxe ' || e.nom,
  'montant_fixe_kg',
  CASE 
    WHEN e.categorie = 'demersal' THEN 50
    WHEN e.categorie = 'pelagique' THEN 100
    WHEN e.categorie = 'crustace' THEN 200
    ELSE 75
  END,
  '2024-01-01'::date,
  true,
  e.id,
  'Taxe automatique de ' || 
  CASE 
    WHEN e.categorie = 'demersal' THEN '50'
    WHEN e.categorie = 'pelagique' THEN '100'
    WHEN e.categorie = 'crustace' THEN '200'
    ELSE '75'
  END || ' FCFA/kg'
FROM public.especes e
WHERE NOT EXISTS (
  SELECT 1 FROM public.bareme_taxes bt 
  WHERE bt.espece_id = e.id AND bt.actif = true
);

-- Recalculer les taxes pour toutes les captures existantes sans taxes
DO $$
DECLARE
  v_capture RECORD;
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
  v_count INTEGER := 0;
BEGIN
  -- Parcourir toutes les captures qui n'ont pas de taxes
  FOR v_capture IN 
    SELECT cp.* 
    FROM public.captures_pa cp
    LEFT JOIN public.taxes_captures tc ON tc.capture_pa_id = cp.id
    WHERE tc.id IS NULL AND cp.declare_par IS NOT NULL
  LOOP
    -- Trouver le barème applicable
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

    -- Si un barème existe, calculer et insérer la taxe
    IF v_bareme.id IS NOT NULL THEN
      IF v_bareme.type_taxe = 'montant_fixe_kg' AND v_bareme.montant_fixe_kg IS NOT NULL THEN
        v_montant_taxe := v_capture.poids_kg * v_bareme.montant_fixe_kg;
      ELSIF v_bareme.type_taxe = 'pourcentage' AND v_bareme.taux_pourcentage IS NOT NULL THEN
        v_montant_taxe := v_capture.poids_kg * v_bareme.taux_pourcentage / 100;
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
  
  RAISE NOTICE '% taxes créées au total', v_count;
END $$;