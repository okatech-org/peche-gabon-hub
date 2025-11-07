-- Corriger la fonction pour ajouter search_path
CREATE OR REPLACE FUNCTION public.est_dans_fenetre_paiement(p_date_echeance DATE)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CURRENT_DATE BETWEEN (p_date_echeance - INTERVAL '5 days') 
                          AND (p_date_echeance + INTERVAL '5 days')
$$;