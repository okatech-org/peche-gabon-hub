-- Ajouter une colonne pour les recommandations IA dans les alertes rapports
ALTER TABLE public.alertes_rapports 
ADD COLUMN recommandations_ia TEXT;

COMMENT ON COLUMN public.alertes_rapports.recommandations_ia IS 'Recommandations générées automatiquement par IA pour gérer la variation détectée';
