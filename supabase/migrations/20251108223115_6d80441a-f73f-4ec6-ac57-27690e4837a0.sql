-- ============================================
-- MIGRATION: Structures pour données pêche Gabon
-- ============================================

-- Table pour les prix moyens unitaires par espèce
CREATE TABLE IF NOT EXISTS public.prix_moyens_unitaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espece_id UUID REFERENCES public.especes(id),
  prix_moyen_fcfa NUMERIC NOT NULL,
  unite TEXT DEFAULT 'kg',
  date_reference DATE DEFAULT CURRENT_DATE,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les captures artisanales (sorties de pêche)
CREATE TABLE IF NOT EXISTS public.sorties_artisanales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_depart DATE NOT NULL,
  date_retour DATE,
  pirogue_id UUID REFERENCES public.pirogues(id),
  zone_peche TEXT,
  site_debarquement UUID REFERENCES public.sites(id),
  engin_id UUID REFERENCES public.engins(id),
  capture_totale_kg NUMERIC DEFAULT 0,
  cpue NUMERIC,
  effort_unite NUMERIC,
  duree_jours INTEGER,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour le détail des captures par espèce (artisanal)
CREATE TABLE IF NOT EXISTS public.captures_artisanales_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sortie_id UUID REFERENCES public.sorties_artisanales(id) ON DELETE CASCADE,
  espece_id UUID REFERENCES public.especes(id),
  poids_kg NUMERIC NOT NULL,
  nb_individus INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les navires industriels (compléter si nécessaire)
CREATE TABLE IF NOT EXISTS public.navires_industriels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  immatriculation TEXT UNIQUE,
  type_licence TEXT,
  nationalite TEXT,
  pavillon TEXT,
  type_navire TEXT,
  tonnage_brut NUMERIC,
  port_attache TEXT,
  puissance_moteur NUMERIC,
  proprietaire TEXT,
  armement_id UUID REFERENCES public.armements(id),
  statut TEXT DEFAULT 'actif',
  ordre_recette TEXT,
  date_delivrance_licence DATE,
  montant_licence_euros NUMERIC,
  certificat_navigabilite BOOLEAN DEFAULT false,
  assurance_valide BOOLEAN DEFAULT false,
  agrement_sanitaire BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les marées/campagnes de pêche industrielle
CREATE TABLE IF NOT EXISTS public.marees_industrielles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navire_id UUID REFERENCES public.navires_industriels(id),
  numero_maree TEXT,
  date_depart DATE NOT NULL,
  date_retour DATE,
  duree_mer_jours INTEGER,
  jours_peche INTEGER,
  nb_traits_chalut INTEGER,
  zone_peche TEXT,
  capture_totale_kg NUMERIC DEFAULT 0,
  cpue_moyenne NUMERIC,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour le détail des captures industrielles par espèce
CREATE TABLE IF NOT EXISTS public.captures_industrielles_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maree_id UUID REFERENCES public.marees_industrielles(id) ON DELETE CASCADE,
  espece_id UUID REFERENCES public.especes(id),
  poids_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les missions de surveillance
CREATE TABLE IF NOT EXISTS public.missions_surveillance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_mission TEXT UNIQUE NOT NULL,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE,
  duree_heures NUMERIC,
  zone_surveillee TEXT,
  type_mission TEXT,
  responsable TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les contrôles et infractions
CREATE TABLE IF NOT EXISTS public.controles_surveillance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.missions_surveillance(id) ON DELETE CASCADE,
  pirogue_id UUID REFERENCES public.pirogues(id),
  navire_id UUID REFERENCES public.navires_industriels(id),
  date_controle TIMESTAMP WITH TIME ZONE NOT NULL,
  proprietaire TEXT,
  nationalite_proprietaire TEXT,
  nb_pecheurs_bord INTEGER,
  engin_declare TEXT,
  engins_trouves TEXT,
  infraction BOOLEAN DEFAULT false,
  type_infraction TEXT,
  categorie_infraction TEXT,
  saisies TEXT,
  sanctions TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les taxes artisanales (quittances)
