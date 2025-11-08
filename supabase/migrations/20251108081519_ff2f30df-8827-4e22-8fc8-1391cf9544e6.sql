-- Créer le bucket pour les rapports PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rapports-zones',
  'rapports-zones',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
);

-- Créer la table pour l'historique des rapports
CREATE TABLE public.rapports_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  titre TEXT NOT NULL,
  zone_geojson JSONB NOT NULL,
  statistiques JSONB NOT NULL,
  recommandations_ia TEXT,
  fichier_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour recherche rapide
CREATE INDEX idx_rapports_zones_created_by ON public.rapports_zones(created_by);
CREATE INDEX idx_rapports_zones_created_at ON public.rapports_zones(created_at DESC);

-- Enable RLS
ALTER TABLE public.rapports_zones ENABLE ROW LEVEL SECURITY;

-- Politique: Ministre peut voir tous les rapports
CREATE POLICY "Ministre peut voir tous rapports"
ON public.rapports_zones
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Politique: Ministre peut créer rapports
CREATE POLICY "Ministre peut créer rapports"
ON public.rapports_zones
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Politique: Créateur peut supprimer son rapport
CREATE POLICY "Utilisateur peut supprimer ses rapports"
ON public.rapports_zones
FOR DELETE
USING (auth.uid() = created_by);

-- Politiques RLS pour le storage bucket rapports-zones
CREATE POLICY "Ministre peut uploader rapports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'rapports-zones' AND
  (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Ministre peut lire rapports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'rapports-zones' AND
  (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Utilisateur peut supprimer ses rapports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'rapports-zones' AND
  auth.uid()::text = (storage.foldername(name))[1]
);