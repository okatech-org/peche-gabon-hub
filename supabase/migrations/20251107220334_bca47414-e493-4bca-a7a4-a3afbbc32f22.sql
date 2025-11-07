-- =====================================================
-- CAPTURES ARTISANALES (Pêche Artisanale)
-- =====================================================

-- Table: Captures PA (déclarations de captures)
CREATE TABLE IF NOT EXISTS public.captures_pa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pirogue_id UUID NOT NULL REFERENCES public.pirogues(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id),
  date_capture DATE NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  engin_id UUID NOT NULL REFERENCES public.engins(id),
  espece_id UUID NOT NULL REFERENCES public.especes(id),
  poids_kg DECIMAL(10, 2) NOT NULL CHECK (poids_kg > 0),
  nb_individus INTEGER CHECK (nb_individus >= 0),
  effort_unite DECIMAL(8, 2) CHECK (effort_unite > 0),
  cpue DECIMAL(10, 4) GENERATED ALWAYS AS (
    CASE 
      WHEN effort_unite IS NOT NULL AND effort_unite > 0 
      THEN poids_kg / effort_unite
      ELSE NULL
    END
  ) STORED,
  zone_peche TEXT,
  observations TEXT,
  declare_par UUID REFERENCES auth.users(id),
  valide BOOLEAN DEFAULT false,
  valide_par UUID REFERENCES auth.users(id),
  valide_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_captures_pa_pirogue ON public.captures_pa(pirogue_id);
CREATE INDEX idx_captures_pa_site ON public.captures_pa(site_id);
CREATE INDEX idx_captures_pa_date ON public.captures_pa(date_capture);
CREATE INDEX idx_captures_pa_annee_mois ON public.captures_pa(annee, mois);
CREATE INDEX idx_captures_pa_engin ON public.captures_pa(engin_id);
CREATE INDEX idx_captures_pa_espece ON public.captures_pa(espece_id);
CREATE INDEX idx_captures_pa_valide ON public.captures_pa(valide);

COMMENT ON TABLE public.captures_pa IS 'Déclarations de captures pour la pêche artisanale';
COMMENT ON COLUMN public.captures_pa.cpue IS 'Capture Par Unité d''Effort (calculée automatiquement)';
COMMENT ON COLUMN public.captures_pa.effort_unite IS 'Effort de pêche (heures, nombre de sorties, etc.)';

-- Table: Sorties de pêche (Base Propre PA)
CREATE TABLE IF NOT EXISTS public.sorties_peche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pirogue_id UUID NOT NULL REFERENCES public.pirogues(id) ON DELETE CASCADE,
  cooperative_id UUID REFERENCES public.cooperatives(id),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  strate_id UUID REFERENCES public.strates(id),
  date_depart DATE NOT NULL,
  date_retour DATE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  capitaine TEXT,
  nb_pecheurs INTEGER CHECK (nb_pecheurs > 0),
  engin_id UUID REFERENCES public.engins(id),
  zone_peche TEXT,
  effort_heures DECIMAL(6, 2) CHECK (effort_heures >= 0),
  capture_totale_kg DECIMAL(10, 2) DEFAULT 0 CHECK (capture_totale_kg >= 0),
  pelagiques_kg DECIMAL(10, 2) DEFAULT 0 CHECK (pelagiques_kg >= 0),
  demersaux_kg DECIMAL(10, 2) DEFAULT 0 CHECK (demersaux_kg >= 0),
  crustaces_kg DECIMAL(10, 2) DEFAULT 0 CHECK (crustaces_kg >= 0),
  cpue DECIMAL(10, 4) GENERATED ALWAYS AS (
    CASE 
      WHEN effort_heures IS NOT NULL AND effort_heures > 0 
      THEN capture_totale_kg / effort_heures
      ELSE NULL
    END
  ) STORED,
  observations TEXT,
  declare_par UUID REFERENCES auth.users(id),
  valide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sorties_pirogue ON public.sorties_peche(pirogue_id);
