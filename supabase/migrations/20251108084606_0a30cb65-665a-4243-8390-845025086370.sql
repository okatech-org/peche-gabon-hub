-- Créer une table pour les commentaires sur les actions correctives
CREATE TABLE public.commentaires_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.actions_correctives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commentaire TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_commentaires_actions_action ON public.commentaires_actions(action_id);
CREATE INDEX idx_commentaires_actions_user ON public.commentaires_actions(user_id);
CREATE INDEX idx_commentaires_actions_created ON public.commentaires_actions(created_at DESC);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_commentaires_actions_updated_at
  BEFORE UPDATE ON public.commentaires_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer Row Level Security
ALTER TABLE public.commentaires_actions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les rôles autorisés
CREATE POLICY "Rôles autorisés peuvent voir commentaires"
  ON public.commentaires_actions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

-- Politique de création de commentaires
CREATE POLICY "Rôles autorisés peuvent créer commentaires"
  ON public.commentaires_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      has_role(auth.uid(), 'ministre'::app_role) OR 
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'direction_centrale'::app_role) OR
      has_role(auth.uid(), 'direction_provinciale'::app_role)
    )
  );

-- Politique de modification (utilisateur peut modifier ses propres commentaires)
CREATE POLICY "Utilisateurs peuvent modifier leurs commentaires"
  ON public.commentaires_actions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique de suppression (utilisateur peut supprimer ses propres commentaires ou admin/ministre)
CREATE POLICY "Utilisateurs peuvent supprimer leurs commentaires"
  ON public.commentaires_actions
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'ministre'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Activer le realtime pour les notifications instantanées
ALTER TABLE public.commentaires_actions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commentaires_actions;

COMMENT ON TABLE public.commentaires_actions IS 'Commentaires collaboratifs sur les actions correctives avec support temps réel';
