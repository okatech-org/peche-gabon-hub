import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Fish, Clipboard, Users, Shield, MapPin, Building2, 
  UserCog, Ship, Eye, BarChart3, Crown 
} from "lucide-react";

const Demo = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: "pecheur",
      name: "Pêcheur Artisanal",
      description: "Déclarer captures, consulter licence",
      email: "pecheur@demo.ga",
      icon: Fish,
      color: "from-blue-500 to-cyan-500"
    },
    {
      role: "agent_collecte",
      name: "Agent de Collecte",
      description: "Saisie terrain, validation captures",
      email: "agent@demo.ga",
      icon: Clipboard,
      color: "from-green-500 to-emerald-500"
    },
    {
      role: "gestionnaire_coop",
      name: "Gestionnaire Coopérative",
      description: "Gestion pirogues et pêcheurs",
      email: "coop@demo.ga",
      icon: Users,
      color: "from-purple-500 to-pink-500"
    },
    {
      role: "inspecteur",
      name: "Inspecteur",
      description: "Surveillance, infractions, saisies",
      email: "inspecteur@demo.ga",
      icon: Shield,
      color: "from-red-500 to-orange-500"
    },
    {
      role: "direction_provinciale",
      name: "Direction Provinciale",
      description: "Validation demandes, supervision province",
      email: "province@demo.ga",
      icon: MapPin,
      color: "from-indigo-500 to-blue-500"
    },
    {
      role: "direction_centrale",
      name: "Direction Centrale",
      description: "Analytics, publication réglementation",
      email: "centrale@demo.ga",
      icon: Building2,
      color: "from-violet-500 to-purple-500"
    },
    {
      role: "armateur_pi",
      name: "Armateur Pêche Industrielle",
      description: "Gestion flotte et captures industrielles",
      email: "armateur@demo.ga",
      icon: Ship,
      color: "from-teal-500 to-cyan-500"
    },
    {
      role: "observateur_pi",
      name: "Observateur PI",
      description: "Journal de marée, rejets",
      email: "observateur@demo.ga",
      icon: Eye,
      color: "from-amber-500 to-yellow-500"
    },
    {
      role: "analyste",
      name: "Analyste",
      description: "Exports, rapports, statistiques",
      email: "analyste@demo.ga",
      icon: BarChart3,
      color: "from-pink-500 to-rose-500"
    },
    {
      role: "ministre",
      name: "Ministre",
      description: "Dashboards exécutifs",
      email: "ministre@demo.ga",
      icon: Crown,
      color: "from-yellow-500 to-amber-500"
    },
    {
      role: "admin",
      name: "Administrateur",
      description: "Gestion système, RBAC",
      email: "admin@demo.ga",
      icon: UserCog,
      color: "from-gray-700 to-gray-900"
    }
  ];

  const handleQuickAccess = async (email: string, roleName: string) => {
    try {
      await signIn(email, "Demo2025!");
      toast.success(`Connecté en tant que ${roleName}`);
    } catch (error) {
      toast.error("Erreur de connexion");
    }
  };

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
              Retour Accueil
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Comptes de Démonstration</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Testez l'application avec les différents profils utilisateurs. 
            Cliquez sur "Accès Rapide" pour vous connecter instantanément.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm">Mot de passe universel: <code className="font-mono font-bold">Demo2025!</code></span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <Card key={account.role} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${account.color}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${account.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickAccess(account.email, account.name)}
                      className="group-hover:scale-105 transition-transform"
                    >
                      Accès Rapide
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{account.name}</CardTitle>
                  <CardDescription>{account.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {account.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-muted/30">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
              <p>• Chaque compte dispose de permissions spécifiques selon son rôle</p>
              <p>• Les données sont partagées entre tous les comptes de démonstration</p>
              <p>• Explorez les différentes interfaces et fonctionnalités</p>
              <p>• Pour une connexion manuelle, utilisez l'email affiché et le mot de passe: <code className="font-mono font-bold text-foreground">Demo2025!</code></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Demo;
