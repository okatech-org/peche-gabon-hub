-- Table pour stocker les configurations de rapports automatisés
CREATE TABLE IF NOT EXISTS public.rapports_automatises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  type_rapport TEXT NOT NULL CHECK (type_rapport IN ('financier', 'captures', 'surveillance', 'complet')),
  frequence TEXT NOT NULL DEFAULT 'mensuel' CHECK (frequence IN ('hebdomadaire', 'mensuel', 'trimestriel')),
  jour_execution INTEGER CHECK (jour_execution BETWEEN 1 AND 31),
  heure_execution TIME DEFAULT '08:00',
  actif BOOLEAN DEFAULT true,
  filtres JSONB DEFAULT '{}',
  destinataires TEXT[] NOT NULL,
  copie_cachee TEXT[],
  template_email TEXT,
  derniere_execution TIMESTAMP WITH TIME ZONE,
  prochaine_execution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'historique des envois
CREATE TABLE IF NOT EXISTS public.rapports_envois_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID REFERENCES public.rapports_automatises(id) ON DELETE CASCADE,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT now(),
  statut TEXT NOT NULL CHECK (statut IN ('succes', 'echec', 'en_cours')),
  nb_destinataires INTEGER,
  fichier_path TEXT,
  taille_fichier_kb INTEGER,
  message_erreur TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les parties prenantes
CREATE TABLE IF NOT EXISTS public.parties_prenantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organisation TEXT,
  fonction TEXT,
  telephone TEXT,
  types_rapports TEXT[] DEFAULT '{}',
  actif BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_rapports_automatises_actif ON public.rapports_automatises(actif);
CREATE INDEX IF NOT EXISTS idx_rapports_automatises_prochaine_execution ON public.rapports_automatises(prochaine_execution);
CREATE INDEX IF NOT EXISTS idx_rapports_envois_rapport_id ON public.rapports_envois_historique(rapport_id);
CREATE INDEX IF NOT EXISTS idx_rapports_envois_date ON public.rapports_envois_historique(date_envoi);
CREATE INDEX IF NOT EXISTS idx_parties_prenantes_email ON public.parties_prenantes(email);

-- RLS Policies
ALTER TABLE public.rapports_automatises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_envois_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties_prenantes ENABLE ROW LEVEL SECURITY;

-- Policies pour rapports_automatises (admin et ministre peuvent tout faire)
CREATE POLICY "Admin et ministre peuvent voir rapports automatisés"
  ON public.rapports_automatises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent créer rapports automatisés"
  ON public.rapports_automatises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent modifier rapports automatisés"
  ON public.rapports_automatises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent supprimer rapports automatisés"
  ON public.rapports_automatises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

-- Policies pour rapports_envois_historique
CREATE POLICY "Admin et ministre peuvent voir historique envois"
  ON public.rapports_envois_historique FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Service role peut insérer dans historique"
  ON public.rapports_envois_historique FOR INSERT
  WITH CHECK (true);

-- Policies pour parties_prenantes
CREATE POLICY "Admin et ministre peuvent voir parties prenantes"
  ON public.parties_prenantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent créer parties prenantes"
  ON public.parties_prenantes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent modifier parties prenantes"
  ON public.parties_prenantes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent supprimer parties prenantes"
  ON public.parties_prenantes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_rapports_automatises_updated_at
  BEFORE UPDATE ON public.rapports_automatises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parties_prenantes_updated_at
  BEFORE UPDATE ON public.parties_prenantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer la prochaine exécution
CREATE OR REPLACE FUNCTION calculer_prochaine_execution(
  p_frequence TEXT,
  p_jour_execution INTEGER,
  p_heure_execution TIME,
  p_derniere_execution TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base_date TIMESTAMP WITH TIME ZONE;
  v_prochaine_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Utiliser la dernière exécution ou maintenant comme base
  v_base_date := COALESCE(p_derniere_execution, now());
  
  CASE p_frequence
    WHEN 'hebdomadaire' THEN
      -- Prochaine semaine au même jour
      v_prochaine_date := v_base_date + INTERVAL '7 days';
      
    WHEN 'mensuel' THEN
      -- Prochain mois au jour spécifié
      v_prochaine_date := date_trunc('month', v_base_date) + INTERVAL '1 month';
      v_prochaine_date := v_prochaine_date + (p_jour_execution - 1 || ' days')::INTERVAL;
      
    WHEN 'trimestriel' THEN
      -- Prochain trimestre au jour spécifié
      v_prochaine_date := date_trunc('quarter', v_base_date) + INTERVAL '3 months';
      v_prochaine_date := v_prochaine_date + (p_jour_execution - 1 || ' days')::INTERVAL;
  END CASE;
  
  -- Ajouter l'heure d'exécution
  v_prochaine_date := v_prochaine_date::date + p_heure_execution;
  
  -- Si la date est dans le passé, ajouter une période
  IF v_prochaine_date <= now() THEN
    CASE p_frequence
      WHEN 'hebdomadaire' THEN
        v_prochaine_date := v_prochaine_date + INTERVAL '7 days';
      WHEN 'mensuel' THEN
        v_prochaine_date := v_prochaine_date + INTERVAL '1 month';
      WHEN 'trimestriel' THEN
        v_prochaine_date := v_prochaine_date + INTERVAL '3 months';
    END CASE;
  END IF;
  
  RETURN v_prochaine_date;
END;
$$;

-- Trigger pour calculer automatiquement la prochaine exécution
CREATE OR REPLACE FUNCTION update_prochaine_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.prochaine_execution := calculer_prochaine_execution(
    NEW.frequence,
    NEW.jour_execution,
    NEW.heure_execution,
    NEW.derniere_execution
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_prochaine_execution
  BEFORE INSERT OR UPDATE ON public.rapports_automatises
  FOR EACH ROW
  EXECUTE FUNCTION update_prochaine_execution();