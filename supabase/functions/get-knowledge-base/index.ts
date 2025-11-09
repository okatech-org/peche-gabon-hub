import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Compiling knowledge base...');

    // Structure du système
    const systemStructure = {
      roles: [
        {
          name: "ministre",
          description: "Ministre de la Pêche et de l'Économie Maritime",
          permissions: "Accès complet à toutes les sections analytiques, économiques et de gestion. Peut générer des documents ministériels, consulter l'historique complet, définir des alertes et des actions."
        },
        {
          name: "admin",
          description: "Administrateur du système",
          permissions: "Gestion complète des utilisateurs, des licences, des pirogues, des navires, des coopératives, des espèces, des engins de pêche, des quittances, des taxes, des imports de données."
        },
        {
          name: "pecheur",
          description: "Pêcheur artisanal",
          permissions: "Déclaration de captures, consultation de ses taxes, paiement de ses redevances."
        },
        {
          name: "cooperative",
          description: "Gestionnaire de coopérative",
          permissions: "Gestion des membres, paiement groupé de taxes, consultation des statistiques de la coopérative."
        },
        {
          name: "armeur",
          description: "Armateur de navires industriels",
          permissions: "Déclaration de marées, gestion de sa flotte, consultation de ses taxes et statistiques."
        },
        {
          name: "dgpa",
          description: "Direction Générale des Pêches et de l'Aquaculture"
        },
        {
          name: "anpa",
          description: "Agence Nationale des Pêches et de l'Aquaculture"
        },
        {
          name: "agasa",
          description: "Agence Gabonaise de Sécurité Alimentaire"
        },
        {
          name: "dgmm",
          description: "Direction Générale de la Marine Marchande"
        },
        {
          name: "oprag",
          description: "Observatoire des Pêches de la République Gabonaise"
        },
        {
          name: "dgddi",
          description: "Direction Générale des Douanes et Droits Indirects"
        },
        {
          name: "anpn",
          description: "Agence Nationale des Parcs Nationaux"
        },
        {
          name: "corep",
          description: "Comité de Réglementation des Pêches"
        }
      ],
      dashboard_sections: {
        analytiques: {
          vue_ensemble: "Indicateurs clés globaux, statistiques de pêche consolidées",
          peche_artisanale: "Captures PA, sorties, pirogues actives, CPUE",
          peche_industrielle: "Marées, captures PI, flotte industrielle, activités",
          surveillance: "Contrôles, infractions, zones surveillées"
        },
        economie_finances: {
          economie: "Indicateurs économiques, valeur des captures, contribution au PIB",
          remontees_finances: "Taxes collectées, quittances, redevances, prévisions de recettes"
        },
        actions_gestion: {
          alertes: "Alertes automatiques basées sur des seuils, notifications critiques",
          remontees_terrain: "Remontées institutionnelles et terrain (réclamations, suggestions, dénonciations)",
          actions_ministerielles: "Documents ministériels, arrêtés, circulaires, décisions",
          formations: "Planification et suivi des formations des pêcheurs",
          historique: "Audit trail des actions ministérielles",
          parametres: "Configuration du compte"
        }
      }
    };

    // Types de données
    const { data: typesPeche } = await supabase
      .from('types_peche')
      .select('*');

    const { data: especes } = await supabase
      .from('especes')
      .select('id, nom_commun, nom_scientifique, categorie')
      .limit(50);

    const { data: enginsPeche } = await supabase
      .from('engins_peche')
      .select('id, nom, categorie');

    const { data: sites } = await supabase
      .from('sites_debarquement')
      .select('id, nom, region, province');

    // Types de remontées
    const typesRemontees = [
      {
        type: "reclamation",
        description: "Plaintes ou réclamations des pêcheurs ou acteurs du secteur"
      },
      {
        type: "suggestion",
        description: "Propositions d'amélioration du secteur"
      },
      {
        type: "denonciation",
        description: "Signalements d'infractions ou d'irrégularités"
      },
      {
        type: "article_presse",
        description: "Articles de presse concernant le secteur de la pêche"
      },
      {
        type: "commentaire_reseau",
        description: "Commentaires issus des réseaux sociaux"
      },
      {
        type: "avis_reseau_social",
        description: "Avis et opinions sur les réseaux sociaux"
      }
    ];

    // Types de documents ministériels
    const typesDocuments = [
      { type: "arrete", description: "Arrêté ministériel" },
      { type: "circulaire", description: "Circulaire" },
      { type: "instruction", description: "Instruction" },
      { type: "note_service", description: "Note de service" },
      { type: "decision", description: "Décision" },
      { type: "rapport", description: "Rapport" },
      { type: "communique", description: "Communiqué" },
      { type: "reponse", description: "Réponse" },
      { type: "projet_loi", description: "Projet de loi" },
      { type: "projet_ordonnance", description: "Projet d'ordonnance" },
      { type: "projet_decret", description: "Projet de décret" }
    ];

    // Statistiques récentes (30 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 30);

    const { data: statsRemontees } = await supabase
      .from('remontees_terrain')
      .select('type_remontee, priorite')
      .gte('created_at', dateDebut.toISOString());

    const { data: statsAlertes } = await supabase
      .from('alertes_rapports')
      .select('severite, resolu')
      .gte('created_at', dateDebut.toISOString());

    const { data: statsFormations } = await supabase
      .from('formations_planifiees')
      .select('statut, type_formation')
      .gte('date_debut', dateDebut.toISOString());

    // Compilation de la base de connaissances
    const knowledgeBase = {
      metadata: {
        generated_at: new Date().toISOString(),
        version: "1.0",
        description: "Base de connaissances complète du système de gestion des pêches du Gabon"
      },
      system_structure: systemStructure,
      reference_data: {
        types_peche: typesPeche || [],
        especes: especes || [],
        engins_peche: enginsPeche || [],
        sites_debarquement: sites || [],
        types_remontees: typesRemontees,
        types_documents_ministeriels: typesDocuments
      },
      recent_statistics: {
        period: "30 derniers jours",
        remontees: {
          total: statsRemontees?.length || 0,
          by_type: statsRemontees?.reduce((acc: any, r: any) => {
            acc[r.type_remontee] = (acc[r.type_remontee] || 0) + 1;
            return acc;
          }, {}),
          by_priority: statsRemontees?.reduce((acc: any, r: any) => {
            acc[r.priorite] = (acc[r.priorite] || 0) + 1;
            return acc;
          }, {})
        },
        alertes: {
          total: statsAlertes?.length || 0,
          by_severity: statsAlertes?.reduce((acc: any, a: any) => {
            acc[a.severite] = (acc[a.severite] || 0) + 1;
            return acc;
          }, {}),
          resolved: statsAlertes?.filter((a: any) => a.resolu).length || 0
        },
        formations: {
          total: statsFormations?.length || 0,
          by_status: statsFormations?.reduce((acc: any, f: any) => {
            acc[f.statut] = (acc[f.statut] || 0) + 1;
            return acc;
          }, {}),
          by_type: statsFormations?.reduce((acc: any, f: any) => {
            acc[f.type_formation] = (acc[f.type_formation] || 0) + 1;
            return acc;
          }, {})
        }
      },
      key_indicators: {
        economic: [
          "Valeur totale des captures",
          "Contribution au PIB",
          "Taxes collectées",
          "Recettes du Trésor Public"
        ],
        operational: [
          "Nombre de pirogues actives",
          "Nombre de navires industriels",
          "Nombre de sorties/marées",
          "CPUE (Captures par unité d'effort)",
          "Taux de conformité des licences",
          "Taux de paiement des taxes"
        ],
        social: [
          "Nombre de pêcheurs enregistrés",
          "Nombre de coopératives",
          "Formations dispensées",
          "Taux de satisfaction des remontées terrain"
        ]
      },
      functional_capabilities: {
        analytics: [
          "Visualisation des captures (PA et PI)",
          "Analyse des tendances temporelles",
          "Comparaisons inter-annuelles",
          "Tableaux de bord personnalisables",
          "Export de données (Excel, PDF)"
        ],
        finance: [
          "Calcul automatique des taxes",
          "Génération de quittances",
          "Suivi des paiements",
          "Prévisions de recettes (IA)",
          "Scénarios financiers"
        ],
        gestion: [
          "Système d'alertes intelligent",
          "Traitement des remontées terrain",
          "Génération de documents ministériels",
          "Planification de formations",
          "Audit trail complet"
        ],
        ai_features: [
          "Analyse prédictive des recettes",
          "Recommandations de formateurs",
          "Génération de synthèses vocales",
          "Détection d'anomalies",
          "Optimisation de planning"
        ]
      },
      terminology: {
        pa: "Pêche Artisanale",
        pi: "Pêche Industrielle",
        cpue: "Captures Par Unité d'Effort (kg/jour)",
        rls: "Row Level Security (politique de sécurité des données)",
        remontee: "Information remontée du terrain ou des institutions",
        quittance: "Reçu de paiement de taxe",
        maree: "Sortie en mer d'un navire industriel",
        sortie: "Sortie en mer d'une pirogue artisanale"
      }
    };

    return new Response(
      JSON.stringify(knowledgeBase, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache 1 heure
        } 
      }
    );
  } catch (error) {
    console.error('Error generating knowledge base:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
