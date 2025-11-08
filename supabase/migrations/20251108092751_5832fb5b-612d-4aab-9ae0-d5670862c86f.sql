-- Table pour stocker l'historique des recommandations IA
CREATE TABLE public.recommandations_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demandeur_id UUID NOT NULL REFERENCES auth.users(id),
  type_formation TEXT NOT NULL,
  specialites_requises TEXT[] NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lieu TEXT,
  nombre_participants INTEGER,
  total_formateurs_analyses INTEGER NOT NULL DEFAULT 0,
  analyse_globale TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les formateurs recommandés par l'IA
CREATE TABLE public.recommandations_formateurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommandation_id UUID NOT NULL REFERENCES public.recommandations_historique(id) ON DELETE CASCADE,
  formateur_id UUID NOT NULL REFERENCES public.formateurs(id) ON DELETE CASCADE,
  rang INTEGER NOT NULL CHECK (rang > 0),
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  justification TEXT NOT NULL,
  points_forts TEXT[] NOT NULL DEFAULT '{}',
  points_attention TEXT[] DEFAULT '{}',
  adequation_specialites NUMERIC NOT NULL,
  adequation_experience NUMERIC NOT NULL,
  adequation_performance NUMERIC NOT NULL,
  choisi BOOLEAN DEFAULT false,
  date_choix TIMESTAMP WITH TIME ZONE,
  choisi_par UUID REFERENCES auth.users(id),
  raison_non_choix TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recommandation_id, formateur_id)
);

-- Table pour les métriques de précision du modèle
CREATE TABLE public.recommandations_metriques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  total_recommandations INTEGER NOT NULL DEFAULT 0,
  recommandations_suivies INTEGER NOT NULL DEFAULT 0,
  taux_precision NUMERIC,
  rang_moyen_choisi NUMERIC,
  score_moyen_choisis NUMERIC,
  score_moyen_non_choisis NUMERIC,
  specialites_plus_demandees TEXT[],
  formateurs_plus_recommandes JSONB,
  formateurs_plus_choisis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_recommandations_historique_demandeur ON public.recommandations_historique(demandeur_id);
CREATE INDEX idx_recommandations_historique_date ON public.recommandations_historique(date_debut, date_fin);
CREATE INDEX idx_recommandations_formateurs_reco ON public.recommandations_formateurs(recommandation_id);
CREATE INDEX idx_recommandations_formateurs_formateur ON public.recommandations_formateurs(formateur_id);
CREATE INDEX idx_recommandations_formateurs_choisi ON public.recommandations_formateurs(choisi);

-- Trigger pour updated_at
CREATE TRIGGER update_metriques_updated_at
  BEFORE UPDATE ON public.recommandations_metriques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour recalculer les métriques de précision
CREATE OR REPLACE FUNCTION public.calculer_metriques_precision(
  p_date_debut DATE,
  p_date_fin DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_recommandations INTEGER;
  v_recommandations_suivies INTEGER;
  v_taux_precision NUMERIC;
  v_rang_moyen NUMERIC;
  v_score_moyen_choisis NUMERIC;
  v_score_moyen_non_choisis NUMERIC;
  v_result JSONB;
BEGIN
  -- Compter le total de recommandations
  SELECT COUNT(DISTINCT rh.id)
  INTO v_total_recommandations
  FROM recommandations_historique rh
  WHERE rh.created_at::date BETWEEN p_date_debut AND p_date_fin;

  -- Compter les recommandations où au moins un formateur recommandé a été choisi
  SELECT COUNT(DISTINCT rf.recommandation_id)
  INTO v_recommandations_suivies
  FROM recommandations_formateurs rf
  INNER JOIN recommandations_historique rh ON rh.id = rf.recommandation_id
  WHERE rf.choisi = true
    AND rh.created_at::date BETWEEN p_date_debut AND p_date_fin;

  -- Calculer le taux de précision
  IF v_total_recommandations > 0 THEN
    v_taux_precision = (v_recommandations_suivies::NUMERIC / v_total_recommandations::NUMERIC) * 100;
  ELSE
    v_taux_precision = 0;
  END IF;

  -- Rang moyen des formateurs choisis
  SELECT AVG(rf.rang)
  INTO v_rang_moyen
  FROM recommandations_formateurs rf
  INNER JOIN recommandations_historique rh ON rh.id = rf.recommandation_id
  WHERE rf.choisi = true
    AND rh.created_at::date BETWEEN p_date_debut AND p_date_fin;

  -- Score moyen des formateurs choisis
  SELECT AVG(rf.score)
  INTO v_score_moyen_choisis
  FROM recommandations_formateurs rf
  INNER JOIN recommandations_historique rh ON rh.id = rf.recommandation_id
  WHERE rf.choisi = true
    AND rh.created_at::date BETWEEN p_date_debut AND p_date_fin;

  -- Score moyen des formateurs non choisis
  SELECT AVG(rf.score)
  INTO v_score_moyen_non_choisis
  FROM recommandations_formateurs rf
  INNER JOIN recommandations_historique rh ON rh.id = rf.recommandation_id
  WHERE rf.choisi = false
    AND rh.created_at::date BETWEEN p_date_debut AND p_date_fin;

  -- Construire le résultat JSON
  v_result = jsonb_build_object(
    'total_recommandations', v_total_recommandations,
    'recommandations_suivies', v_recommandations_suivies,
    'taux_precision', ROUND(v_taux_precision, 2),
    'rang_moyen_choisi', ROUND(v_rang_moyen, 2),
    'score_moyen_choisis', ROUND(v_score_moyen_choisis, 2),
    'score_moyen_non_choisis', ROUND(v_score_moyen_non_choisis, 2)
  );

  RETURN v_result;
END;
$$;

-- RLS pour recommandations_historique
ALTER TABLE public.recommandations_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture historique pour rôles autorisés"
  ON public.recommandations_historique
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role) OR
    auth.uid() = demandeur_id
  );

CREATE POLICY "Création historique par utilisateurs autorisés"
  ON public.recommandations_historique
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

-- RLS pour recommandations_formateurs
ALTER TABLE public.recommandations_formateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture formateurs recommandés pour rôles autorisés"
  ON public.recommandations_formateurs
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

CREATE POLICY "Gestion formateurs recommandés par admins"
  ON public.recommandations_formateurs
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

-- RLS pour recommandations_metriques
ALTER TABLE public.recommandations_metriques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture métriques pour rôles autorisés"
  ON public.recommandations_metriques
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Gestion métriques par admins uniquement"
  ON public.recommandations_metriques
  FOR ALL
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );