-- Table pour les abonnements citoyens aux notifications
CREATE TABLE public.notification_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['email']::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche par email
CREATE INDEX idx_notification_subscriptions_email ON public.notification_subscriptions(email);
CREATE INDEX idx_notification_subscriptions_active ON public.notification_subscriptions(active);

-- Table pour l'historique des notifications (simulation)
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.notification_subscriptions(id) ON DELETE CASCADE,
  document_id UUID,
  document_titre TEXT,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche
CREATE INDEX idx_notification_history_subscription ON public.notification_history(subscription_id);
CREATE INDEX idx_notification_history_document ON public.notification_history(document_id);
CREATE INDEX idx_notification_history_sent_at ON public.notification_history(sent_at DESC);

-- RLS policies
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut créer un abonnement
CREATE POLICY "Anyone can create subscription"
ON public.notification_subscriptions
FOR INSERT
WITH CHECK (true);

-- Tout le monde peut voir et gérer ses abonnements par email
CREATE POLICY "Users can view own subscriptions"
ON public.notification_subscriptions
FOR SELECT
USING (true);

CREATE POLICY "Users can update own subscriptions"
ON public.notification_subscriptions
FOR UPDATE
USING (true);

-- Tout le monde peut voir l'historique des notifications
CREATE POLICY "Anyone can view notification history"
ON public.notification_history
FOR SELECT
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_notification_subscriptions_updated_at
BEFORE UPDATE ON public.notification_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();