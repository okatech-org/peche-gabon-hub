-- Table des workflows inter-institutionnels
CREATE TABLE public.workflows_inter_institutionnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_reference TEXT NOT NULL UNIQUE,
  
  -- Institutions émettrice et destinataire
  institution_emettrice TEXT NOT NULL,
  institution_destinataire TEXT NOT NULL,
  emetteur_user_id UUID REFERENCES auth.users(id),
  destinataire_user_id UUID,
  
  -- Type et objet de l'échange
  type_workflow TEXT NOT NULL, -- 'demande_licence', 'controle_sanitaire', 'infraction', 'statistiques', 'autre'
  objet TEXT NOT NULL,
  description TEXT,
  
  -- Statut et priorité
  statut TEXT NOT NULL DEFAULT 'en_attente', -- 'en_attente', 'en_cours', 'valide', 'refuse', 'archive'
  priorite TEXT NOT NULL DEFAULT 'normale', -- 'basse', 'normale', 'haute', 'urgente'
  
  -- Données échangées
  type_donnees TEXT NOT NULL, -- 'licence', 'capture', 'inspection', 'rapport', 'autre'
  donnees_json JSONB,
  
  -- Traçabilité temporelle
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_echeance DATE,
  date_traitement TIMESTAMP WITH TIME ZONE,
  date_cloture TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des documents attachés aux workflows
CREATE TABLE public.workflow_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows_inter_institutionnels(id) ON DELETE CASCADE,
  
  nom_fichier TEXT NOT NULL,
  type_fichier TEXT NOT NULL,
  taille_bytes INTEGER,
  url_fichier TEXT NOT NULL,
  
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de l'historique complet des workflows (traçabilité)
CREATE TABLE public.workflow_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows_inter_institutionnels(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'creation', 'modification', 'validation', 'refus', 'transfert', 'commentaire', 'document_ajoute'
  ancien_statut TEXT,
  nouveau_statut TEXT,
  
  description_action TEXT NOT NULL,
  details JSONB,
  
  effectue_par UUID REFERENCES auth.users(id),
  effectue_par_institution TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des commentaires sur les workflows
CREATE TABLE public.workflow_commentaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows_inter_institutionnels(id) ON DELETE CASCADE,
  
  commentaire TEXT NOT NULL,
  auteur_user_id UUID REFERENCES auth.users(id),
  auteur_institution TEXT NOT NULL,
  
  est_interne BOOLEAN DEFAULT false, -- Commentaire interne à l'institution ou visible par tous
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fonction pour générer un numéro de référence unique
CREATE OR REPLACE FUNCTION generer_numero_workflow()
RETURNS TRIGGER AS $$
DECLARE
  annee TEXT;
  compteur INTEGER;
  nouveau_numero TEXT;
BEGIN
  annee := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_reference FROM 5 FOR 6) AS INTEGER)), 0) + 1
  INTO compteur
  FROM workflows_inter_institutionnels
  WHERE numero_reference LIKE 'WF' || annee || '%';
  
  nouveau_numero := 'WF' || annee || LPAD(compteur::TEXT, 6, '0');
  
  NEW.numero_reference := nouveau_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generer_numero_workflow_trigger
BEFORE INSERT ON workflows_inter_institutionnels
FOR EACH ROW
WHEN (NEW.numero_reference IS NULL)
EXECUTE FUNCTION generer_numero_workflow();

