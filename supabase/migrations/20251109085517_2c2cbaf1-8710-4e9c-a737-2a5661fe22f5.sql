-- Table pour gérer les backups de la base de données
CREATE TABLE IF NOT EXISTS public.database_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  taille_mo NUMERIC,
  type_backup TEXT NOT NULL CHECK (type_backup IN ('manuel', 'automatique', 'avant_migration')),
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'complete', 'echec')),
  storage_path TEXT,
  hash_backup TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tables_incluses TEXT[],
  cree_par UUID REFERENCES auth.users(id),
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duree_creation_secondes INTEGER,
  erreur_message TEXT,
  peut_restaurer BOOLEAN DEFAULT true,
  CONSTRAINT nom_unique UNIQUE (nom)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_backups_cree_le ON public.database_backups(cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_backups_statut ON public.database_backups(statut);
CREATE INDEX IF NOT EXISTS idx_backups_type ON public.database_backups(type_backup);

-- Table pour la configuration des backups automatiques
CREATE TABLE IF NOT EXISTS public.backup_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actif BOOLEAN DEFAULT true,
  frequence TEXT NOT NULL CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel')),
  heure_execution TIME NOT NULL DEFAULT '02:00:00',
  jour_semaine INTEGER CHECK (jour_semaine BETWEEN 0 AND 6),
  jour_mois INTEGER CHECK (jour_mois BETWEEN 1 AND 31),
  retention_jours INTEGER NOT NULL DEFAULT 30,
  tables_a_exclure TEXT[] DEFAULT ARRAY[]::TEXT[],
  compression_activee BOOLEAN DEFAULT true,
  notification_email TEXT,
  derniere_execution TIMESTAMP WITH TIME ZONE,
  prochaine_execution TIMESTAMP WITH TIME ZONE,
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT now(),
  modifie_le TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'historique des restaurations
CREATE TABLE IF NOT EXISTS public.backup_restaurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES public.database_backups(id) ON DELETE CASCADE,
  statut TEXT NOT NULL CHECK (statut IN ('en_cours', 'reussie', 'echec')),
  restaure_par UUID REFERENCES auth.users(id),
  date_restauration TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duree_secondes INTEGER,
  erreur_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restaurations ENABLE ROW LEVEL SECURITY;

-- Policies pour super_admin uniquement
CREATE POLICY "Super admins peuvent tout faire sur backups"
  ON public.database_backups
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  ));

CREATE POLICY "Super admins peuvent gérer configuration backups"
  ON public.backup_configuration
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  ));

CREATE POLICY "Super admins peuvent voir historique restaurations"
  ON public.backup_restaurations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  ));

-- Fonction pour calculer la prochaine exécution du backup
CREATE OR REPLACE FUNCTION public.calculer_prochaine_execution_backup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_exec TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NEW.frequence = 'quotidien' THEN
    v_next_exec := (CURRENT_DATE + INTERVAL '1 day' + NEW.heure_execution);
  ELSIF NEW.frequence = 'hebdomadaire' THEN
    v_next_exec := (CURRENT_DATE + ((NEW.jour_semaine - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER + 7) % 7 * INTERVAL '1 day' + NEW.heure_execution);
    IF v_next_exec <= now() THEN
      v_next_exec := v_next_exec + INTERVAL '7 days';
    END IF;
  ELSIF NEW.frequence = 'mensuel' THEN
    v_next_exec := date_trunc('month', CURRENT_DATE) + ((NEW.jour_mois - 1) || ' days')::INTERVAL + NEW.heure_execution;
    IF v_next_exec <= now() THEN
      v_next_exec := v_next_exec + INTERVAL '1 month';
    END IF;
  END IF;
  
  NEW.prochaine_execution := v_next_exec;
  NEW.modifie_le := now();
  
  RETURN NEW;
END;
$$;

-- Trigger pour mettre à jour la prochaine exécution
DROP TRIGGER IF EXISTS trigger_calculer_prochaine_execution ON public.backup_configuration;
CREATE TRIGGER trigger_calculer_prochaine_execution
  BEFORE INSERT OR UPDATE ON public.backup_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_prochaine_execution_backup();

-- Fonction pour nettoyer les vieux backups selon la rétention
CREATE OR REPLACE FUNCTION public.nettoyer_vieux_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention_jours INTEGER;
  v_count INTEGER := 0;
BEGIN
  -- Récupérer la période de rétention
  SELECT retention_jours INTO v_retention_jours
  FROM public.backup_configuration
  WHERE actif = true
  LIMIT 1;
  
  IF v_retention_jours IS NULL THEN
    v_retention_jours := 30; -- Valeur par défaut
  END IF;
  
  -- Supprimer les backups automatiques plus vieux que la rétention
  DELETE FROM public.database_backups
  WHERE type_backup = 'automatique'
    AND cree_le < (now() - (v_retention_jours || ' days')::INTERVAL)
    AND statut = 'complete';
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Insérer une configuration par défaut si elle n'existe pas
INSERT INTO public.backup_configuration (
  actif,
  frequence,
  heure_execution,
  jour_semaine,
  retention_jours,
  compression_activee
) 
SELECT 
  false,
  'quotidien',
  '02:00:00'::TIME,
  1,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.backup_configuration);

COMMENT ON TABLE public.database_backups IS 'Stocke les informations sur les backups de la base de données';
COMMENT ON TABLE public.backup_configuration IS 'Configuration des backups automatiques';
COMMENT ON TABLE public.backup_restaurations IS 'Historique des restaurations de backups';