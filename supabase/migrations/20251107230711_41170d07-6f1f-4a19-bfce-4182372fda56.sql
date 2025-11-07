-- Ajouter les colonnes manquantes

-- Ajouter sexe à proprietaires
ALTER TABLE public.proprietaires 
ADD COLUMN IF NOT EXISTS sexe TEXT;