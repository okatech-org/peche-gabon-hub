-- Créer une table pour les statistiques fiscales agrégées
CREATE TABLE IF NOT EXISTS statistiques_fiscales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie text NOT NULL CHECK (categorie IN ('Pêche Artisanale', 'Pêche Industrielle', 'Coopérative')),
  type_taxe text NOT NULL,
  periode text, -- ex: '2024', 'Janvier 2024', etc.
  montant_fcfa numeric NOT NULL,
  montant_eur numeric,
  nombre_contribuables integer,
  details jsonb, -- Pour stocker des informations additionnelles
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances de requêtes
CREATE INDEX IF NOT EXISTS idx_stats_fiscales_categorie ON statistiques_fiscales(categorie);
CREATE INDEX IF NOT EXISTS idx_stats_fiscales_periode ON statistiques_fiscales(periode);

-- Activer RLS
ALTER TABLE statistiques_fiscales ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture
CREATE POLICY "Lecture stats fiscales pour rôles autorisés"
ON statistiques_fiscales FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Politique pour l'insertion/modification (admins seulement)
CREATE POLICY "Gestion stats fiscales pour admins"
ON statistiques_fiscales FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);