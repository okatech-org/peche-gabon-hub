import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fish, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Activity,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const roleLabels: Record<string, string> = {
  pecheur: "Pêcheur",
  agent_collecte: "Agent de Collecte",
  gestionnaire_coop: "Gestionnaire Coopérative",
  inspecteur: "Inspecteur",
  direction_provinciale: "Direction Provinciale",
  direction_centrale: "Direction Centrale",
  admin: "Administrateur",
  armateur_pi: "Armateur Pêche Industrielle",
  observateur_pi: "Observateur Pêche Industrielle",
  analyste: "Analyste",
  ministre: "Ministre",
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive",
  ministre: "bg-accent",
  direction_centrale: "bg-primary",
  direction_provinciale: "bg-primary",
  analyste: "bg-secondary",
  inspecteur: "bg-secondary",
  gestionnaire_coop: "bg-muted",
  agent_collecte: "bg-muted",
  pecheur: "bg-muted",
  armateur_pi: "bg-muted",
  observateur_pi: "bg-muted",
};

const Dashboard = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirection automatique des admins vers le panel d'administration
  if (roles.includes('admin')) {
    navigate('/admin', { replace: true });
    return null;
  }

  const primaryRole = roles[0] || 'pecheur';

  const getDashboardContent = () => {
    if (roles.includes('admin')) {
      return {
        title: "Tableau de Bord Administrateur",
        description: "Gestion complète du système et des utilisateurs",
        kpis: [
          { icon: Users, label: "Utilisateurs Actifs", value: "1,234", trend: "+12%" },
          { icon: Fish, label: "Captures Totales", value: "45.8T", trend: "+8%" },
          { icon: FileText, label: "Licences Valides", value: "892", trend: "+5%" },
          { icon: Shield, label: "Missions", value: "156", trend: "+15%" },
        ],
      };
    }
    
    if (roles.includes('ministre')) {
      return {
        title: "Tableau de Bord Exécutif",
        description: "Vue d'ensemble stratégique du secteur halieutique",
        kpis: [
          { icon: TrendingUp, label: "Production Annuelle", value: "125.4T", trend: "+18%" },
          { icon: BarChart3, label: "Exportations", value: "78.2T", trend: "+22%" },
          { icon: Activity, label: "CPUE Moyenne", value: "12.4", trend: "-3%" },
          { icon: AlertTriangle, label: "Infractions", value: "45", trend: "-8%" },
        ],
      };
    }

    if (roles.includes('direction_centrale') || roles.includes('direction_provinciale')) {
      return {
        title: "Tableau de Bord Direction",
        description: "Supervision et validation des opérations",
        kpis: [
          { icon: FileText, label: "Demandes Pending", value: "23", trend: "" },
          { icon: Fish, label: "Captures du Mois", value: "8.2T", trend: "+5%" },
          { icon: Shield, label: "Infractions", value: "12", trend: "-15%" },
          { icon: Users, label: "Pêcheurs Actifs", value: "456", trend: "+3%" },
        ],
      };
    }

    if (roles.includes('pecheur')) {
      return {
        title: "Mes Activités de Pêche",
        description: "Suivi de vos captures et licences",
        kpis: [
          { icon: Fish, label: "Captures ce Mois", value: "245kg", trend: "+12%" },
          { icon: FileText, label: "Licence", value: "Valide", trend: "" },
          { icon: Activity, label: "CPUE Moyen", value: "8.5", trend: "+5%" },
          { icon: AlertTriangle, label: "Notifications", value: "2", trend: "" },
        ],
      };
    }

    return {
      title: "Tableau de Bord",
      description: "Bienvenue sur la plateforme PÊCHE GABON",
      kpis: [
        { icon: Fish, label: "Captures", value: "0", trend: "" },
        { icon: FileText, label: "Documents", value: "0", trend: "" },
        { icon: Users, label: "Équipe", value: "0", trend: "" },
        { icon: BarChart3, label: "Statistiques", value: "0", trend: "" },
      ],
    };
  };

  const content = getDashboardContent();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fish className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">PÊCHE GABON</h1>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className={roleColors[role]}>
                  {roleLabels[role]}
                </Badge>
              ))}
            </div>
            {roles.includes('admin') && (
              <Button
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
          <p className="text-muted-foreground">{content.description}</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {content.kpis.map((kpi, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.trend && (
                  <p className={`text-xs ${kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend} vs mois dernier
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.includes('pecheur') && (
              <Button 
                className="h-24 flex flex-col gap-2" 
                variant="outline"
                onClick={() => navigate("/captures")}
              >
                <Fish className="h-6 w-6" />
                Déclarer une Capture
              </Button>
            )}
            {(roles.includes('agent_collecte') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                Nouvelle Licence
              </Button>
            )}
            {(roles.includes('inspecteur') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <Shield className="h-6 w-6" />
                Mission de Surveillance
              </Button>
            )}
            {(roles.includes('analyste') || roles.includes('direction_centrale') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <BarChart3 className="h-6 w-6" />
                Rapports & Analytics
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