CREATE INDEX idx_sorties_site ON public.sorties_peche(site_id);
CREATE INDEX idx_sorties_cooperative ON public.sorties_peche(cooperative_id);
CREATE INDEX idx_sorties_date_depart ON public.sorties_peche(date_depart);
CREATE INDEX idx_sorties_annee_mois ON public.sorties_peche(annee, mois);

COMMENT ON TABLE public.sorties_peche IS 'Sorties de pêche consolidées (Base Propre PA)';

-- Table: Détail des captures par sortie
CREATE TABLE IF NOT EXISTS public.captures_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sortie_id UUID NOT NULL REFERENCES public.sorties_peche(id) ON DELETE CASCADE,
  espece_id UUID NOT NULL REFERENCES public.especes(id),
  poids_kg DECIMAL(10, 2) NOT NULL CHECK (poids_kg > 0),
  nb_individus INTEGER CHECK (nb_individus >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_captures_detail_sortie ON public.captures_detail(sortie_id);
CREATE INDEX idx_captures_detail_espece ON public.captures_detail(espece_id);

COMMENT ON TABLE public.captures_detail IS 'Détail des captures par espèce pour chaque sortie';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_captures_pa_updated_at
  BEFORE UPDATE ON public.captures_pa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sorties_peche_updated_at
  BEFORE UPDATE ON public.sorties_peche
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour mettre à jour les totaux de capture
CREATE OR REPLACE FUNCTION update_sortie_totaux()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour le total de la sortie
  UPDATE sorties_peche
  SET capture_totale_kg = (
    SELECT COALESCE(SUM(poids_kg), 0)
    FROM captures_detail
    WHERE sortie_id = NEW.sortie_id
  )
  WHERE id = NEW.sortie_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_sortie_totaux_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.captures_detail
  FOR EACH ROW EXECUTE FUNCTION update_sortie_totaux();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Captures PA
ALTER TABLE public.captures_pa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pêcheurs peuvent voir captures de leur pirogue" ON public.captures_pa;
CREATE POLICY "Pêcheurs peuvent voir captures de leur pirogue"
  ON public.captures_pa FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'pecheur') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste') OR
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Pêcheurs et agents peuvent déclarer captures" ON public.captures_pa;
CREATE POLICY "Pêcheurs et agents peuvent déclarer captures"
  ON public.captures_pa FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'pecheur') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Agents peuvent modifier captures" ON public.captures_pa;
CREATE POLICY "Agents peuvent modifier captures"
  ON public.captures_pa FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins peuvent supprimer captures" ON public.captures_pa;
CREATE POLICY "Admins peuvent supprimer captures"
  ON public.captures_pa FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Sorties de pêche
ALTER TABLE public.sorties_peche ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture sorties pour rôles autorisés" ON public.sorties_peche;
CREATE POLICY "Lecture sorties pour rôles autorisés"
  ON public.sorties_peche FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'pecheur') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste') OR
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Agents peuvent gérer sorties" ON public.sorties_peche;
CREATE POLICY "Agents peuvent gérer sorties"
  ON public.sorties_peche FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'admin')
  );

-- Captures détail
ALTER TABLE public.captures_detail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture captures détail pour rôles autorisés" ON public.captures_detail;
CREATE POLICY "Lecture captures détail pour rôles autorisés"
  ON public.captures_detail FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'pecheur') OR
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'inspecteur') OR
    has_role(auth.uid(), 'direction_provinciale') OR
    has_role(auth.uid(), 'direction_centrale') OR
    has_role(auth.uid(), 'analyste') OR
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Agents peuvent gérer captures détail" ON public.captures_detail;
CREATE POLICY "Agents peuvent gérer captures détail"
  ON public.captures_detail FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'agent_collecte') OR
    has_role(auth.uid(), 'gestionnaire_coop') OR
    has_role(auth.uid(), 'admin')
  );