CREATE TABLE IF NOT EXISTS public.taxes_artisanales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_quittance TEXT NOT NULL,
  pirogue_id UUID REFERENCES public.pirogues(id),
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  date_emission DATE,
  date_paiement DATE,
  montant_fcfa NUMERIC NOT NULL,
  type_taxe TEXT DEFAULT 'production',
  statut TEXT DEFAULT 'paye',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les taxes/redevances industrielles
CREATE TABLE IF NOT EXISTS public.taxes_industrielles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navire_id UUID REFERENCES public.navires_industriels(id),
  type_licence TEXT NOT NULL,
  annee INTEGER NOT NULL,
  date_delivrance DATE,
  montant_euros NUMERIC NOT NULL,
  statut_paiement TEXT DEFAULT 'paye',
  ordre_recette TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TRIGGERS pour mise à jour automatique
-- ============================================

-- Trigger pour calculer capture totale des sorties artisanales
CREATE OR REPLACE FUNCTION update_sortie_artisanale_totaux()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sorties_artisanales
  SET capture_totale_kg = (
    SELECT COALESCE(SUM(poids_kg), 0)
    FROM captures_artisanales_detail
    WHERE sortie_id = NEW.sortie_id
  )
  WHERE id = NEW.sortie_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_sortie_artisanale_totaux_trigger
AFTER INSERT OR UPDATE ON captures_artisanales_detail
FOR EACH ROW EXECUTE FUNCTION update_sortie_artisanale_totaux();

-- Trigger pour calculer capture totale des marées industrielles
CREATE OR REPLACE FUNCTION update_maree_industrielle_totaux()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marees_industrielles
  SET capture_totale_kg = (
    SELECT COALESCE(SUM(poids_kg), 0)
    FROM captures_industrielles_detail
    WHERE maree_id = NEW.maree_id
  )
  WHERE id = NEW.maree_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_maree_industrielle_totaux_trigger
AFTER INSERT OR UPDATE ON captures_industrielles_detail
FOR EACH ROW EXECUTE FUNCTION update_maree_industrielle_totaux();

-- Trigger pour updated_at
CREATE TRIGGER update_prix_moyens_unitaires_updated_at
BEFORE UPDATE ON prix_moyens_unitaires
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sorties_artisanales_updated_at
BEFORE UPDATE ON sorties_artisanales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navires_industriels_updated_at
BEFORE UPDATE ON navires_industriels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marees_industrielles_updated_at
BEFORE UPDATE ON marees_industrielles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_surveillance_updated_at
BEFORE UPDATE ON missions_surveillance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxes_artisanales_updated_at
BEFORE UPDATE ON taxes_artisanales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxes_industrielles_updated_at
BEFORE UPDATE ON taxes_industrielles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLITIQUES RLS
-- ============================================

-- Prix moyens unitaires
ALTER TABLE prix_moyens_unitaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture prix pour tous utilisateurs authentifiés"
ON prix_moyens_unitaires FOR SELECT
USING (true);

CREATE POLICY "Gestion prix par admins et direction"
ON prix_moyens_unitaires FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role)
);

