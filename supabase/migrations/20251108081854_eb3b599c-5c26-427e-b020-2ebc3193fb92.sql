-- Créer une table pour les catégories prédéfinies
CREATE TABLE public.categories_rapports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  couleur TEXT NOT NULL DEFAULT '#3b82f6',
  icone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter des champs pour tags et catégorie dans rapports_zones
ALTER TABLE public.rapports_zones
ADD COLUMN categorie_id UUID REFERENCES public.categories_rapports(id) ON DELETE SET NULL,
ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN region TEXT,
ADD COLUMN periode_debut DATE,
ADD COLUMN periode_fin DATE;

-- Index pour recherche rapide par tags et catégorie
CREATE INDEX idx_rapports_zones_categorie ON public.rapports_zones(categorie_id);
CREATE INDEX idx_rapports_zones_tags ON public.rapports_zones USING GIN(tags);
CREATE INDEX idx_rapports_zones_region ON public.rapports_zones(region);

-- Enable RLS sur categories_rapports
ALTER TABLE public.categories_rapports ENABLE ROW LEVEL SECURITY;

-- Politique: Tous peuvent voir les catégories
CREATE POLICY "Tous peuvent voir catégories"
ON public.categories_rapports
FOR SELECT
USING (true);

-- Politique: Ministre et admin peuvent gérer catégories
CREATE POLICY "Ministre peut gérer catégories"
ON public.categories_rapports
FOR ALL
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insérer des catégories par défaut
INSERT INTO public.categories_rapports (nom, description, couleur, icone) VALUES
('Analyse Régionale', 'Analyse d''une région spécifique', '#10b981', '🗺️'),
('Suivi Mensuel', 'Rapport de suivi mensuel des captures', '#3b82f6', '📅'),
('Étude Saisonnière', 'Analyse des variations saisonnières', '#f59e0b', '🌊'),
('Zone à Risque', 'Identification de zones nécessitant attention', '#ef4444', '⚠️'),
('Performance', 'Évaluation des performances par zone', '#8b5cf6', '📊'),
('Comparatif', 'Comparaison entre plusieurs zones', '#06b6d4', '⚖️');