-- Fonction pour calculer et créer automatiquement les taxes sur les captures
CREATE OR REPLACE FUNCTION calculer_taxes_capture()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
  v_poids_taxable NUMERIC;
BEGIN
  -- Trouver le barème de taxe applicable pour cette espèce et date
  SELECT *
  INTO v_bareme
  FROM bareme_taxes
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
    v_poids_taxable := NEW.poids_kg;
    
    -- Calculer le montant selon le type de taxe
    IF v_bareme.type_taxe = 'montant_fixe_kg' AND v_bareme.montant_fixe_kg IS NOT NULL THEN
      v_montant_taxe := v_poids_taxable * v_bareme.montant_fixe_kg;
    ELSIF v_bareme.type_taxe = 'pourcentage' AND v_bareme.taux_pourcentage IS NOT NULL THEN
      -- Pour un pourcentage, on suppose une valeur unitaire (pourrait être amélioré)
      v_montant_taxe := v_poids_taxable * v_bareme.taux_pourcentage / 100;
    ELSE
      v_montant_taxe := 0;
    END IF;

    -- Insérer la taxe calculée
    INSERT INTO taxes_captures (
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
      v_poids_taxable,
      CASE 
        WHEN v_bareme.type_taxe = 'montant_fixe_kg' THEN v_bareme.montant_fixe_kg
        ELSE NULL
      END,
      v_montant_taxe,
      'impaye',
      NEW.date_capture + INTERVAL '30 days' -- Échéance à 30 jours par défaut
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur les nouvelles captures
DROP TRIGGER IF EXISTS trigger_calculer_taxes_capture ON captures_pa;
CREATE TRIGGER trigger_calculer_taxes_capture
  AFTER INSERT ON captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION calculer_taxes_capture();

-- Ajouter des colonnes manquantes si nécessaire
ALTER TABLE taxes_captures
ADD COLUMN IF NOT EXISTS bareme_id uuid REFERENCES bareme_taxes(id),
ADD COLUMN IF NOT EXISTS date_echeance date;