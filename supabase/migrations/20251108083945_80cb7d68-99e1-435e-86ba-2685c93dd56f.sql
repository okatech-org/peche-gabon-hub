-- Créer une table pour le suivi des actions correctives
CREATE TABLE public.actions_correctives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alerte_id UUID NOT NULL REFERENCES public.alertes_rapports(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'abandonnee')),
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  responsable UUID REFERENCES auth.users(id),
  resultats TEXT,
  efficacite INTEGER CHECK (efficacite BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_actions_correctives_alerte ON public.actions_correctives(alerte_id);
CREATE INDEX idx_actions_correctives_statut ON public.actions_correctives(statut);
CREATE INDEX idx_actions_correctives_responsable ON public.actions_correctives(responsable);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_actions_correctives_updated_at
  BEFORE UPDATE ON public.actions_correctives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.actions_correctives ENABLE ROW LEVEL SECURITY;

-- Ministre et admin peuvent tout gérer
CREATE POLICY "Ministre peut gérer actions correctives"
  ON public.actions_correctives
  FOR ALL
  USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Autres rôles peuvent voir
CREATE POLICY "Directions peuvent voir actions correctives"
  ON public.actions_correctives
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

COMMENT ON TABLE public.actions_correctives IS 'Suivi des actions correctives basées sur les recommandations IA des alertes';
COMMENT ON COLUMN public.actions_correctives.efficacite IS 'Évaluation de l''efficacité de l''action (1-5, 5 étant très efficace)';
