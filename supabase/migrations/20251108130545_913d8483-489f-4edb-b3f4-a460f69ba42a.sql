-- Créer le bucket pour les documents des workflows
INSERT INTO storage.buckets (id, name, public)
VALUES ('workflow-documents', 'workflow-documents', false);

-- RLS Policies pour le bucket workflow-documents
CREATE POLICY "Institutions peuvent voir leurs documents workflow"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'workflow-documents' 
  AND EXISTS (
    SELECT 1 
    FROM workflows_inter_institutionnels w
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'ministre')
    )
  )
);

CREATE POLICY "Institutions peuvent uploader documents workflow"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workflow-documents'
  AND EXISTS (
    SELECT 1 
    FROM workflows_inter_institutionnels w
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Institutions peuvent supprimer leurs documents workflow"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workflow-documents'
  AND EXISTS (
    SELECT 1 
    FROM workflows_inter_institutionnels w,
         workflow_documents wd
    WHERE w.id::text = (storage.foldername(name))[1]
    AND wd.workflow_id = w.id
    AND wd.url_fichier = name
    AND (
      wd.uploaded_by = auth.uid()
      OR has_role(auth.uid(), 'admin')
    )
  )
);