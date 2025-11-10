-- Créer le bucket pour les pièces jointes des remontées
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'remontees-attachments',
  'remontees-attachments',
  true,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf']
);

-- Créer la table pour les métadonnées des pièces jointes
CREATE TABLE IF NOT EXISTS remontees_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remontee_id UUID NOT NULL REFERENCES remontees_terrain(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_remontees_attachments_remontee_id ON remontees_attachments(remontee_id);
CREATE INDEX idx_remontees_attachments_uploaded_by ON remontees_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE remontees_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour remontees_attachments
CREATE POLICY "Utilisateurs peuvent voir pièces jointes de leurs remontées"
ON remontees_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM remontees_terrain
    WHERE remontees_terrain.id = remontees_attachments.remontee_id
    AND remontees_terrain.soumis_par = auth.uid()
  )
  OR has_role(auth.uid(), 'ministre'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'direction_centrale'::app_role)
);

CREATE POLICY "Utilisateurs peuvent créer pièces jointes pour leurs remontées"
ON remontees_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM remontees_terrain
    WHERE remontees_terrain.id = remontees_attachments.remontee_id
    AND remontees_terrain.soumis_par = auth.uid()
  )
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Utilisateurs peuvent supprimer leurs pièces jointes"
ON remontees_attachments
FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Storage policies pour le bucket
CREATE POLICY "Utilisateurs authentifiés peuvent uploader"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'remontees-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Fichiers publics sont accessibles"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'remontees-attachments');

CREATE POLICY "Utilisateurs peuvent supprimer leurs fichiers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'remontees-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs fichiers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'remontees-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_remontees_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_remontees_attachments_updated_at
BEFORE UPDATE ON remontees_attachments
FOR EACH ROW
EXECUTE FUNCTION update_remontees_attachments_updated_at();