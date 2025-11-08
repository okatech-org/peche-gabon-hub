-- Nettoyer les objets existants si présents
DROP TRIGGER IF EXISTS increment_template_usage_trigger ON workflows_inter_institutionnels;
DROP FUNCTION IF EXISTS increment_template_usage();
DROP TABLE IF EXISTS workflow_templates;

-- Table des templates de workflows prédéfinis
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  nom TEXT NOT NULL,
  description TEXT,
  
  -- Configuration du template
  type_workflow TEXT NOT NULL,
  type_donnees TEXT NOT NULL,
  priorite_defaut TEXT NOT NULL DEFAULT 'normale',
  
  -- Pré-remplissage
  objet_template TEXT NOT NULL,
  description_template TEXT,
  
  -- Routing institutionnel
  institution_emettrice_defaut TEXT[],
  institution_destinataire_defaut TEXT[],
  
  -- Champs requis pour ce template
  champs_requis JSONB DEFAULT '[]',
  
  -- Configuration
  delai_traitement_jours INTEGER,
  documents_requis TEXT[],
  
  -- Métadonnées
  actif BOOLEAN NOT NULL DEFAULT true,
  utilisation_count INTEGER NOT NULL DEFAULT 0,
  categorie TEXT NOT NULL DEFAULT 'general',
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_workflow_templates_categorie ON workflow_templates(categorie);
CREATE INDEX idx_workflow_templates_actif ON workflow_templates(actif);
CREATE INDEX idx_workflow_templates_type ON workflow_templates(type_workflow);

-- Enable RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tous peuvent voir templates actifs"
ON workflow_templates
FOR SELECT
USING (actif = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins peuvent gérer templates"
ON workflow_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'ministre')
  OR has_role(auth.uid(), 'direction_centrale')
);

