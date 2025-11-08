-- Créer la table pour les réglementations ministérielles
CREATE TABLE public.reglementations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  texte TEXT NOT NULL,
  type_document TEXT NOT NULL,
  date_effet DATE NOT NULL,
  destination TEXT[] NOT NULL DEFAULT '{}',
  fichier_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les notifications nationales
CREATE TABLE public.notifications_nationales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT '{}',
  priorite TEXT NOT NULL DEFAULT 'information',
  url_ressource TEXT,
  document_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les zones de pêche restreintes
CREATE TABLE public.zones_restreintes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  geometrie JSONB NOT NULL, -- Polygon coordinates
  raison TEXT NOT NULL,
  especes_concernees UUID[] NOT NULL DEFAULT '{}',
  date_debut DATE NOT NULL,
  date_fin DATE,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les logs d'audit ministériel
CREATE TABLE public.audit_ministeriel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reglementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_nationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_restreintes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ministeriel ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour reglementations
CREATE POLICY "Ministre peut créer réglementations"
ON public.reglementations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ministre'::app_role));

CREATE POLICY "Ministre peut voir réglementations"
ON public.reglementations
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role));

CREATE POLICY "Tous peuvent voir réglementations publiées"
ON public.reglementations
FOR SELECT
USING (true);

-- RLS Policies pour notifications_nationales
CREATE POLICY "Ministre peut créer notifications"
ON public.notifications_nationales
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ministre'::app_role));

CREATE POLICY "Ministre peut voir notifications"
ON public.notifications_nationales
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role));

-- RLS Policies pour zones_restreintes
CREATE POLICY "Ministre peut gérer zones restreintes"
ON public.zones_restreintes
FOR ALL
USING (has_role(auth.uid(), 'ministre'::app_role));

CREATE POLICY "Tous peuvent voir zones restreintes actives"
ON public.zones_restreintes
FOR SELECT
USING (actif = true);

-- RLS Policies pour audit_ministeriel
CREATE POLICY "Ministre peut voir audit"
ON public.audit_ministeriel
FOR SELECT
USING (has_role(auth.uid(), 'ministre'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Créer trigger pour updated_at
CREATE TRIGGER update_reglementations_updated_at
BEFORE UPDATE ON public.reglementations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zones_restreintes_updated_at
BEFORE UPDATE ON public.zones_restreintes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour logger les actions ministérielles
CREATE OR REPLACE FUNCTION public.log_action_ministerielle(
  _action_type TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_ministeriel (user_id, action_type, description, metadata)
  VALUES (auth.uid(), _action_type, _description, _metadata)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;