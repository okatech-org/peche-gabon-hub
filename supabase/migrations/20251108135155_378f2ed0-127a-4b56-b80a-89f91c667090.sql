-- Ajouter une politique RLS pour permettre l'accès public aux documents publiés
CREATE POLICY "Accès public aux documents publiés"
ON public.documents_ministeriels
FOR SELECT
USING (statut = 'publie');

-- Créer un index full-text pour améliorer les performances de recherche
CREATE INDEX idx_documents_ministeriels_search 
ON public.documents_ministeriels 
USING gin(to_tsvector('french', titre || ' ' || objet || ' ' || COALESCE(contenu_genere, '')));

-- Créer un index sur la date de publication
CREATE INDEX idx_documents_ministeriels_date_publication 
ON public.documents_ministeriels(date_publication DESC);

-- Créer un index sur type_document et statut pour filtrage rapide
CREATE INDEX idx_documents_ministeriels_type_statut 
ON public.documents_ministeriels(type_document, statut);