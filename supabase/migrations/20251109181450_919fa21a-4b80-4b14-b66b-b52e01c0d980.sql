-- Ajouter une colonne quittance_id à remontees_effectives pour tracer les redistributions
ALTER TABLE public.remontees_effectives 
ADD COLUMN quittance_id UUID REFERENCES public.quittances(id);

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX idx_remontees_effectives_quittance_id 
ON public.remontees_effectives(quittance_id);

-- Rendre taxe_id nullable car maintenant on peut avoir soit taxe_id soit quittance_id
ALTER TABLE public.remontees_effectives 
ALTER COLUMN taxe_id DROP NOT NULL;