-- Sorties artisanales
ALTER TABLE sorties_artisanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture sorties artisanales pour rôles autorisés"
ON sorties_artisanales FOR SELECT
USING (
  has_role(auth.uid(), 'pecheur'::app_role) OR
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion sorties artisanales par agents"
ON sorties_artisanales FOR ALL
USING (
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Captures artisanales détail
ALTER TABLE captures_artisanales_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture captures artisanales détail"
ON captures_artisanales_detail FOR SELECT
USING (
  has_role(auth.uid(), 'pecheur'::app_role) OR
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion captures artisanales détail"
ON captures_artisanales_detail FOR ALL
USING (
  has_role(auth.uid(), 'agent_collecte'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Navires industriels
ALTER TABLE navires_industriels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture navires industriels"
ON navires_industriels FOR SELECT
USING (
  has_role(auth.uid(), 'armateur_pi'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion navires industriels"
ON navires_industriels FOR ALL
USING (
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Marées industrielles
ALTER TABLE marees_industrielles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture marées industrielles"
ON marees_industrielles FOR SELECT
USING (
  has_role(auth.uid(), 'armateur_pi'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion marées industrielles"
ON marees_industrielles FOR ALL
USING (
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Captures industrielles détail
ALTER TABLE captures_industrielles_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture captures industrielles détail"
ON captures_industrielles_detail FOR SELECT
USING (
  has_role(auth.uid(), 'armateur_pi'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion captures industrielles détail"
ON captures_industrielles_detail FOR ALL
USING (
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Missions surveillance
ALTER TABLE missions_surveillance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture missions surveillance"
ON missions_surveillance FOR SELECT
USING (
  has_role(auth.uid(), 'inspecteur'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion missions surveillance"
ON missions_surveillance FOR ALL
USING (
  has_role(auth.uid(), 'inspecteur'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Contrôles surveillance
ALTER TABLE controles_surveillance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture contrôles surveillance"
ON controles_surveillance FOR SELECT
USING (
  has_role(auth.uid(), 'inspecteur'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion contrôles surveillance"
ON controles_surveillance FOR ALL
USING (
  has_role(auth.uid(), 'inspecteur'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Taxes artisanales
ALTER TABLE taxes_artisanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture taxes artisanales"
ON taxes_artisanales FOR SELECT
USING (
  has_role(auth.uid(), 'pecheur'::app_role) OR
  has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion taxes artisanales"
ON taxes_artisanales FOR ALL
USING (
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Taxes industrielles
ALTER TABLE taxes_industrielles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture taxes industrielles"
ON taxes_industrielles FOR SELECT
USING (
  has_role(auth.uid(), 'armateur_pi'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestion taxes industrielles"
ON taxes_industrielles FOR ALL
USING (
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- INDEX pour optimisation des requêtes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sorties_artisanales_date ON sorties_artisanales(date_depart);
CREATE INDEX IF NOT EXISTS idx_sorties_artisanales_pirogue ON sorties_artisanales(pirogue_id);
CREATE INDEX IF NOT EXISTS idx_captures_artisanales_sortie ON captures_artisanales_detail(sortie_id);
CREATE INDEX IF NOT EXISTS idx_captures_artisanales_espece ON captures_artisanales_detail(espece_id);

CREATE INDEX IF NOT EXISTS idx_marees_industrielles_date ON marees_industrielles(date_depart);
CREATE INDEX IF NOT EXISTS idx_marees_industrielles_navire ON marees_industrielles(navire_id);
CREATE INDEX IF NOT EXISTS idx_captures_industrielles_maree ON captures_industrielles_detail(maree_id);
CREATE INDEX IF NOT EXISTS idx_captures_industrielles_espece ON captures_industrielles_detail(espece_id);

CREATE INDEX IF NOT EXISTS idx_missions_surveillance_date ON missions_surveillance(date_debut);
CREATE INDEX IF NOT EXISTS idx_controles_surveillance_mission ON controles_surveillance(mission_id);
CREATE INDEX IF NOT EXISTS idx_controles_surveillance_date ON controles_surveillance(date_controle);

CREATE INDEX IF NOT EXISTS idx_taxes_artisanales_pirogue ON taxes_artisanales(pirogue_id);
CREATE INDEX IF NOT EXISTS idx_taxes_artisanales_periode ON taxes_artisanales(annee, mois);
CREATE INDEX IF NOT EXISTS idx_taxes_industrielles_navire ON taxes_industrielles(navire_id);
CREATE INDEX IF NOT EXISTS idx_taxes_industrielles_annee ON taxes_industrielles(annee);
