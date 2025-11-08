-- Créer la table pour les seuils d'alerte
CREATE TABLE public.alerte_seuils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  type_indicateur TEXT NOT NULL, -- 'taux_recouvrement', 'montant_retard', 'montant_en_attente'
  seuil_valeur NUMERIC NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  destinataires TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_alerte_seuils_type ON public.alerte_seuils(type_indicateur);
CREATE INDEX idx_alerte_seuils_actif ON public.alerte_seuils(actif);

-- Trigger pour updated_at
CREATE TRIGGER update_alerte_seuils_updated_at
  BEFORE UPDATE ON public.alerte_seuils
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer la table pour l'historique des alertes envoyées
CREATE TABLE public.alerte_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seuil_id UUID REFERENCES public.alerte_seuils(id) ON DELETE CASCADE,
  type_indicateur TEXT NOT NULL,
  valeur_actuelle NUMERIC NOT NULL,
  seuil_declenche NUMERIC NOT NULL,
  message TEXT NOT NULL,
  destinataires TEXT[] NOT NULL,
  statut TEXT NOT NULL DEFAULT 'envoye', -- 'envoye', 'erreur'
  erreur_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_alerte_historique_seuil ON public.alerte_historique(seuil_id);
CREATE INDEX idx_alerte_historique_date ON public.alerte_historique(created_at DESC);

-- Enable RLS
ALTER TABLE public.alerte_seuils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerte_historique ENABLE ROW LEVEL SECURITY;

-- Policies pour alerte_seuils
CREATE POLICY "Admins peuvent gérer les seuils d'alerte"
  ON public.alerte_seuils
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'direction_centrale'::app_role)
  );

CREATE POLICY "Lecture seuils d'alerte pour rôles autorisés"
  ON public.alerte_seuils
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

-- Policies pour alerte_historique
CREATE POLICY "Admins peuvent voir l'historique des alertes"
  ON public.alerte_historique
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'direction_centrale'::app_role) OR
    has_role(auth.uid(), 'direction_provinciale'::app_role)
  );

-- Insérer des seuils par défaut
INSERT INTO public.alerte_seuils (nom, description, type_indicateur, seuil_valeur, destinataires) VALUES
  ('Taux de recouvrement faible', 'Alerte quand le taux de recouvrement global passe sous 70%', 'taux_recouvrement', 70, '{}'),
  ('Montant en retard élevé', 'Alerte quand le montant total en retard dépasse 500000 FCFA', 'montant_retard', 500000, '{}'),
  ('Montant en attente élevé', 'Alerte quand le montant total en attente dépasse 1000000 FCFA', 'montant_en_attente', 1000000, '{}');