-- Ajouter les champs de coordonnées GPS à la table remontees_terrain
ALTER TABLE public.remontees_terrain 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Créer un index spatial pour les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_remontees_terrain_coords 
ON public.remontees_terrain (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN public.remontees_terrain.latitude IS 'Latitude de la localisation de la remontée (WGS84)';
COMMENT ON COLUMN public.remontees_terrain.longitude IS 'Longitude de la localisation de la remontée (WGS84)';