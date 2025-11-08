import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { 
  Fish, Clipboard, Users, Shield, MapPin, Building2, 
  UserCog, Ship, Eye, BarChart3, Crown, Loader2,
  FileText, Anchor, Package, TreePine, Globe, HandshakeIcon, Search
} from "lucide-react";

const Demo = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);

  const demoAccounts = [
    // Ministère et Direction
    {
      role: "ministre",
      name: "Ministère de la Mer",
      description: "Politique publique secteur halieutique",
      email: "ministre@demo.ga",
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      category: "Ministère"
    },
    {
      role: "direction_centrale",
      name: "Direction Centrale",
      description: "Coordination nationale politiques pêche",
      email: "centrale@demo.ga",
      icon: Building2,
      color: "from-violet-500 to-purple-500",
      category: "Ministère"
    },
    {
      role: "direction_provinciale",
      name: "Direction Provinciale",
      description: "Supervision provinciale",
      email: "province@demo.ga",
      icon: MapPin,
      color: "from-indigo-500 to-blue-500",
      category: "Ministère"
    },
    
    // Agences techniques
    {
      role: "dgpa",
      name: "DGPA",
      description: "Licences, Code des pêches",
      email: "dgpa@demo.ga",
      icon: FileText,
      color: "from-blue-500 to-indigo-500",
      category: "Agences"
    },
    {
      role: "anpa",
      name: "ANPA",
      description: "Exécution politique opérationnelle",
      email: "anpa@demo.ga",
      icon: Anchor,
      color: "from-cyan-500 to-blue-500",
      category: "Agences"
    },
    {
      role: "agasa",
      name: "AGASA",
      description: "Contrôle sanitaire produits",
      email: "agasa@demo.ga",
      icon: Shield,
      color: "from-green-500 to-emerald-500",
      category: "Agences"
    },
    {
      role: "dgmm",
      name: "DGMM",
      description: "Sécurité navires et gens de mer",
      email: "dgmm@demo.ga",
      icon: Ship,
      color: "from-blue-600 to-cyan-600",
      category: "Agences"
    },
    {
      role: "oprag",
      name: "OPRAG",
      description: "Gestion portuaire, débarquements",
      email: "oprag@demo.ga",
      icon: Anchor,
      color: "from-teal-500 to-cyan-500",
      category: "Agences"
    },
    {
      role: "dgddi",
      name: "DGDDI (Douanes)",
      description: "Contrôle import/export",
      email: "dgddi@demo.ga",
      icon: Package,
      color: "from-orange-500 to-red-500",
      category: "Agences"
    },
    {
      role: "anpn",
      name: "ANPN",
      description: "Aires marines protégées, lutte INN",
      email: "anpn@demo.ga",
      icon: TreePine,
      color: "from-green-600 to-emerald-600",
      category: "Agences"
    },
    
    // Coopération
    {
      role: "corep",
      name: "COREP",
      description: "Coopération régionale Golfe Guinée",
      email: "corep@demo.ga",
      icon: Globe,
      color: "from-purple-500 to-pink-500",
      category: "Coopération"
    },
    {
      role: "partenaire_international",
      name: "Partenaire International",
      description: "APD UE-Gabon, WCS, Global Fishing Watch",
      email: "partenaire@demo.ga",
      icon: HandshakeIcon,
      color: "from-blue-400 to-purple-400",
      category: "Coopération"
    },
    
    // Acteurs économiques
    {
      role: "pecheur",
      name: "Pêcheur Artisanal",
      description: "Déclaration captures, souveraineté",
      email: "pecheur@demo.ga",
      icon: Fish,
      color: "from-blue-500 to-cyan-500",
      category: "Économique"
    },
    {
      role: "gestionnaire_coop",
      name: "Coopérative",
      description: "Projet Gab Pêche, organisation",
      email: "coop@demo.ga",
      icon: Users,
      color: "from-purple-500 to-pink-500",
      category: "Économique"
    },
    {
      role: "armateur_pi",
      name: "Armement Industriel",
      description: "Flotte, licences internationales",
      email: "armateur@demo.ga",
      icon: Ship,
      color: "from-teal-500 to-cyan-500",
      category: "Économique"
    },
    
    // Personnel technique
    {
      role: "agent_collecte",
      name: "Agent de Collecte",
      description: "Saisie terrain, validation",
      email: "agent@demo.ga",
      icon: Clipboard,
      color: "from-green-500 to-emerald-500",
      category: "Technique"
    },
    {
      role: "inspecteur",
      name: "Inspecteur",
      description: "Surveillance, infractions",
      email: "inspecteur@demo.ga",
      icon: Search,
      color: "from-red-500 to-orange-500",
      category: "Technique"
    },
    {
      role: "observateur_pi",
      name: "Observateur PI",
      description: "Journal de marée, rejets",
      email: "observateur@demo.ga",
      icon: Eye,
      color: "from-amber-500 to-yellow-500",
      category: "Technique"
    },
    {
      role: "analyste",
      name: "Analyste",
      description: "Rapports, statistiques",
      email: "analyste@demo.ga",
      icon: BarChart3,
      color: "from-pink-500 to-rose-500",
      category: "Technique"
    },
    
    // Administration
    {
      role: "admin",
      name: "Administrateur",
      description: "Gestion système, RBAC",
      email: "admin@demo.ga",
      icon: UserCog,
      color: "from-gray-700 to-gray-900",
      category: "Administration"
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

        <div className="space-y-8 max-w-7xl mx-auto">
          {['Ministère', 'Agences', 'Coopération', 'Économique', 'Technique', 'Administration'].map(category => {
            const categoryAccounts = demoAccounts.filter(acc => acc.category === category);
            if (categoryAccounts.length === 0) return null;
            
            return (
              <div key={category}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/50 rounded" />
                  {category === 'Ministère' && 'Ministère et Direction'}
                  {category === 'Agences' && 'Agences et Directions Techniques'}
                  {category === 'Coopération' && 'Coopération Internationale'}
                  {category === 'Économique' && 'Acteurs Économiques'}
                  {category === 'Technique' && 'Personnel Technique'}
                  {category === 'Administration' && 'Administration Système'}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryAccounts.map((account) => {
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
                          <CardTitle className="mt-4 text-lg">{account.name}</CardTitle>
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
              </div>
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
