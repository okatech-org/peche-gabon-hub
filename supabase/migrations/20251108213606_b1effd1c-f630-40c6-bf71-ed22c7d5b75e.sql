-- Table pour les configurations de planification d'exports
CREATE TABLE IF NOT EXISTS public.exports_planifies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type_export TEXT NOT NULL CHECK (type_export IN ('full', 'summary', 'raw', 'custom')),
  frequence TEXT NOT NULL CHECK (frequence IN ('daily', 'weekly', 'monthly')),
  jour_semaine INTEGER CHECK (jour_semaine BETWEEN 1 AND 7),
  jour_mois INTEGER CHECK (jour_mois BETWEEN 1 AND 31),
  heure_execution TIME NOT NULL DEFAULT '09:00',
  destinataires JSONB DEFAULT '[]'::jsonb,
  sections_incluses JSONB DEFAULT '{}'::jsonb,
  actif BOOLEAN DEFAULT true,
  dernier_export_at TIMESTAMP WITH TIME ZONE,
  prochain_export_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'historique des exports générés
CREATE TABLE IF NOT EXISTS public.exports_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planification_id UUID REFERENCES public.exports_planifies(id) ON DELETE SET NULL,
  nom_fichier TEXT NOT NULL,
  type_export TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('success', 'failed', 'pending')),
  taille_kb INTEGER,
  nombre_lignes INTEGER,
  erreur_message TEXT,
  genere_par UUID REFERENCES auth.users(id),
  genere_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_exports_planifies_actif ON public.exports_planifies(actif);
CREATE INDEX idx_exports_planifies_prochain ON public.exports_planifies(prochain_export_at);
CREATE INDEX idx_exports_historique_date ON public.exports_historique(genere_at DESC);
CREATE INDEX idx_exports_historique_planif ON public.exports_historique(planification_id);

-- RLS Policies
ALTER TABLE public.exports_planifies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports_historique ENABLE ROW LEVEL SECURITY;

-- Policies pour exports_planifies
CREATE POLICY "Admin et ministre peuvent tout voir"
  ON public.exports_planifies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent créer"
  ON public.exports_planifies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent modifier"
  ON public.exports_planifies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Admin et ministre peuvent supprimer"
  ON public.exports_planifies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

-- Policies pour exports_historique
CREATE POLICY "Admin et ministre peuvent voir l'historique"
  ON public.exports_historique FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'ministre')
    )
  );

CREATE POLICY "Système peut créer l'historique"
  ON public.exports_historique FOR INSERT
  WITH CHECK (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_exports_planifies_updated_at
  BEFORE UPDATE ON public.exports_planifies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();