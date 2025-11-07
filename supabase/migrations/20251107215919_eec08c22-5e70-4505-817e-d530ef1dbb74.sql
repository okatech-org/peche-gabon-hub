-- =====================================================
-- ÉTAPE 2: Entités Référentielles et Flottes
-- =====================================================

-- Enum pour catégories d'espèces
CREATE TYPE espece_categorie AS ENUM ('pelagique', 'demersal', 'crustace', 'autre');

-- Enum pour types de pirogues
CREATE TYPE pirogue_type AS ENUM ('artisanale_motorisee', 'artisanale_non_motorisee', 'semi_industrielle');

-- =====================================================
-- RÉFÉRENTIELS
-- =====================================================

-- Table: Espèces
CREATE TABLE public.especes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  categorie espece_categorie NOT NULL DEFAULT 'autre',
  code TEXT UNIQUE,
  nom_scientifique TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_especes_categorie ON public.especes(categorie);
CREATE INDEX idx_especes_nom ON public.especes(nom);

COMMENT ON TABLE public.especes IS 'Référentiel des espèces de poissons et produits halieutiques';

-- Table: Engins de pêche
CREATE TABLE public.engins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_engins_nom ON public.engins(nom);

COMMENT ON TABLE public.engins IS 'Référentiel des engins de pêche (filets, lignes, etc.)';

-- Table: Strates (zones de pêche mineures)
CREATE TABLE public.strates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_strates_nom ON public.strates(nom);

COMMENT ON TABLE public.strates IS 'Strates ou zones de pêche mineures';

-- Table: Sites de débarquement
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  strate_id UUID REFERENCES public.strates(id),
  province TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_nom ON public.sites(nom);
CREATE INDEX idx_sites_strate ON public.sites(strate_id);
CREATE INDEX idx_sites_province ON public.sites(province);

COMMENT ON TABLE public.sites IS 'Sites de débarquement et ports de pêche';

-- Table: Coopératives
CREATE TABLE public.cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  site_id UUID REFERENCES public.sites(id),
  responsable TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  statut TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cooperatives_nom ON public.cooperatives(nom);
CREATE INDEX idx_cooperatives_site ON public.cooperatives(site_id);

COMMENT ON TABLE public.cooperatives IS 'Coopératives de pêcheurs';

-- =====================================================
-- ACTEURS & FLOTTES
-- =====================================================

-- Table: Propriétaires de pirogues
CREATE TABLE public.proprietaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nationalite TEXT DEFAULT 'Gabonaise',
  statut TEXT,
  type_carte TEXT,
  piece_id TEXT UNIQUE,
  domicile TEXT,
  telephone TEXT,
  email TEXT,
  date_naissance DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proprietaires_nom ON public.proprietaires(nom, prenom);
CREATE INDEX idx_proprietaires_piece ON public.proprietaires(piece_id);

COMMENT ON TABLE public.proprietaires IS 'Propriétaires de pirogues de pêche artisanale';

-- Table: Pirogues
CREATE TABLE public.pirogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  immatriculation TEXT NOT NULL UNIQUE,
  proprietaire_id UUID NOT NULL REFERENCES public.proprietaires(id) ON DELETE CASCADE,
  type pirogue_type NOT NULL DEFAULT 'artisanale_motorisee',
  moteur_marque TEXT,
  puissance_cv DECIMAL(6, 2),
  annee_construction INTEGER,
  nb_pecheurs INTEGER CHECK (nb_pecheurs > 0),
  cooperative_id UUID REFERENCES public.cooperatives(id),
  site_attache_id UUID REFERENCES public.sites(id),
  longueur_m DECIMAL(5, 2),
  largeur_m DECIMAL(5, 2),
  materiau TEXT,
  statut TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pirogues_immatriculation ON public.pirogues(immatriculation);
CREATE INDEX idx_pirogues_proprietaire ON public.pirogues(proprietaire_id);
CREATE INDEX idx_pirogues_cooperative ON public.pirogues(cooperative_id);
CREATE INDEX idx_pirogues_site ON public.pirogues(site_attache_id);
CREATE INDEX idx_pirogues_statut ON public.pirogues(statut);