-- Trigger pour updated_at
CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON workflow_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insérer des templates prédéfinis
INSERT INTO workflow_templates (
  nom,
  description,
  type_workflow,
  type_donnees,
  priorite_defaut,
  objet_template,
  description_template,
  institution_emettrice_defaut,
  institution_destinataire_defaut,
  delai_traitement_jours,
  documents_requis,
  categorie
) VALUES
(
  'Demande de Validation de Licence PA',
  'Template pour demander la validation d''une licence de pêche artisanale',
  'demande_licence',
  'licence',
  'normale',
  'Demande de validation - Licence PA n°[NUMERO]',
  'Merci de valider la demande de licence de pêche artisanale pour le pêcheur [NOM] - Pirogue [IMMATRICULATION].\n\nDocuments joints :\n- Formulaire de demande complété\n- Pièce d''identité\n- Certificat de propriété de la pirogue',
  ARRAY['dgpa'],
  ARRAY['anpa', 'direction_provinciale'],
  5,
  ARRAY['Formulaire de demande', 'Pièce d''identité', 'Certificat de propriété'],
  'licences'
),
(
  'Demande de Contrôle Sanitaire',
  'Template pour demander un contrôle sanitaire des produits halieutiques',
  'controle_sanitaire',
  'inspection',
  'haute',
  'Demande de contrôle sanitaire - [ETABLISSEMENT]',
  'Demande de contrôle sanitaire pour l''établissement [NOM_ETABLISSEMENT] situé à [LOCALISATION].\n\nType de contrôle : [TYPE]\nDate souhaitée : [DATE]\n\nMotif : [MOTIF]',
  ARRAY['dgpa', 'dgmm', 'direction_provinciale'],
  ARRAY['agasa'],
  3,
  ARRAY['Planning d''activité', 'Derniers résultats d''analyse'],
  'controles'
),
(
  'Certificat Sanitaire d''Exportation',
  'Template pour demander un certificat sanitaire pour l''exportation',
  'validation',
  'certificat',
  'urgente',
  'Demande de certificat sanitaire - Export vers [PAYS]',
  'Demande de certificat sanitaire pour l''exportation de produits halieutiques vers [PAYS_DESTINATION].\n\nProduits : [LISTE_PRODUITS]\nQuantité totale : [QUANTITE] kg\nDate d''export prévue : [DATE]\nTransporteur : [TRANSPORTEUR]',
  ARRAY['dgmm', 'armateur_pi'],
  ARRAY['agasa'],
  2,
  ARRAY['Liste de colisage', 'Résultats d''analyses', 'Certificat d''origine'],
  'controles'
),
(
  'Signalement d''Infraction',
  'Template pour signaler une infraction aux règles de pêche',
  'infraction',
  'rapport',
  'haute',
  'Signalement d''infraction - [TYPE_INFRACTION]',
  'Signalement d''infraction constatée le [DATE] à [LOCALISATION].\n\nType d''infraction : [TYPE_INFRACTION]\nContrevenant : [IDENTITE]\nCirconstances : [DESCRIPTION]\n\nMesures prises : [MESURES]\nPièces saisies : [PIECES_SAISIES]',
  ARRAY['anpa', 'dgmm', 'inspecteur'],
  ARRAY['dgpa', 'direction_centrale'],
  1,
  ARRAY['PV de constatation', 'Photos', 'Témoignages'],
  'infractions'
),
(
  'Demande de Statistiques',
  'Template pour demander des statistiques de captures ou licences',
  'statistiques',
  'statistiques',
  'normale',
  'Demande de statistiques - [PERIODE]',
  'Demande de transmission des statistiques pour la période [PERIODE].\n\nDonnées demandées :\n- [TYPE_DONNEES_1]\n- [TYPE_DONNEES_2]\n- [TYPE_DONNEES_3]\n\nFormat souhaité : [FORMAT]\nDélai : [DELAI]',
  ARRAY['ministre', 'direction_centrale', 'anpa', 'oprag'],
  ARRAY['dgpa', 'anpa', 'direction_provinciale'],
  7,
  ARRAY[]::TEXT[],
  'statistiques'
),
(
  'Coordination Inspection Conjointe',
  'Template pour organiser une inspection conjointe entre institutions',
  'coordination',
  'rapport',
  'normale',
  'Coordination inspection conjointe - [SITE/ZONE]',
  'Proposition d''inspection conjointe sur [SITE/ZONE].\n\nObjectifs :\n- [OBJECTIF_1]\n- [OBJECTIF_2]\n\nDate proposée : [DATE]\nDurée estimée : [DUREE]\nMoyens nécessaires : [MOYENS]\n\nParticipants attendus : [PARTICIPANTS]',
  ARRAY['dgpa', 'anpa', 'agasa', 'dgmm'],
  ARRAY['dgpa', 'anpa', 'agasa', 'dgmm', 'anpn'],
  10,
  ARRAY['Planning des inspections', 'Carte de la zone'],
  'coordination'
),
(
  'Demande d''Agrément Sanitaire',
  'Template pour demander l''agrément sanitaire d''un établissement',
  'validation',
  'certificat',
  'normale',
  'Demande d''agrément sanitaire - [ETABLISSEMENT]',
  'Demande d''agrément sanitaire pour l''établissement [NOM_ETABLISSEMENT].\n\nType d''établissement : [TYPE]\nActivités : [ACTIVITES]\nCapacité : [CAPACITE]\n\nTravaux réalisés :\n- [TRAVAUX_1]\n- [TRAVAUX_2]\n\nDossier technique complet en pièces jointes.',
  ARRAY['armateur_pi', 'gestionnaire_coop'],
  ARRAY['agasa'],
  15,
  ARRAY['Plans de l''établissement', 'Procédures HACCP', 'Liste du personnel', 'Certificats de formation'],
  'controles'
),
(
  'Validation Objectifs de Pêche',
  'Template pour valider les objectifs de pêche annuels',
  'validation',
  'rapport',
  'haute',
  'Validation objectifs de pêche - Année [ANNEE]',
  'Demande de validation des objectifs de pêche pour l''année [ANNEE].\n\nObjectifs proposés :\n- Captures totales : [CAPTURES_TOTALES] tonnes\n- Principales espèces : [ESPECES]\n- Effort de pêche : [EFFORT]\n\nJustification : [JUSTIFICATION]\n\nBases de calcul et données historiques en pièces jointes.',
  ARRAY['dgpa', 'direction_centrale'],
  ARRAY['ministre', 'oprag', 'anpa'],
  10,
  ARRAY['Données historiques', 'Analyses OPRAG', 'Projections'],
  'statistiques'
);

-- Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.donnees_json ? 'template_id' THEN
    UPDATE workflow_templates
    SET utilisation_count = utilisation_count + 1
    WHERE id = (NEW.donnees_json->>'template_id')::UUID;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER increment_template_usage_trigger
AFTER INSERT ON workflows_inter_institutionnels
FOR EACH ROW
EXECUTE FUNCTION increment_template_usage();