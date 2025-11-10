-- Ajouter la colonne mode_paiement à la table taxes_captures
ALTER TABLE taxes_captures 
ADD COLUMN IF NOT EXISTS mode_paiement TEXT;