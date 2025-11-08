-- Table pour les objectifs de pêche (pirogues données par l'état)
CREATE TABLE public.objectifs_peche (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pirogue_id UUID NOT NULL REFERENCES public.pirogues(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  objectif_kg_annuel NUMERIC NOT NULL,
  objectif_kg_mensuel NUMERIC NOT NULL,
  date_attribution_pirogue DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'actif',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pirogue_id, annee)
);

-- Table pour les barèmes de taxes
CREATE TABLE public.bareme_taxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  type_taxe TEXT NOT NULL, -- 'capture', 'licence', 'export'
  espece_id UUID REFERENCES public.especes(id) ON DELETE SET NULL,
  taux_pourcentage NUMERIC,
  montant_fixe_kg NUMERIC,
  seuil_min_kg NUMERIC,
  seuil_max_kg NUMERIC,
  actif BOOLEAN NOT NULL DEFAULT true,
  date_debut DATE NOT NULL,
  date_fin DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les remontées institutionnelles (répartition des taxes)
CREATE TABLE public.repartition_institutionnelle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_institution TEXT NOT NULL,
  type_institution TEXT NOT NULL, -- 'etat_central', 'province', 'commune', 'cooperative', 'fonds_developpement'
  pourcentage_taxes NUMERIC NOT NULL CHECK (pourcentage_taxes >= 0 AND pourcentage_taxes <= 100),
  compte_bancaire TEXT,
  responsable TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le suivi des taxes calculées
CREATE TABLE public.taxes_calculees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capture_id UUID NOT NULL REFERENCES public.captures_pa(id) ON DELETE CASCADE,
  bareme_id UUID NOT NULL REFERENCES public.bareme_taxes(id),
  montant_taxe NUMERIC NOT NULL,
  poids_taxable_kg NUMERIC NOT NULL,
  statut_paiement TEXT NOT NULL DEFAULT 'en_attente', -- 'en_attente', 'paye', 'exonere'
  date_paiement TIMESTAMP WITH TIME ZONE,
  reference_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les remontées effectives
CREATE TABLE public.remontees_effectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taxe_id UUID NOT NULL REFERENCES public.taxes_calculees(id),
  institution_id UUID NOT NULL REFERENCES public.repartition_institutionnelle(id),
  montant_remonte NUMERIC NOT NULL,
  pourcentage_applique NUMERIC NOT NULL,
  periode_mois INTEGER NOT NULL,
  periode_annee INTEGER NOT NULL,
  statut_virement TEXT NOT NULL DEFAULT 'planifie', -- 'planifie', 'effectue', 'annule'
  date_virement TIMESTAMP WITH TIME ZONE,
  reference_virement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le suivi de performance des objectifs
CREATE TABLE public.suivi_objectifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objectif_id UUID NOT NULL REFERENCES public.objectifs_peche(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  poids_realise_kg NUMERIC NOT NULL DEFAULT 0,
  poids_objectif_kg NUMERIC NOT NULL,
  taux_realisation_pct NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN poids_objectif_kg > 0 THEN (poids_realise_kg / poids_objectif_kg * 100)
      ELSE 0
    END
  ) STORED,
  nb_sorties INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(objectif_id, mois, annee)
);

-- Enable RLS
ALTER TABLE public.objectifs_peche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bareme_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repartition_institutionnelle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxes_calculees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remontees_effectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_objectifs ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour objectifs_peche
CREATE POLICY "Lecture objectifs pour rôles autorisés"
  ON public.objectifs_peche FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'pecheur'::app_role)
  );

CREATE POLICY "Gestion objectifs par admins et direction"
  ON public.objectifs_peche FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- RLS Policies pour bareme_taxes
CREATE POLICY "Lecture barèmes taxes pour rôles autorisés"
  ON public.bareme_taxes FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

CREATE POLICY "Gestion barèmes taxes par admins"
  ON public.bareme_taxes FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

-- RLS Policies pour repartition_institutionnelle
CREATE POLICY "Lecture répartition pour rôles autorisés"
  ON public.repartition_institutionnelle FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

CREATE POLICY "Gestion répartition par ministre et admins"
  ON public.repartition_institutionnelle FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

-- RLS Policies pour taxes_calculees
CREATE POLICY "Lecture taxes calculées pour rôles autorisés"
  ON public.taxes_calculees FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

CREATE POLICY "Création taxes par système"
  ON public.taxes_calculees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Mise à jour taxes par admins"
  ON public.taxes_calculees FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- RLS Policies pour remontees_effectives
CREATE POLICY "Lecture remontées pour rôles autorisés"
  ON public.remontees_effectives FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

CREATE POLICY "Gestion remontées par admins et ministre"
  ON public.remontees_effectives FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'ministre'::app_role)
  );

-- RLS Policies pour suivi_objectifs
CREATE POLICY "Lecture suivi objectifs pour rôles autorisés"
  ON public.suivi_objectifs FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    has_role(auth.uid(), 'gestionnaire_coop'::app_role) OR
    has_role(auth.uid(), 'pecheur'::app_role)
  );