COMMENT ON TABLE public.pirogues IS 'Flotte de pêche artisanale (pirogues)';

-- Table: Armements (pêche industrielle)
CREATE TABLE public.armements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  responsable TEXT,
  statut TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_armements_nom ON public.armements(nom);

COMMENT ON TABLE public.armements IS 'Sociétés armement pour la pêche industrielle';

-- Table: Navires (pêche industrielle)
CREATE TABLE public.navires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  matricule TEXT NOT NULL UNIQUE,
  armement_id UUID NOT NULL REFERENCES public.armements(id) ON DELETE CASCADE,
  capitaine TEXT,
  type_navire TEXT,
  pavillon TEXT,
  port_attache TEXT,
  jauge_brute DECIMAL(10, 2),
  puissance_moteur_kw DECIMAL(10, 2),
  longueur_m DECIMAL(6, 2),
  largeur_m DECIMAL(6, 2),
  annee_construction INTEGER,
  statut TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_navires_matricule ON public.navires(matricule);
CREATE INDEX idx_navires_armement ON public.navires(armement_id);
CREATE INDEX idx_navires_statut ON public.navires(statut);

COMMENT ON TABLE public.navires IS 'Flotte de pêche industrielle (navires)';

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE TRIGGER update_especes_updated_at
  BEFORE UPDATE ON public.especes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engins_updated_at
  BEFORE UPDATE ON public.engins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strates_updated_at
  BEFORE UPDATE ON public.strates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cooperatives_updated_at
  BEFORE UPDATE ON public.cooperatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proprietaires_updated_at
  BEFORE UPDATE ON public.proprietaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pirogues_updated_at
  BEFORE UPDATE ON public.pirogues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_armements_updated_at
  BEFORE UPDATE ON public.armements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_navires_updated_at
  BEFORE UPDATE ON public.navires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Espèces: lecture publique, écriture pour agents/admin
ALTER TABLE public.especes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent consulter les espèces"
  ON public.especes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents et admins peuvent gérer les espèces"
  ON public.especes FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'direction_centrale')
  );

-- Engins: même politique que espèces
ALTER TABLE public.engins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent consulter les engins"
  ON public.engins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents et admins peuvent gérer les engins"
  ON public.engins FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'direction_centrale')
  );

-- Strates: lecture publique
ALTER TABLE public.strates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent consulter les strates"
  ON public.strates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins et directions peuvent gérer les strates"
  ON public.strates FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'direction_provinciale')
  );

-- Sites: lecture publique
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent consulter les sites"
  ON public.sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins et directions peuvent gérer les sites"
  ON public.sites FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'direction_provinciale')
  );

-- Coopératives
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent consulter les coopératives"
  ON public.cooperatives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestionnaires peuvent modifier leur coopérative"
  ON public.cooperatives FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale')
  );

CREATE POLICY "Admins et directions peuvent créer/supprimer coopératives"
  ON public.cooperatives FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale')
  );

-- Propriétaires
ALTER TABLE public.proprietaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture propriétaires pour rôles autorisés"
  ON public.proprietaires FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste')
  );

CREATE POLICY "Agents et admins peuvent gérer propriétaires"
  ON public.proprietaires FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop')
  );

-- Pirogues
ALTER TABLE public.pirogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pirogues pour rôles autorisés"
  ON public.pirogues FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'pecheur') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste')
  );

CREATE POLICY "Agents et gestionnaires peuvent gérer pirogues"
  ON public.pirogues FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop')
  );

-- Armements
ALTER TABLE public.armements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture armements pour rôles autorisés"
  ON public.armements FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'armateur_pi') OR
    has_role(auth.uid(), 'observateur_pi') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste')
  );

CREATE POLICY "Admins et direction peuvent gérer armements"
  ON public.armements FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'direction_centrale')
  );

-- Navires
ALTER TABLE public.navires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture navires pour rôles autorisés"
  ON public.navires FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'armateur_pi') OR
    has_role(auth.uid(), 'observateur_pi') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste')
  );

CREATE POLICY "Armateurs peuvent gérer leurs navires"
  ON public.navires FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'armateur_pi') OR
    has_role(auth.uid(), 'direction_centrale')
  );
