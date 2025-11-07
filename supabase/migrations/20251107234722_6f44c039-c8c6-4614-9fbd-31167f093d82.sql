-- Create table for previsions history
CREATE TABLE public.previsions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_date DATE NOT NULL,
  periode_analyse INTEGER NOT NULL, -- 6, 12 ou 24 mois
  mois_prevu INTEGER NOT NULL,
  annee_prevu INTEGER NOT NULL,
  montant_prevu NUMERIC NOT NULL,
  taux_prevu NUMERIC NOT NULL,
  recouvrement_prevu NUMERIC NOT NULL,
  intervalle_confiance NUMERIC NOT NULL,
  moyenne_taux NUMERIC NOT NULL,
  tendance TEXT NOT NULL,
  ecart_type NUMERIC NOT NULL,
  volatilite TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for model performance tracking
CREATE TABLE public.model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_date DATE NOT NULL,
  periode_test_debut DATE NOT NULL,
  periode_test_fin DATE NOT NULL,
  mape NUMERIC NOT NULL, -- Mean Absolute Percentage Error
  bias NUMERIC NOT NULL, -- Biais moyen
  precision NUMERIC NOT NULL, -- % dans intervalle ±10%
  nb_predictions INTEGER NOT NULL,
  periode_analyse INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.previsions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for previsions_history
CREATE POLICY "Lecture historique prévisions pour rôles autorisés"
ON public.previsions_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

CREATE POLICY "Admins et analystes peuvent gérer historique prévisions"
ON public.previsions_history
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Create policies for model_performance
CREATE POLICY "Lecture performance modèle pour rôles autorisés"
ON public.model_performance
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'direction_provinciale'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

CREATE POLICY "Admins et analystes peuvent gérer performance modèle"
ON public.model_performance
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Create indexes
CREATE INDEX idx_previsions_history_version ON public.previsions_history(version_date DESC);
CREATE INDEX idx_previsions_history_periode ON public.previsions_history(annee_prevu, mois_prevu);
CREATE INDEX idx_model_performance_date ON public.model_performance(evaluation_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_previsions_history_updated_at
BEFORE UPDATE ON public.previsions_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_model_performance_updated_at
BEFORE UPDATE ON public.model_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();