CREATE POLICY "Gestion suivi objectifs par admins"
  ON public.suivi_objectifs FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- Fonction pour calculer automatiquement les taxes sur une capture
CREATE OR REPLACE FUNCTION public.calculer_taxes_capture()
RETURNS TRIGGER AS $$
DECLARE
  v_bareme RECORD;
  v_montant_taxe NUMERIC;
BEGIN
  -- Parcourir tous les barèmes actifs applicables
  FOR v_bareme IN 
    SELECT * FROM public.bareme_taxes
    WHERE actif = true
      AND type_taxe = 'capture'
      AND (espece_id IS NULL OR espece_id = NEW.espece_id)
      AND date_debut <= NEW.date_capture
      AND (date_fin IS NULL OR date_fin >= NEW.date_capture)
      AND (seuil_min_kg IS NULL OR NEW.poids_kg >= seuil_min_kg)
      AND (seuil_max_kg IS NULL OR NEW.poids_kg <= seuil_max_kg)
  LOOP
    -- Calculer le montant de la taxe
    IF v_bareme.montant_fixe_kg IS NOT NULL THEN
      v_montant_taxe := NEW.poids_kg * v_bareme.montant_fixe_kg;
    ELSIF v_bareme.taux_pourcentage IS NOT NULL THEN
      -- Supposons un prix moyen au kg (à adapter selon vos données)
      v_montant_taxe := NEW.poids_kg * 1000 * v_bareme.taux_pourcentage / 100;
    ELSE
      v_montant_taxe := 0;
    END IF;

    -- Insérer la taxe calculée
    INSERT INTO public.taxes_calculees (
      capture_id,
      bareme_id,
      montant_taxe,
      poids_taxable_kg
    ) VALUES (
      NEW.id,
      v_bareme.id,
      v_montant_taxe,
      NEW.poids_kg
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour calculer les taxes automatiquement
CREATE TRIGGER trigger_calculer_taxes_capture
  AFTER INSERT ON public.captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_capture();

-- Fonction pour mettre à jour le suivi des objectifs
CREATE OR REPLACE FUNCTION public.update_suivi_objectifs()
RETURNS TRIGGER AS $$
DECLARE
  v_objectif RECORD;
  v_mois INTEGER;
  v_annee INTEGER;
  v_total_poids NUMERIC;
BEGIN
  v_mois := NEW.mois;
  v_annee := NEW.annee;

  -- Trouver l'objectif correspondant à cette pirogue
  SELECT * INTO v_objectif
  FROM public.objectifs_peche
  WHERE pirogue_id = NEW.pirogue_id
    AND annee = v_annee
    AND statut = 'actif';

  IF v_objectif.id IS NOT NULL THEN
    -- Calculer le total des captures pour ce mois
    SELECT COALESCE(SUM(poids_kg), 0) INTO v_total_poids
    FROM public.captures_pa
    WHERE pirogue_id = NEW.pirogue_id
      AND mois = v_mois
      AND annee = v_annee;

    -- Insérer ou mettre à jour le suivi
    INSERT INTO public.suivi_objectifs (
      objectif_id,
      mois,
      annee,
      poids_realise_kg,
      poids_objectif_kg,
      nb_sorties
    ) VALUES (
      v_objectif.id,
      v_mois,
      v_annee,
      v_total_poids,
      v_objectif.objectif_kg_mensuel,
      1
    )
    ON CONFLICT (objectif_id, mois, annee)
    DO UPDATE SET
      poids_realise_kg = v_total_poids,
      nb_sorties = suivi_objectifs.nb_sorties + 1,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour mettre à jour le suivi des objectifs
CREATE TRIGGER trigger_update_suivi_objectifs
  AFTER INSERT OR UPDATE ON public.captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suivi_objectifs();

-- Trigger pour updated_at
CREATE TRIGGER update_objectifs_peche_updated_at
  BEFORE UPDATE ON public.objectifs_peche
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bareme_taxes_updated_at
  BEFORE UPDATE ON public.bareme_taxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repartition_institutionnelle_updated_at
  BEFORE UPDATE ON public.repartition_institutionnelle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taxes_calculees_updated_at
  BEFORE UPDATE ON public.taxes_calculees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remontees_effectives_updated_at
  BEFORE UPDATE ON public.remontees_effectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suivi_objectifs_updated_at
  BEFORE UPDATE ON public.suivi_objectifs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Données initiales pour la répartition institutionnelle
INSERT INTO public.repartition_institutionnelle (nom_institution, type_institution, pourcentage_taxes) VALUES
  ('État Central', 'etat_central', 40),
  ('Province Maritime', 'province', 25),
  ('Commune Locale', 'commune', 15),
  ('Coopératives de Pêcheurs', 'cooperative', 10),
  ('Fonds de Développement Durable', 'fonds_developpement', 10);

-- Exemple de barème de taxes
INSERT INTO public.bareme_taxes (
  nom,
  type_taxe,
  montant_fixe_kg,
  date_debut,
  description
) VALUES (
  'Taxe standard pêche artisanale',
  'capture',
  50, -- 50 FCFA par kg
  '2025-01-01',
  'Taxe de base sur toutes les captures de la pêche artisanale'
);