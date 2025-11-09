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

    // ============= DONNÉES DE RÉFÉRENCE =============
    
    // Types de pêche
    const { data: typesPeche } = await supabase
      .from('types_peche')
      .select('*');

    // Espèces (toutes)
    const { data: especes } = await supabase
      .from('especes')
      .select('*')
      .order('nom');

    // Engins de pêche
    const { data: enginsPeche } = await supabase
      .from('engins')
      .select('*')
      .order('nom');

    // Sites de débarquement avec statistiques
    const { data: sites } = await supabase
      .from('sites_debarquement')
      .select('*')
      .order('nom');

    // Coopératives avec comptage des membres
    const { data: cooperatives } = await supabase
      .from('cooperatives')
      .select('id, nom, site_id, responsable, telephone, email, statut, created_at')
      .eq('statut', 'active')
      .order('nom');

    // Pirogues actives
    const { data: pirogues } = await supabase
      .from('pirogues')
      .select('id, immatriculation, cooperative_id, site_id, longueur, largeur, materiaux, motorisation, statut')
      .eq('statut', 'active')
      .order('immatriculation')
      .limit(100);

    // Armements industriels
    const { data: armements } = await supabase
      .from('armements')
      .select('id, nom, responsable, telephone, email, statut')
      .eq('statut', 'active')
      .order('nom');

    // Navires industriels
    const { data: navires } = await supabase
      .from('navires')
      .select('id, nom, armement_id, immatriculation, pavillon, type_navire, longueur, jauge, capacite_cale, statut')
      .eq('statut', 'actif')
      .order('nom')
      .limit(100);

    // ============= STATISTIQUES FISCALES =============
    
    const { data: statsFiscales } = await supabase
      .from('statistiques_fiscales')
      .select('*')
      .order('annee desc, mois desc')
      .limit(100);

    // ============= DONNÉES RÉCENTES (30 DERNIERS JOURS) =============
    
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 30);
    const dateDebutStr = dateDebut.toISOString();

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

    // Remontées terrain récentes
    const { data: remonteesTerrain } = await supabase
      .from('remontees_terrain')
      .select('id, type_remontee, priorite, statut, titre, created_at')
      .gte('created_at', dateDebutStr)
      .order('created_at', { ascending: false })
      .limit(50);

    // Alertes récentes
    const { data: alertes } = await supabase
      .from('alertes_rapports')
      .select('id, indicateur, severite, statut, valeur_actuelle, variation_pourcentage, created_at')
      .gte('created_at', dateDebutStr)
      .order('created_at', { ascending: false })
      .limit(50);

    // Formations récentes
    const { data: formations } = await supabase
      .from('formations_planifiees')
      .select('id, type_formation, statut, nb_participants_prevus, date_debut, date_fin, lieu')
      .gte('date_debut', dateDebutStr)
      .order('date_debut', { ascending: false })
      .limit(50);

    // Captures PA récentes
    const { data: capturesPA } = await supabase
      .from('captures_pa')
      .select('espece_id, poids_kg, date_capture, site_id')
      .gte('date_capture', dateDebut.toISOString().split('T')[0])
      .order('date_capture', { ascending: false })
      .limit(200);

    // Marées industrielles récentes
    const { data: mareesPI } = await supabase
      .from('marees_industrielles')
      .select('id, navire_id, date_depart, date_retour, zone_peche, statut')
      .gte('date_depart', dateDebut.toISOString().split('T')[0])
      .order('date_depart', { ascending: false })
      .limit(50);

    // Documents ministériels récents
    const { data: documentsMinisteriels } = await supabase
      .from('documents_ministeriels')
      .select('id, type_document, titre, statut, date_publication')
      .gte('created_at', dateDebutStr)
      .order('created_at', { ascending: false })
      .limit(30);

    // Actions correctives en cours
    const { data: actionsCorrectives } = await supabase
      .from('actions_correctives')
      .select('id, action_description, statut, date_debut, date_fin_prevue')
      .in('statut', ['planifiee', 'en_cours'])
      .order('created_at', { ascending: false })
      .limit(30);

    // Licences actives (échantillon)
    const { data: licences } = await supabase
      .from('licences')
      .select('id, type_licence, numero, date_emission, date_expiration, montant, statut')
      .eq('statut', 'valide')
      .gte('date_expiration', new Date().toISOString().split('T')[0])
      .order('date_emission', { ascending: false })
      .limit(100);

    // Quittances récentes
    const { data: quittances } = await supabase
      .from('quittances')
      .select('id, numero, montant, statut, date_emission, date_paiement')
      .gte('date_emission', dateDebut.toISOString().split('T')[0])
      .order('date_emission', { ascending: false })
      .limit(100);

    // ============= AGRÉGATIONS ET STATISTIQUES =============
    
    // Compter les entités principales
    const { count: nbPirogues } = await supabase
      .from('pirogues')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active');

    const { count: nbNavires } = await supabase
      .from('navires')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'actif');

    const { count: nbCooperatives } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active');

    const { count: nbPecheurs } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'pecheur');

    const { count: nbSites } = await supabase
      .from('sites_debarquement')
      .select('*', { count: 'exact', head: true });

    // Calculer statistiques captures PA (30 jours)
    const capturesPAStats = {
      total_kg: capturesPA?.reduce((sum, c) => sum + (Number(c.poids_kg) || 0), 0) || 0,
      nb_enregistrements: capturesPA?.length || 0,
      especes_capturees: [...new Set(capturesPA?.map(c => c.espece_id))].length,
      sites_actifs: [...new Set(capturesPA?.map(c => c.site_id))].length
    };

    // Calculer statistiques fiscales totales
    const fiscalStatsTotal = {
      recettes_artisanales: statsFiscales?.filter(s => s.categorie === 'Pêche Artisanale').reduce((sum, s) => sum + (Number(s.montant_fcfa) || 0), 0) || 0,
      recettes_industrielles: statsFiscales?.filter(s => s.categorie === 'Pêche Industrielle').reduce((sum, s) => sum + (Number(s.montant_fcfa) || 0), 0) || 0,
      recettes_cooperatives: statsFiscales?.filter(s => s.categorie === 'Coopérative').reduce((sum, s) => sum + (Number(s.montant_fcfa) || 0), 0) || 0,
      total_recettes: statsFiscales?.reduce((sum, s) => sum + (Number(s.montant_fcfa) || 0), 0) || 0
    };

    // Calculer statistiques remontées
    const remonteesStats = {
      total: remonteesTerrain?.length || 0,
      by_type: remonteesTerrain?.reduce((acc: any, r: any) => {
        acc[r.type_remontee] = (acc[r.type_remontee] || 0) + 1;
        return acc;
      }, {}),
      by_priority: remonteesTerrain?.reduce((acc: any, r: any) => {
        acc[r.priorite] = (acc[r.priorite] || 0) + 1;
        return acc;
      }, {}),
      by_status: remonteesTerrain?.reduce((acc: any, r: any) => {
        acc[r.statut] = (acc[r.statut] || 0) + 1;
        return acc;
      }, {})
    };

    // Calculer statistiques alertes
    const alertesStats = {
      total: alertes?.length || 0,
      by_severity: alertes?.reduce((acc: any, a: any) => {
        acc[a.severite] = (acc[a.severite] || 0) + 1;
        return acc;
      }, {}),
      by_status: alertes?.reduce((acc: any, a: any) => {
        acc[a.statut] = (acc[a.statut] || 0) + 1;
        return acc;
      }, {}),
      critiques_non_resolues: alertes?.filter(a => a.severite === 'critique' && a.statut !== 'resolue').length || 0
    };

    // Calculer statistiques formations
    const formationsStats = {
      total: formations?.length || 0,
      by_status: formations?.reduce((acc: any, f: any) => {
        acc[f.statut] = (acc[f.statut] || 0) + 1;
        return acc;
      }, {}),
      by_type: formations?.reduce((acc: any, f: any) => {
        acc[f.type_formation] = (acc[f.type_formation] || 0) + 1;
        return acc;
      }, {}),
      participants_prevus_total: formations?.reduce((sum, f) => sum + (f.nb_participants_prevus || 0), 0) || 0
    };

    // ============= COMPILATION DE LA BASE DE CONNAISSANCES =============
    
    const knowledgeBase = {
      metadata: {
        generated_at: new Date().toISOString(),
        version: "2.0",
        description: "Base de connaissances enrichie du système de gestion des pêches du Gabon - Données complètes",
        data_sources: [
          "Base de données Supabase (temps réel)",
          "Données CSV analytiques",
          "Statistiques fiscales",
          "Remontées institutionnelles et terrain",
          "Documents ministériels"
        ]
      },
      
      system_structure: systemStructure,
      
      // ============= DONNÉES DE RÉFÉRENCE COMPLÈTES =============
      reference_data: {
        types_peche: typesPeche || [],
        especes: {
          count: especes?.length || 0,
          data: especes || [],
          categories: [...new Set(especes?.map(e => e.categorie))].filter(Boolean)
        },
        engins_peche: {
          count: enginsPeche?.length || 0,
          data: enginsPeche || []
        },
        sites_debarquement: {
          count: sites?.length || 0,
          data: sites || [],
          provinces: [...new Set(sites?.map(s => s.province))].filter(Boolean),
          regions: [...new Set(sites?.map(s => s.region))].filter(Boolean)
        },
        cooperatives: {
          count: cooperatives?.length || 0,
          actives: cooperatives?.filter(c => c.statut === 'active').length || 0,
          data: cooperatives || []
        },
        types_remontees: typesRemontees,
        types_documents_ministeriels: typesDocuments
      },

      // ============= STATISTIQUES GLOBALES =============
      global_statistics: {
        secteur: {
          pirogues_actives: nbPirogues || 0,
          navires_industriels_actifs: nbNavires || 0,
          cooperatives_actives: nbCooperatives || 0,
          pecheurs_enregistres: nbPecheurs || 0,
          sites_debarquement: nbSites || 0
        },
        fiscal: fiscalStatsTotal,
        captures_pa_30j: capturesPAStats
      },

      // ============= DONNÉES FISCALES DÉTAILLÉES =============
      fiscal_data: {
        description: "Statistiques fiscales par catégorie, mois et année",
        total_entries: statsFiscales?.length || 0,
        donnees: statsFiscales || [],
        resume_par_categorie: {
          peche_artisanale: {
            montant_total: fiscalStatsTotal.recettes_artisanales,
            nb_enregistrements: statsFiscales?.filter(s => s.categorie === 'Pêche Artisanale').length || 0
          },
          peche_industrielle: {
            montant_total: fiscalStatsTotal.recettes_industrielles,
            nb_enregistrements: statsFiscales?.filter(s => s.categorie === 'Pêche Industrielle').length || 0
          },
          cooperatives: {
            montant_total: fiscalStatsTotal.recettes_cooperatives,
            nb_enregistrements: statsFiscales?.filter(s => s.categorie === 'Coopérative').length || 0
          }
        }
      },

      // ============= DONNÉES RÉCENTES (30 DERNIERS JOURS) =============
      recent_data: {
        period: "30 derniers jours",
        date_debut: dateDebut.toISOString().split('T')[0],
        
        remontees_terrain: {
          statistics: remonteesStats,
          recent_items: remonteesTerrain?.slice(0, 20) || []
        },
        
        alertes: {
          statistics: alertesStats,
          recent_items: alertes?.slice(0, 20) || []
        },
        
        formations: {
          statistics: formationsStats,
          recent_items: formations?.slice(0, 20) || []
        },
        
        captures_pa: {
          statistics: capturesPAStats,
          recent_sample: capturesPA?.slice(0, 50) || []
        },
        
        marees_industrielles: {
          count: mareesPI?.length || 0,
          recent_items: mareesPI?.slice(0, 20) || []
        },
        
        documents_ministeriels: {
          count: documentsMinisteriels?.length || 0,
          recent_items: documentsMinisteriels || []
        },
        
        actions_correctives: {
          count: actionsCorrectives?.length || 0,
          items: actionsCorrectives || []
        },
        
        licences_actives: {
          count: licences?.length || 0,
          sample: licences?.slice(0, 30) || []
        },
        
        quittances: {
          count: quittances?.length || 0,
          montant_total: quittances?.reduce((sum, q) => sum + (Number(q.montant) || 0), 0) || 0,
          payees: quittances?.filter(q => q.statut === 'payee').length || 0,
          recent_items: quittances?.slice(0, 30) || []
        }
      },

      // ============= FLOTTE ET INFRASTRUCTURE =============
      flotte_infrastructure: {
        pirogues: {
          count: pirogues?.length || 0,
          by_motorisation: pirogues?.reduce((acc: any, p: any) => {
            acc[p.motorisation || 'non_specifie'] = (acc[p.motorisation || 'non_specifie'] || 0) + 1;
            return acc;
          }, {}),
          by_materiaux: pirogues?.reduce((acc: any, p: any) => {
            acc[p.materiaux || 'non_specifie'] = (acc[p.materiaux || 'non_specifie'] || 0) + 1;
            return acc;
          }, {}),
          sample: pirogues?.slice(0, 50) || []
        },
        
        navires_industriels: {
          count: navires?.length || 0,
          by_type: navires?.reduce((acc: any, n: any) => {
            acc[n.type_navire || 'non_specifie'] = (acc[n.type_navire || 'non_specifie'] || 0) + 1;
            return acc;
          }, {}),
          by_pavillon: navires?.reduce((acc: any, n: any) => {
            acc[n.pavillon || 'non_specifie'] = (acc[n.pavillon || 'non_specifie'] || 0) + 1;
            return acc;
          }, {}),
          sample: navires?.slice(0, 50) || []
        },
        
        armements: {
          count: armements?.length || 0,
          data: armements || []
        }
      },

      // ============= INDICATEURS CLÉS =============
      key_indicators: {
        economic: [
          `Recettes totales: ${fiscalStatsTotal.total_recettes.toLocaleString()} FCFA`,
          `Recettes PA: ${fiscalStatsTotal.recettes_artisanales.toLocaleString()} FCFA`,
          `Recettes PI: ${fiscalStatsTotal.recettes_industrielles.toLocaleString()} FCFA`,
          `Captures PA (30j): ${capturesPAStats.total_kg.toFixed(0)} kg`
        ],
        operational: [
          `${nbPirogues || 0} pirogues actives`,
          `${nbNavires || 0} navires industriels`,
          `${capturesPAStats.nb_enregistrements} captures PA enregistrées (30j)`,
          `${mareesPI?.length || 0} marées PI (30j)`,
          `${licences?.length || 0} licences actives`,
          `Taux paiement quittances: ${quittances && quittances.length > 0 ? ((quittances.filter(q => q.statut === 'payee').length / quittances.length) * 100).toFixed(1) : 0}%`
        ],
        social: [
          `${nbPecheurs || 0} pêcheurs enregistrés`,
          `${nbCooperatives || 0} coopératives actives`,
          `${formationsStats.total} formations planifiées (30j)`,
          `${formationsStats.participants_prevus_total} participants prévus`,
          `${remonteesStats.total} remontées terrain (30j)`
        ],
        alerts: [
          `${alertesStats.total} alertes (30j)`,
          `${alertesStats.critiques_non_resolues} alertes critiques non résolues`,
          `${actionsCorrectives?.length || 0} actions correctives en cours`
        ]
      },
      
      // ============= FONCTIONNALITÉS DU SYSTÈME =============
      functional_capabilities: {
        analytics: [
          "Visualisation captures PA et PI en temps réel",
          "Analyse des tendances temporelles et saisonnières",
          "Comparaisons inter-annuelles et inter-sites",
          "Tableaux de bord personnalisables par rôle",
          "Cartes interactives des zones de pêche",
          "Export de données (Excel, PDF, CSV)",
          "Graphiques détaillés (barres, lignes, camemberts, aires)",
          "Filtres avancés par date, site, espèce, engin"
        ],
        finance: [
          "Calcul automatique des taxes par catégorie",
          "Génération automatique de quittances",
          "Suivi des paiements en temps réel",
          "Prévisions de recettes par IA (Gemini)",
          "Scénarios financiers et simulations",
          "Historique complet des transactions",
          "Alertes de retard de paiement",
          "Rapports financiers détaillés"
        ],
        gestion: [
          "Système d'alertes intelligent avec seuils configurables",
          "Traitement des remontées terrain (réclamations, suggestions, dénonciations)",
          "Génération de documents ministériels (arrêtés, circulaires, etc.)",
          "Planification et suivi des formations",
          "Gestion des licences et autorisations",
          "Audit trail complet des actions",
          "Workflow de validation multi-niveaux",
          "Notifications par email et SMS"
        ],
        surveillance: [
          "Enregistrement des contrôles en mer",
          "Suivi des infractions et sanctions",
          "Missions de surveillance programmées",
          "Rapports d'inspection détaillés",
          "Statistiques d'infraction par zone",
          "Cartographie des zones surveillées"
        ],
        formations: [
          "Planification automatique avec IA",
          "Recommandations de formateurs par compétences",
          "Gestion du calendrier et des conflits",
          "Suivi des participants et présences",
          "Évaluation des formations",
          "Analyse prédictive des besoins"
        ],
        ai_features: [
          "iAsted: Assistant vocal intelligent avec commandes vocales",
          "Analyse prédictive des recettes fiscales",
          "Recommandations de formateurs par IA",
          "Génération de synthèses vocales (ElevenLabs)",
          "Détection d'anomalies dans les données",
          "Optimisation automatique de planning",
          "Classification automatique des remontées",
          "Analyse de sentiments des commentaires",
          "Prévisions météo et impact sur captures"
        ],
        collaboration: [
          "Système de présence temps réel",
          "Commentaires et discussions sur actions",
          "Partage de documents",
          "Workflows collaboratifs",
          "Notifications ciblées par rôle"
        ]
      },
      
      // ============= TERMINOLOGIE ET CONCEPTS =============
      terminology: {
        pa: "Pêche Artisanale - Pêche traditionnelle avec pirogues",
        pi: "Pêche Industrielle - Pêche avec navires industriels",
        cpue: "Captures Par Unité d'Effort (kg/jour) - Indicateur de productivité",
        rls: "Row Level Security - Politique de sécurité des données au niveau ligne",
        remontee: "Information remontée du terrain ou des institutions (réclamation, suggestion, dénonciation)",
        quittance: "Reçu de paiement de taxe ou redevance",
        maree: "Sortie en mer d'un navire industriel avec retour au port",
        sortie: "Sortie en mer d'une pirogue artisanale",
        cooperative: "Groupement de pêcheurs artisanaux",
        armement: "Société propriétaire de navires industriels",
        licence: "Autorisation administrative de pêcher",
        engin: "Outil de pêche (filet, palangre, nasse, etc.)",
        site_debarquement: "Lieu où les pêcheurs débarquent leurs captures",
        cpue_cible: "CPUE attendu ou optimal",
        taux_conformite: "Pourcentage de respect des règlementations",
        zone_peche: "Zone géographique maritime de pêche",
        formation_planifiee: "Session de formation programmée pour les pêcheurs",
        action_corrective: "Action entreprise suite à une alerte ou problème",
        document_ministeriel: "Document officiel émis par le ministre",
        bareme_taxe: "Grille de calcul des taxes",
        seuil_alerte: "Valeur déclenchant une alerte automatique",
        fcfa: "Franc CFA - Monnaie utilisée au Gabon",
        dgpa: "Direction Générale des Pêches et de l'Aquaculture",
        anpa: "Agence Nationale des Pêches et de l'Aquaculture",
        iasted: "Assistant vocal intelligent du ministre"
      },
      
      // ============= CONTEXTE OPÉRATIONNEL =============
      operational_context: {
        principales_especes: especes?.slice(0, 20).map(e => e.nom) || [],
        principaux_engins: enginsPeche?.slice(0, 10).map(e => e.nom) || [],
        principaux_sites: sites?.slice(0, 15).map(s => s.nom) || [],
        categories_especes: [...new Set(especes?.map(e => e.categorie))].filter(Boolean),
        provinces_couvertes: [...new Set(sites?.map(s => s.province))].filter(Boolean),
        types_navires_pi: [...new Set(navires?.map(n => n.type_navire))].filter(Boolean),
        pavillons_navires: [...new Set(navires?.map(n => n.pavillon))].filter(Boolean)
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
