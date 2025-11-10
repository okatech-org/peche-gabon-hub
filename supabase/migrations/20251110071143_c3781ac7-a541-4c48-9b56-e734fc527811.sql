
-- Créer une table pour l'historique des modifications des barèmes de taxes
CREATE TABLE IF NOT EXISTS public.bareme_taxes_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bareme_id UUID NOT NULL REFERENCES public.bareme_taxes(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('creation', 'modification', 'activation', 'desactivation')),
  champs_modifies JSONB NOT NULL DEFAULT '{}',
  anciennes_valeurs JSONB,
  nouvelles_valeurs JSONB,
  modifie_par UUID REFERENCES auth.users(id),
  modifie_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  commentaire TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bareme_taxes_historique_bareme_id ON public.bareme_taxes_historique(bareme_id);
CREATE INDEX IF NOT EXISTS idx_bareme_taxes_historique_modifie_le ON public.bareme_taxes_historique(modifie_le DESC);

-- RLS pour l'historique
ALTER TABLE public.bareme_taxes_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent voir historique barèmes"
  ON public.bareme_taxes_historique
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'direction_centrale'::app_role) OR 
    has_role(auth.uid(), 'ministre'::app_role)
  );

CREATE POLICY "Système peut insérer historique"
  ON public.bareme_taxes_historique
  FOR INSERT
  WITH CHECK (true);

-- Fonction trigger pour enregistrer l'historique
CREATE OR REPLACE FUNCTION public.enregistrer_historique_bareme_taxes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_champs_modifies JSONB := '{}';
  v_anciennes_valeurs JSONB;
  v_nouvelles_valeurs JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'creation';
    v_nouvelles_valeurs := to_jsonb(NEW);
    
    INSERT INTO public.bareme_taxes_historique (
      bareme_id, action, champs_modifies, nouvelles_valeurs, modifie_par
    ) VALUES (
      NEW.id, v_action, v_champs_modifies, v_nouvelles_valeurs, auth.uid()
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Détecter si c'est une activation/désactivation
    IF OLD.actif != NEW.actif THEN
      v_action := CASE WHEN NEW.actif THEN 'activation' ELSE 'desactivation' END;
    ELSE
      v_action := 'modification';
    END IF;
    
    -- Identifier les champs modifiés
    IF OLD.nom != NEW.nom THEN
      v_champs_modifies := v_champs_modifies || '{"nom": true}';
    END IF;
    IF OLD.type_taxe != NEW.type_taxe THEN
      v_champs_modifies := v_champs_modifies || '{"type_taxe": true}';
    END IF;
    IF OLD.montant_fixe_kg IS DISTINCT FROM NEW.montant_fixe_kg THEN
      v_champs_modifies := v_champs_modifies || '{"montant_fixe_kg": true}';
    END IF;
    IF OLD.taux_pourcentage IS DISTINCT FROM NEW.taux_pourcentage THEN
      v_champs_modifies := v_champs_modifies || '{"taux_pourcentage": true}';
    END IF;
    IF OLD.seuil_min_kg IS DISTINCT FROM NEW.seuil_min_kg THEN
      v_champs_modifies := v_champs_modifies || '{"seuil_min_kg": true}';
    END IF;
    IF OLD.seuil_max_kg IS DISTINCT FROM NEW.seuil_max_kg THEN
      v_champs_modifies := v_champs_modifies || '{"seuil_max_kg": true}';
    END IF;
    IF OLD.date_debut != NEW.date_debut THEN
      v_champs_modifies := v_champs_modifies || '{"date_debut": true}';
    END IF;
    IF OLD.date_fin IS DISTINCT FROM NEW.date_fin THEN
      v_champs_modifies := v_champs_modifies || '{"date_fin": true}';
    END IF;
    IF OLD.espece_id IS DISTINCT FROM NEW.espece_id THEN
      v_champs_modifies := v_champs_modifies || '{"espece_id": true}';
    END IF;
    
    v_anciennes_valeurs := to_jsonb(OLD);
    v_nouvelles_valeurs := to_jsonb(NEW);
    
    INSERT INTO public.bareme_taxes_historique (
      bareme_id, action, champs_modifies, anciennes_valeurs, nouvelles_valeurs, modifie_par
    ) VALUES (
      NEW.id, v_action, v_champs_modifies, v_anciennes_valeurs, v_nouvelles_valeurs, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_historique_bareme_taxes ON public.bareme_taxes;
CREATE TRIGGER trigger_historique_bareme_taxes
  AFTER INSERT OR UPDATE ON public.bareme_taxes
  FOR EACH ROW
  EXECUTE FUNCTION public.enregistrer_historique_bareme_taxes();
