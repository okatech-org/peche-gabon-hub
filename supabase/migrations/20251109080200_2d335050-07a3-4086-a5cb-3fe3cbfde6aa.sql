-- Corriger les fonctions avec search_path pour la sécurité
CREATE OR REPLACE FUNCTION generer_numero_quittance(p_annee integer DEFAULT NULL)
RETURNS text AS $$
DECLARE
  v_annee integer;
  v_numero integer;
  v_numero_quittance text;
BEGIN
  v_annee := COALESCE(p_annee, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
  v_numero := nextval('quittance_numero_seq');
  v_numero_quittance := 'QT-' || v_annee::text || '-' || LPAD(v_numero::text, 6, '0');
  RETURN v_numero_quittance;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_generer_numero_quittance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_quittance IS NULL THEN
    NEW.numero_quittance := generer_numero_quittance(EXTRACT(YEAR FROM NEW.date_paiement)::integer);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;