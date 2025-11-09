-- Table pour stocker l'historique des notifications d'échéances
CREATE TABLE IF NOT EXISTS public.notifications_paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_notification TEXT NOT NULL CHECK (type_notification IN ('email', 'sms')),
  destinataire_email TEXT,
  destinataire_telephone TEXT,
  destinataire_nom TEXT NOT NULL,
  type_taxe TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  date_echeance DATE NOT NULL,
  jours_restants INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'envoye' CHECK (statut IN ('envoye', 'erreur', 'simule')),
  message_erreur TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Index pour rechercher rapidement
CREATE INDEX idx_notifications_paiements_user ON public.notifications_paiements(user_id);
CREATE INDEX idx_notifications_paiements_date ON public.notifications_paiements(created_at);
CREATE INDEX idx_notifications_paiements_statut ON public.notifications_paiements(statut);

-- Enable RLS
ALTER TABLE public.notifications_paiements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications_paiements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications_paiements
  FOR INSERT
  WITH CHECK (true);

-- Fonction pour vérifier les échéances proches
CREATE OR REPLACE FUNCTION public.get_upcoming_payment_deadlines()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_phone TEXT,
  user_name TEXT,
  type_taxe TEXT,
  montant DECIMAL,
  date_echeance DATE,
  jours_restants INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.user_id,
    COALESCE(p.email, u.email) as user_email,
    p.telephone as user_phone,
    COALESCE(p.prenom || ' ' || p.nom, u.raw_user_meta_data->>'first_name' || ' ' || u.raw_user_meta_data->>'last_name') as user_name,
    tc.type_taxe::TEXT,
    tc.montant,
    tc.date_echeance,
    (tc.date_echeance - CURRENT_DATE)::INTEGER as jours_restants
  FROM public.taxes_captures tc
  LEFT JOIN auth.users u ON tc.user_id = u.id
  LEFT JOIN public.pecheurs p ON tc.user_id = p.user_id
  WHERE tc.statut_paiement = 'en_attente'
    AND tc.date_echeance IS NOT NULL
    AND tc.date_echeance = CURRENT_DATE + INTERVAL '5 days'
    AND tc.date_echeance > CURRENT_DATE;
END;
$$;