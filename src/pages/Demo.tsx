import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { 
  Crown, Anchor, Shield, Award, Ship, FlaskConical, Trees, TrendingUp, 
  Fish, Users, Eye, Settings, Loader2, ArrowLeft, Building2, Clipboard, 
  BarChart3, Package, Globe, Handshake, Server
} from "lucide-react";
import { DemoFeedbackDialog } from "@/components/demo/DemoFeedbackDialog";

const Demo = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);

  const demoAccounts = [
    {
      role: "ministre",
      name: "Ministère de la Mer",
      description: "Vue d'ensemble stratégique et décisionnelle de l'ensemble du secteur halieutique",
      detailedDescription: "Supervise l'ensemble des politiques de pêche et d'aquaculture au Gabon. Prend les décisions stratégiques, définit les orientations sectorielles, et coordonne l'action des différentes agences. Accède aux tableaux de bord consolidés, statistiques macro-économiques, et indicateurs de performance du secteur.",
      missions: [
        "Définition des politiques publiques de pêche",
        "Arbitrage et coordination inter-agences",
        "Validation des règlementations et quotas",
        "Suivi des indicateurs stratégiques nationaux"
      ],
      email: "ministre@demo.ga",
      icon: Crown,
      color: "from-purple-500 to-indigo-600",
      category: "Gouvernance",
      active: true
    },
    {
      role: "direction_centrale",
      name: "Direction Centrale",
      description: "Coordination nationale des politiques de pêche - Pilotage stratégique et opérationnel",
      detailedDescription: "Assure la coordination nationale des politiques de pêche et d'aquaculture. Pilote la mise en œuvre des orientations ministérielles, supervise les directions provinciales, et coordonne l'action des différentes agences techniques. Produit les synthèses nationales et rapports sectoriels.",
      missions: [
        "Coordination nationale des politiques de pêche",
        "Supervision des directions provinciales",
        "Pilotage des programmes sectoriels",
        "Production des synthèses et rapports nationaux"
      ],
      email: "centrale@demo.ga",
      icon: Building2,
      color: "from-violet-500 to-purple-500",
      category: "Gouvernance",
      active: false
    },
    {
      role: "direction_provinciale",
      name: "Direction Provinciale",
      description: "Supervision provinciale - Mise en œuvre locale des politiques de pêche",
      detailedDescription: "Représente l'autorité de pêche au niveau provincial. Met en œuvre les politiques nationales adaptées au contexte local, supervise les agents de terrain, coordonne avec les collectivités locales, et remonte les informations vers la direction centrale.",
      missions: [
        "Mise en œuvre provinciale des politiques de pêche",
        "Supervision des agents de terrain",
        "Coordination avec les collectivités locales",
        "Remontées d'information vers le niveau national"
      ],
      email: "province@demo.ga",
      icon: Building2,
      color: "from-indigo-500 to-blue-500",
      category: "Gouvernance",
      active: false
    },
    {
      role: "dgpa",
      name: "Gestion portuaire, débarquements",
      description: "Direction Générale des Pêches et de l'Aquaculture - Coordination opérationnelle quotidienne",
      detailedDescription: "Gère les infrastructures portuaires, supervise les débarquements, collecte les données de production, et coordonne les activités quotidiennes des ports de pêche. Assure le lien entre les pêcheurs et l'administration.",
      missions: [
        "Gestion des infrastructures portuaires",
        "Supervision des débarquements journaliers",
        "Collecte et validation des données de capture",
        "Coordination des services aux pêcheurs"
      ],
      email: "dgpa@demo.ga",
      icon: Anchor,
      color: "from-blue-500 to-cyan-600",
      category: "Administration",
      active: true
    },
    {
      role: "anpa",
      name: "Contrôle quotas et licences",
      description: "Agence Nationale des Pêches et de l'Aquaculture - Régulation et attribution des droits de pêche",
      detailedDescription: "Gère l'attribution et le renouvellement des licences de pêche, surveille le respect des quotas par espèce et par zone, et contrôle la conformité réglementaire des opérateurs. Garantit l'exploitation durable des ressources.",
      missions: [
        "Délivrance et suivi des licences de pêche",
        "Surveillance des quotas par espèce et zone",
        "Contrôle de la conformité réglementaire",
        "Gestion des autorisations temporaires"
      ],
      email: "anpa@demo.ga",
      icon: Shield,
      color: "from-green-500 to-emerald-600",
      category: "Contrôle",
      active: false
    },
    {
      role: "agasa",
      name: "Standards & Qualité",
      description: "Agence Gabonaise de Sécurité Alimentaire - Contrôle sanitaire et qualité des produits",
      detailedDescription: "Assure le contrôle sanitaire des produits de la pêche, certifie la conformité aux normes de qualité nationales et internationales, et effectue les inspections dans les centres de débarquement et de transformation.",
      missions: [
        "Contrôle sanitaire des produits halieutiques",
        "Certification qualité et traçabilité",
        "Inspections dans les ports et usines",
        "Gestion des alertes sanitaires"
      ],
      email: "agasa@demo.ga",
      icon: Award,
      color: "from-orange-500 to-red-600",
      category: "Qualité",
      active: false
    },
    {
      role: "dgmm",
      name: "Affaires maritimes",
      description: "Direction Générale de la Marine Marchande - Sécurité maritime et immatriculation des navires",
      detailedDescription: "Responsable de l'immatriculation des navires de pêche, du contrôle de leur conformité technique, et de la sécurité maritime. Coordonne avec les garde-côtes pour la surveillance en mer.",
      missions: [
        "Immatriculation et suivi des navires",
        "Contrôle technique et sécurité maritime",
        "Délivrance des certificats de navigabilité",
        "Coordination avec les autorités maritimes"
      ],
      email: "dgmm@demo.ga",
      icon: Ship,
      color: "from-teal-500 to-blue-600",
      category: "Maritime",
      active: false
    },
    {
      role: "oprag",
      name: "Recherche halieutique",
      description: "Observatoire des Pêches et des Ressources Aquatiques - Recherche et gestion durable",
      detailedDescription: "Conduit les études scientifiques sur les stocks de poissons, évalue la durabilité de l'exploitation, et formule des recommandations pour la gestion des ressources. Réalise les campagnes d'évaluation en mer.",
      missions: [
        "Évaluation scientifique des stocks",
        "Campagnes de recherche en mer",
        "Recommandations pour quotas durables",
        "Suivi de la santé des écosystèmes marins"
      ],
      email: "oprag@demo.ga",
      icon: FlaskConical,
      color: "from-violet-500 to-purple-600",
      category: "Recherche",
      active: false
    },
    {
      role: "anpn",
      name: "Conservation & Aires marines",
      description: "Agence Nationale des Parcs Nationaux - Protection des aires marines protégées",
      detailedDescription: "Gère les aires marines protégées, surveille la biodiversité marine, et contrôle les activités de pêche dans les zones sensibles. Coordonne les actions de conservation avec les autres acteurs.",
      missions: [
        "Gestion des aires marines protégées",
        "Surveillance de la biodiversité",
        "Contrôle de la pêche en zones sensibles",
        "Éducation environnementale"
      ],
      email: "anpn@demo.ga",
      icon: Trees,
      color: "from-green-600 to-lime-600",
      category: "Environnement",
      active: false
    },
    {
      role: "corep",
      name: "Promotion développement pêche",
      description: "Comité Régulateur des Pêches - Développement économique du secteur",
      detailedDescription: "Promeut le développement de la filière pêche, soutient les projets d'aquaculture, facilite l'accès au financement pour les professionnels, et coordonne les initiatives de modernisation du secteur.",
      missions: [
        "Promotion et développement de la filière",
        "Accompagnement des projets d'aquaculture",
        "Facilitation de l'accès au financement",
        "Modernisation des pratiques de pêche"
      ],
      email: "corep@demo.ga",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-600",
      category: "Développement",
      active: false
    },
    {
      role: "dgddi",
      name: "DGDDI - Douanes",
      description: "Direction Générale des Douanes - Contrôle des flux import/export de produits halieutiques",
      detailedDescription: "Contrôle les importations et exportations de produits de la pêche. Vérifie la conformité documentaire, applique les droits de douane, lutte contre la contrebande, et collecte les statistiques sur le commerce international des produits halieutiques.",
      missions: [
        "Contrôle des importations et exportations",
        "Application des droits de douane",
        "Lutte contre la contrebande de produits halieutiques",
        "Collecte des statistiques du commerce international"
      ],
      email: "dgddi@demo.ga",
      icon: Package,
      color: "from-orange-500 to-red-500",
      category: "Contrôle",
      active: false
    },
    {
      role: "partenaire_international",
      name: "Partenaire International",
      description: "Coopération internationale - APD UE-Gabon, WCS, Global Fishing Watch",
      detailedDescription: "Représente les partenaires internationaux soutenant le développement du secteur halieutique gabonais. Apporte une aide technique et financière, partage les bonnes pratiques internationales, et facilite les transferts de technologie et de connaissances.",
      missions: [
        "Aide au développement et coopération technique",
        "Financement de projets sectoriels",
        "Partage des bonnes pratiques internationales",
        "Transfert de technologie et renforcement des capacités"
      ],
      email: "partenaire@demo.ga",
      icon: Handshake,
      color: "from-blue-400 to-purple-400",
      category: "Coopération",
      active: false
    },
    {
      role: "pecheur",
      name: "Pêcheur Artisanal",
      description: "Acteur de terrain - Déclaration des captures, remontées quotidiennes et paiement des taxes",
      detailedDescription: "Pêcheur professionnel pratiquant la pêche artisanale. Déclare ses captures quotidiennes, effectue les remontées terrain via l'application mobile, et s'acquitte des taxes sur ses activités. Accède à l'historique de ses déclarations et à ses obligations fiscales.",
      missions: [
        "Déclaration quotidienne des captures",
        "Remontées géolocalisées depuis le terrain",
        "Paiement des taxes de pêche",
        "Consultation de l'historique et des statistiques"
      ],
      email: "pecheur@demo.ga",
      icon: Fish,
      color: "from-cyan-500 to-blue-500",
      category: "Acteurs terrain",
      active: true
    },
    {
      role: "cooperative",
      name: "Coopérative",
      description: "Gestion collective - Coordination des membres, paiements groupés et mutualisation",
      detailedDescription: "Représente un groupement de pêcheurs artisanaux. Coordonne les activités des membres, facilite les paiements groupés de taxes, négocie collectivement, et mutualise les ressources (équipements, formations, commercialisation).",
      missions: [
        "Coordination des membres de la coopérative",
        "Gestion des paiements groupés de taxes",
        "Mutualisation des équipements et ressources",
        "Représentation collective auprès des autorités"
      ],
      email: "coop@demo.ga",
      icon: Users,
      color: "from-indigo-500 to-purple-500",
      category: "Acteurs terrain",
      active: true
    },
    {
      role: "armateur_pi",
      name: "Armement Industriel",
      description: "Pêche industrielle - Gestion de flotte, déclaration de marées et reporting commercial",
      detailedDescription: "Entreprise d'armement gérant une flotte de navires industriels. Déclare les marées de pêche, gère le planning des navires, effectue le reporting des captures commerciales, et s'acquitte des redevances industrielles.",
      missions: [
        "Gestion et suivi de la flotte industrielle",
        "Déclaration des marées et captures",
        "Planning et optimisation des campagnes",
        "Paiement des redevances et taxes industrielles"
      ],
      email: "armateur@demo.ga",
      icon: Anchor,
      color: "from-slate-600 to-gray-700",
      category: "Industrie",
      active: true
    },
    {
      role: "agent_collecte",
      name: "Agent de Collecte",
      description: "Personnel terrain - Saisie des données de débarquement et validation terrain",
      detailedDescription: "Agent de terrain chargé de la collecte des données de pêche dans les sites de débarquement. Enregistre les captures, vérifie les déclarations des pêcheurs, valide les données terrain, et assure la remontée des informations vers le système central.",
      missions: [
        "Collecte des données de débarquement",
        "Validation des déclarations de captures",
        "Saisie et transmission des données terrain",
        "Assistance aux pêcheurs dans leurs déclarations"
      ],
      email: "agent@demo.ga",
      icon: Clipboard,
      color: "from-green-500 to-emerald-500",
      category: "Personnel terrain",
      active: false
    },
    {
      role: "inspecteur",
      name: "Inspecteur",
      description: "Surveillance terrain - Contrôles, inspections et remontées d'infractions",
      detailedDescription: "Agent de contrôle effectuant des inspections sur le terrain (ports, navires, marchés). Vérifie la conformité des activités, relève les infractions, et effectue des remontées d'information en temps réel vers les autorités compétentes.",
      missions: [
        "Inspections dans les ports et sur les navires",
        "Contrôle de conformité réglementaire",
        "Relevé et documentation des infractions",
        "Remontées d'information en temps réel"
      ],
      email: "inspecteur@demo.ga",
      icon: Eye,
      color: "from-red-500 to-rose-600",
      category: "Contrôle",
      active: true
    },
    {
      role: "observateur_pi",
      name: "Observateur Pêche Industrielle",
      description: "Observateur embarqué - Surveillance des captures et pratiques en mer",
      detailedDescription: "Observateur scientifique embarqué sur les navires de pêche industrielle. Tient le journal de bord détaillé, enregistre les captures par espèce, documente les rejets et prises accessoires, et vérifie le respect des règlementations en vigueur.",
      missions: [
        "Tenue du journal de marée détaillé",
        "Enregistrement des captures et rejets",
        "Documentation des prises accessoires",
        "Vérification du respect des règlementations"
      ],
      email: "observateur@demo.ga",
      icon: Eye,
      color: "from-amber-500 to-yellow-500",
      category: "Personnel terrain",
      active: false
    },
    {
      role: "analyste",
      name: "Analyste",
      description: "Analyse de données - Production de rapports et statistiques sectorielles",
      detailedDescription: "Analyste spécialisé dans le traitement et l'analyse des données halieutiques. Produit les statistiques sectorielles, élabore les rapports d'activité, réalise les analyses de tendances, et fournit l'aide à la décision par l'analyse de données.",
      missions: [
        "Traitement et analyse des données de pêche",
        "Production des statistiques sectorielles",
        "Élaboration des rapports d'activité",
        "Analyses de tendances et aide à la décision"
      ],
      email: "analyste@demo.ga",
      icon: BarChart3,
      color: "from-pink-500 to-rose-500",
      category: "Personnel terrain",
      active: false
    },
    {
      role: "super_admin",
      name: "Super Admin",
      description: "Gestion technique complète - Architecture, backend, frontend, sécurité, réseau et développement",
      detailedDescription: "Super administrateur avec accès complet au système. Gère l'architecture technique globale, le backend et le frontend, la sécurité et le réseau, l'infrastructure cloud, les bases de données, et pilote les projets de développement. Supervise l'implémentation de nouvelles fonctionnalités et l'évolution de la plateforme.",
      missions: [
        "Architecture système et infrastructure cloud",
        "Gestion backend (APIs, edge functions, bases de données)",
        "Supervision frontend et optimisation UI/UX",
        "Sécurité, réseau et protection des données",
        "Pilotage des projets et développement produit"
      ],
      email: "superadmin@demo.ga",
      icon: Server,
      color: "from-slate-900 to-zinc-900",
      category: "Système",
      active: true
    },
    {
      role: "admin",
      name: "Administrateur",
      description: "Gestion système complète - Configuration, utilisateurs, données et sécurité",
      detailedDescription: "Administrateur système gérant l'infrastructure technique de la plateforme. Configure les paramètres globaux, gère les comptes utilisateurs, assure la sécurité des données, et supervise les imports/exports de données. Accède au volet Développement pour la collecte des besoins métiers.",
      missions: [
        "Configuration et paramétrage du système",
        "Gestion des utilisateurs et permissions",
        "Supervision des imports/exports de données",
        "Base de connaissance et cahier des charges (Développement)"
      ],
      email: "admin@demo.ga",
      icon: Settings,
      color: "from-gray-700 to-slate-800",
      category: "Système",
      active: true
    }
  ];

  useEffect(() => {
    const initializeDemoAccounts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('setup-demo-accounts');
        
        if (error) {
          console.error('Error initializing demo accounts:', error);
          toast.error("Erreur lors de l'initialisation des comptes de démonstration");
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDemoAccounts();
  }, []);

  const getRoleRoute = (role: string): string => {
    const roleRoutes: Record<string, string> = {
      ministre: "/minister-dashboard",
      admin: "/admin",
      super_admin: "/superadmin-dashboard",
      pecheur: "/dashboard",
      cooperative: "/cooperative-dashboard",
      gestionnaire_coop: "/cooperative-dashboard",
      armateur_pi: "/armeur-dashboard",
      dgpa: "/dgpa-dashboard",
      anpa: "/anpa-dashboard",
      agasa: "/agasa-dashboard",
      dgmm: "/dgmm-dashboard",
      oprag: "/oprag-dashboard",
      anpn: "/anpn-dashboard",
      dgddi: "/dgddi-dashboard",
      corep: "/corep-dashboard",
      direction_centrale: "/dashboard",
      direction_provinciale: "/dashboard",
      agent_collecte: "/dashboard",
      inspecteur: "/dashboard",
      observateur_pi: "/dashboard",
      analyste: "/dashboard",
      partenaire_international: "/dashboard",
    };
    return roleRoutes[role] || "/dashboard";
  };

  const handleQuickAccess = async (email: string, roleName: string, role: string) => {
    try {
      await signIn(email, "Demo2025!");
      toast.success(`Connecté en tant que ${roleName}`);
      
      // Attendre un court instant pour que les rôles soient chargés
      setTimeout(() => {
        const route = getRoleRoute(role);
        navigate(route);
      }, 500);
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initialisation des comptes de démonstration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fish className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">PÊCHE GABON</h1>
                <p className="text-sm text-muted-foreground">Mode Démonstration</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Accueil
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Comptes de Démonstration</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Testez l'application avec les différents profils utilisateurs. 
            Cliquez sur "Accès Rapide" pour vous connecter instantanément.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm">Mot de passe universel: <code className="font-mono font-bold">Demo2025!</code></span>
          </div>
        </div>

        <div className="space-y-12 max-w-7xl mx-auto">
          {/* Gouvernance stratégique */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Gouvernance Stratégique
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['ministre', 'direction_centrale', 'direction_provinciale'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Acteurs terrain et Industrie */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Acteurs Terrain et Industrie
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['pecheur', 'cooperative', 'armateur_pi'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Gestion opérationnelle */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Gestion Opérationnelle
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['dgpa', 'agent_collecte', 'observateur_pi'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contrôle et Surveillance */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Contrôle et Surveillance
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['anpa', 'inspecteur', 'dgddi'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Qualité, Maritime, Recherche */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Qualité, Maritime, Recherche
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['agasa', 'dgmm', 'oprag'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Environnement, Développement, Coopération */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Environnement, Développement, Coopération
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['anpn', 'corep', 'partenaire_international'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Analyse */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
              Analyse de Données
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {['analyste'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all ${
                      isActive 
                        ? "hover:shadow-lg border-primary/20" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${account.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {account.detailedDescription}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Missions principales:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          {account.missions.map((mission, idx) => (
                            <li key={idx}>{mission}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {account.email}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className="w-full"
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Gestion Système */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 via-zinc-900/5 to-slate-900/5 rounded-lg -z-10" />
              <h3 className="text-2xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 py-2">
                <div className="h-1 w-12 bg-gradient-to-r from-slate-700 via-zinc-800 to-slate-900 rounded" />
                Gestion Système
                <Badge variant="outline" className="ml-2 border-slate-700 text-slate-700 dark:border-slate-400 dark:text-slate-400">
                  Accès Technique
                </Badge>
              </h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {['admin', 'super_admin'].map(roleId => {
                const account = demoAccounts.find(a => a.role === roleId);
                if (!account) return null;
                const IconComponent = account.icon;
                const isActive = account.active;
                return (
                  <Card 
                    key={account.role} 
                    className={`relative overflow-hidden transition-all border-2 ${
                      isActive 
                        ? "hover:shadow-xl border-slate-700/30 dark:border-slate-500/30 shadow-lg" 
                        : "opacity-60 grayscale hover:opacity-70"
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${account.color}`} />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-900/5 to-transparent rounded-bl-full -z-10" />
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${account.color} ${!isActive && "opacity-50"} shadow-md`}>
                          <IconComponent className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-bold">{account.name}</CardTitle>
                            {!isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Bientôt
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm font-medium">
                            {account.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {account.detailedDescription}
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Shield className="h-4 w-4 text-slate-700 dark:text-slate-400" />
                          Missions principales:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1.5 pl-6">
                          {account.missions.map((mission, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span>{mission}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="bg-muted/30 p-2 rounded text-sm font-mono">
                        <strong className="text-foreground">Email:</strong> {account.email}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/20">
                      <Button 
                        onClick={() => handleQuickAccess(account.email, account.name, account.role)}
                        className={`w-full ${isActive ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600' : ''}`}
                        variant={isActive ? "default" : "secondary"}
                        disabled={!isActive}
                      >
                        {isActive ? "Accès rapide" : "Bientôt disponible"}
                      </Button>
                      <DemoFeedbackDialog roleDemo={account.role} roleName={account.name} />
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-muted/30">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
              <p>• Chaque compte dispose de permissions spécifiques selon son rôle</p>
              <p>• Les données sont partagées entre tous les comptes de démonstration</p>
              <p>• Utilisez le bouton "Faire une remontée" pour partager vos connaissances métiers</p>
              <p>• Pour une connexion manuelle, utilisez l'email affiché et le mot de passe: <code className="font-mono font-bold text-foreground">Demo2025!</code></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Demo;
