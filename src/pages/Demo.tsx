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
  Fish, Users, Eye, Settings, Loader2, ArrowLeft
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

  const handleQuickAccess = async (email: string, roleName: string) => {
    try {
      await signIn(email, "Demo2025!");
      toast.success(`Connecté en tant que ${roleName}`);
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
          {Object.entries(
            demoAccounts.reduce((acc, account) => {
              if (!acc[account.category]) {
                acc[account.category] = [];
              }
              acc[account.category].push(account);
              return acc;
            }, {} as Record<string, typeof demoAccounts>)
          ).map(([category, accounts]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-2xl font-semibold text-primary flex items-center gap-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
                {category}
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
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
                          onClick={() => handleQuickAccess(account.email, account.name)}
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
          ))}
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
