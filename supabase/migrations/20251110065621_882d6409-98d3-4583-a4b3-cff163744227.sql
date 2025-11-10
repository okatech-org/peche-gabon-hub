
-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_calculer_taxes_capture_pa ON public.captures_pa;
DROP TRIGGER IF EXISTS trigger_calculer_taxes_maree_industrielle ON public.marees_industrielles;

-- Créer le trigger pour calculer automatiquement les taxes sur les captures artisanales
CREATE TRIGGER trigger_calculer_taxes_capture_pa
  AFTER INSERT OR UPDATE ON public.captures_pa
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_capture_pa();

-- Créer le trigger pour calculer automatiquement les taxes sur les marées industrielles
CREATE TRIGGER trigger_calculer_taxes_maree_industrielle
  AFTER INSERT OR UPDATE ON public.marees_industrielles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_taxes_maree_industrielle();

-- Vérifier qu'il existe au moins un barème de taxe actif pour les captures
-- Si aucun n'existe, en créer un par défaut (100 FCFA/kg)
INSERT INTO public.bareme_taxes (
  nom,
  type_taxe,
  description,
  date_debut,
  montant_fixe_kg,
  actif
)
SELECT 
  'Taxe standard capture artisanale',
  'capture',
  'Taxe de base sur les captures artisanales',
  '2024-01-01'::date,
  100.0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.bareme_taxes 
  WHERE type_taxe = 'capture' AND actif = true
);