-- Fonction pour logger automatiquement dans l'historique
CREATE OR REPLACE FUNCTION log_workflow_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO workflow_historique (
      workflow_id, 
      action, 
      nouveau_statut, 
      description_action,
      effectue_par,
      effectue_par_institution
    ) VALUES (
      NEW.id,
      'creation',
      NEW.statut,
      'Workflow créé: ' || NEW.objet,
      NEW.emetteur_user_id,
      NEW.institution_emettrice
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.statut != NEW.statut THEN
    INSERT INTO workflow_historique (
      workflow_id,
      action,
      ancien_statut,
      nouveau_statut,
      description_action,
      effectue_par,
      effectue_par_institution
    ) VALUES (
      NEW.id,
      'modification',
      OLD.statut,
      NEW.statut,
      'Changement de statut: ' || OLD.statut || ' → ' || NEW.statut,
      auth.uid(),
      NEW.institution_destinataire
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_workflow_change_trigger
AFTER INSERT OR UPDATE ON workflows_inter_institutionnels
FOR EACH ROW
EXECUTE FUNCTION log_workflow_change();

-- Trigger pour updated_at
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON workflows_inter_institutionnels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_commentaires_updated_at
BEFORE UPDATE ON workflow_commentaires
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index pour performances
CREATE INDEX idx_workflows_statut ON workflows_inter_institutionnels(statut);
CREATE INDEX idx_workflows_emettrice ON workflows_inter_institutionnels(institution_emettrice);
CREATE INDEX idx_workflows_destinataire ON workflows_inter_institutionnels(institution_destinataire);
CREATE INDEX idx_workflows_type ON workflows_inter_institutionnels(type_workflow);
CREATE INDEX idx_workflows_date_creation ON workflows_inter_institutionnels(date_creation);
CREATE INDEX idx_workflow_historique_workflow_id ON workflow_historique(workflow_id);
CREATE INDEX idx_workflow_documents_workflow_id ON workflow_documents(workflow_id);
CREATE INDEX idx_workflow_commentaires_workflow_id ON workflow_commentaires(workflow_id);

-- Enable RLS
ALTER TABLE workflows_inter_institutionnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_commentaires ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier si un utilisateur appartient à une institution
CREATE OR REPLACE FUNCTION user_institution()
RETURNS TEXT AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT ARRAY_AGG(role::TEXT)
  INTO user_roles
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Retourne la première institution trouvée
  IF 'dgpa' = ANY(user_roles) THEN RETURN 'dgpa';
  ELSIF 'anpa' = ANY(user_roles) THEN RETURN 'anpa';
  ELSIF 'agasa' = ANY(user_roles) THEN RETURN 'agasa';
  ELSIF 'dgmm' = ANY(user_roles) THEN RETURN 'dgmm';
  ELSIF 'oprag' = ANY(user_roles) THEN RETURN 'oprag';
  ELSIF 'dgddi' = ANY(user_roles) THEN RETURN 'dgddi';
  ELSIF 'anpn' = ANY(user_roles) THEN RETURN 'anpn';
  ELSIF 'corep' = ANY(user_roles) THEN RETURN 'corep';
  ELSIF 'ministre' = ANY(user_roles) THEN RETURN 'ministre';
  ELSIF 'admin' = ANY(user_roles) THEN RETURN 'admin';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies pour workflows_inter_institutionnels
CREATE POLICY "Institutions peuvent voir leurs workflows"
ON workflows_inter_institutionnels
FOR SELECT
USING (
  user_institution() = institution_emettrice 
  OR user_institution() = institution_destinataire
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'ministre')
);

CREATE POLICY "Institutions peuvent créer workflows"
ON workflows_inter_institutionnels
FOR INSERT
WITH CHECK (
  user_institution() = institution_emettrice
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Institutions peuvent modifier leurs workflows"
ON workflows_inter_institutionnels
FOR UPDATE
USING (
  user_institution() = institution_emettrice 
  OR user_institution() = institution_destinataire
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'ministre')
);

-- RLS Policies pour workflow_documents
CREATE POLICY "Voir documents des workflows autorisés"
ON workflow_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workflows_inter_institutionnels w
    WHERE w.id = workflow_id
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'ministre')
    )
  )
);

CREATE POLICY "Ajouter documents aux workflows autorisés"
ON workflow_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows_inter_institutionnels w
    WHERE w.id = workflow_id
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
    )
  )
);

-- RLS Policies pour workflow_historique
CREATE POLICY "Voir historique des workflows autorisés"
ON workflow_historique
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workflows_inter_institutionnels w
    WHERE w.id = workflow_id
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'ministre')
    )
  )
);

CREATE POLICY "Système peut créer historique"
ON workflow_historique
FOR INSERT
WITH CHECK (true);

-- RLS Policies pour workflow_commentaires
CREATE POLICY "Voir commentaires des workflows autorisés"
ON workflow_commentaires
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workflows_inter_institutionnels w
    WHERE w.id = workflow_id
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'ministre')
    )
  )
  AND (NOT est_interne OR auteur_institution = user_institution() OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Ajouter commentaires aux workflows autorisés"
ON workflow_commentaires
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows_inter_institutionnels w
    WHERE w.id = workflow_id
    AND (
      user_institution() = w.institution_emettrice 
      OR user_institution() = w.institution_destinataire
      OR has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Modifier ses propres commentaires"
ON workflow_commentaires
FOR UPDATE
USING (auteur_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));