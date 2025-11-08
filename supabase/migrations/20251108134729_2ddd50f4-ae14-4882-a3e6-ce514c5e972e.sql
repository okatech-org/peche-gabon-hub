-- Table pour stocker les documents ministériels générés
CREATE TABLE public.documents_ministeriels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_document TEXT NOT NULL, -- 'arrete', 'circulaire', 'instruction', 'note_service', 'decision', 'rapport', 'communique', 'reponse', 'projet_loi', 'projet_ordonnance', 'projet_decret'
  numero_reference TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  objet TEXT NOT NULL,
  contenu_genere TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  statut TEXT NOT NULL DEFAULT 'brouillon', -- 'brouillon', 'finalise', 'publie', 'archive'
  date_publication DATE,
  signataires JSONB NOT NULL DEFAULT '[]',
  destinataires TEXT[],
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.documents_ministeriels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Ministre peut tout gérer sur documents ministériels"
  ON public.documents_ministeriels
  FOR ALL
  USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Direction centrale peut voir documents ministériels"
  ON public.documents_ministeriels
  FOR SELECT
  USING (has_role(auth.uid(), 'direction_centrale'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_documents_ministeriels_updated_at
  BEFORE UPDATE ON public.documents_ministeriels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour générer le numéro de référence
CREATE OR REPLACE FUNCTION public.generer_numero_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  annee TEXT;
  compteur INTEGER;
  prefix TEXT;
BEGIN
  annee := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Déterminer le préfixe selon le type
  prefix := CASE NEW.type_document
    WHEN 'arrete' THEN 'AM'
    WHEN 'circulaire' THEN 'CIRC'
    WHEN 'instruction' THEN 'INST'
    WHEN 'note_service' THEN 'NS'
    WHEN 'decision' THEN 'DEC'
    WHEN 'rapport' THEN 'RAPP'
    WHEN 'communique' THEN 'COM'
    WHEN 'reponse' THEN 'REP'
    WHEN 'projet_loi' THEN 'PLOI'
    WHEN 'projet_ordonnance' THEN 'PORD'
    WHEN 'projet_decret' THEN 'PDEC'
    ELSE 'DOC'
  END;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_reference FROM '\d+$') AS INTEGER)), 0) + 1
  INTO compteur
  FROM documents_ministeriels
  WHERE numero_reference LIKE prefix || '/' || annee || '%';
  
  NEW.numero_reference := prefix || '/' || annee || '/' || LPAD(compteur::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generer_numero_document_trigger
  BEFORE INSERT ON public.documents_ministeriels
  FOR EACH ROW
  WHEN (NEW.numero_reference IS NULL OR NEW.numero_reference = '')
  EXECUTE FUNCTION public.generer_numero_document();

-- Index pour les recherches
CREATE INDEX idx_documents_ministeriels_type ON public.documents_ministeriels(type_document);
CREATE INDEX idx_documents_ministeriels_statut ON public.documents_ministeriels(statut);
CREATE INDEX idx_documents_ministeriels_created_at ON public.documents_ministeriels(created_at DESC);
CREATE INDEX idx_documents_ministeriels_numero ON public.documents_ministeriels(numero_reference);