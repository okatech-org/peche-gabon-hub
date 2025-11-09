-- Créer une séquence pour les numéros de quittance
CREATE SEQUENCE IF NOT EXISTS quittance_numero_seq START WITH 1;

-- Fonction pour générer un numéro de quittance automatique
CREATE OR REPLACE FUNCTION generer_numero_quittance(p_annee integer DEFAULT NULL)
RETURNS text AS $$
DECLARE
  v_annee integer;
  v_numero integer;
  v_numero_quittance text;
BEGIN
  -- Utiliser l'année courante si non spécifiée
  v_annee := COALESCE(p_annee, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
  
  -- Obtenir le prochain numéro de séquence
  v_numero := nextval('quittance_numero_seq');
  
  -- Format: QT-YYYY-NNNNNN (ex: QT-2024-000001)
  v_numero_quittance := 'QT-' || v_annee::text || '-' || LPAD(v_numero::text, 6, '0');
  
  RETURN v_numero_quittance;
END;
$$ LANGUAGE plpgsql;

-- Ajouter colonne numero_quittance à paiements_groupes_taxes si elle n'existe pas
ALTER TABLE paiements_groupes_taxes 
ADD COLUMN IF NOT EXISTS numero_quittance text UNIQUE;

-- Ajouter colonne date_paiement si elle n'existe pas
ALTER TABLE paiements_groupes_taxes 
ADD COLUMN IF NOT EXISTS date_paiement timestamp with time zone DEFAULT now();

-- Trigger pour générer automatiquement un numéro de quittance
CREATE OR REPLACE FUNCTION trigger_generer_numero_quittance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_quittance IS NULL THEN
    NEW.numero_quittance := generer_numero_quittance(EXTRACT(YEAR FROM NEW.date_paiement)::integer);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_numero_quittance ON paiements_groupes_taxes;
CREATE TRIGGER auto_generate_numero_quittance
  BEFORE INSERT ON paiements_groupes_taxes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generer_numero_quittance();

-- Créer un index pour recherche rapide par numéro de quittance
CREATE INDEX IF NOT EXISTS idx_paiements_numero_quittance ON paiements_groupes_taxes(numero_quittance);

-- Mettre à jour les quittances existantes sans numéro
UPDATE paiements_groupes_taxes 
SET numero_quittance = generer_numero_quittance(EXTRACT(YEAR FROM date_paiement)::integer)
WHERE numero_quittance IS NULL;