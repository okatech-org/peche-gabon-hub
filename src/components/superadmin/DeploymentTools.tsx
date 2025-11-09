import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Rocket, 
  GitBranch, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export const DeploymentTools = () => {
  const [isDeploying, setIsDeploying] = useState(false);

  const deployments = [
    {
      id: "1",
      version: "v2.4.1",
      environment: "Production",
      status: "success",
      timestamp: "2025-11-09 09:30:45",
      duration: "3m 24s",
      deployedBy: "super_admin",
    },
    {
      id: "2",
      version: "v2.4.0",
      environment: "Staging",
      status: "success",
      timestamp: "2025-11-09 08:15:22",
      duration: "2m 56s",
      deployedBy: "admin",
    },
    {
      id: "3",
      version: "v2.3.9",
      environment: "Production",
      status: "failed",
      timestamp: "2025-11-08 16:42:11",
      duration: "1m 12s",
      deployedBy: "super_admin",
    },
  ];

  const edgeFunctions = [
    { name: "analyze-financial-alerts", status: "active", lastDeploy: "2h ago", version: "1.2.0" },
    { name: "analyze-insights", status: "active", lastDeploy: "3h ago", version: "1.1.5" },
    { name: "setup-demo-accounts", status: "active", lastDeploy: "1d ago", version: "1.0.8" },
    { name: "prevoir-recettes-tresor", status: "warning", lastDeploy: "5d ago", version: "1.0.3" },
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    toast.info("Déploiement en cours...");
    setTimeout(() => {
      setIsDeploying(false);
      toast.success("Déploiement réussi !");
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Outils de Déploiement</h2>
          <p className="text-slate-400 text-sm mt-1">Gestion des déploiements et versions</p>
        </div>
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Déploiement...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Nouveau Déploiement
            </>
          )}
        </Button>
      </div>

      {/* Statut Actuel */}
      <Alert className="bg-slate-800/50 border-slate-700">
        <Rocket className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-slate-200">
          <span className="font-semibold">Production:</span> v2.4.1 - Déployé il y a 2h - 
          <Badge variant="secondary" className="ml-2">Stable</Badge>
        </AlertDescription>
      </Alert>

      {/* Historique des Déploiements */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Historique des Déploiements</CardTitle>
          <CardDescription className="text-slate-400">
            Derniers déploiements effectués
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-200">
                        {deployment.version}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {deployment.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{deployment.timestamp}</span>
                      <span>•</span>
                      <span>Durée: {deployment.duration}</span>
                      <span>•</span>
                      <span>Par: {deployment.deployedBy}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={deployment.status === "success" ? "secondary" : "destructive"}
                >
                  {deployment.status === "success" ? "Succès" : "Échec"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Edge Functions</CardTitle>
          <CardDescription className="text-slate-400">
            Statut des fonctions déployées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {edgeFunctions.map((func) => (
              <div
                key={func.name}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-purple-400" />
                  <div>
                    <code className="text-sm font-mono text-slate-200">{func.name}</code>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>v{func.version}</span>
                      <span>•</span>
                      <span>Déployé {func.lastDeploy}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={func.status === "active" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {func.status === "active" ? "Actif" : "Attention"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions Rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Rollback</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              Revenir à v2.4.0
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Migrations DB</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <GitBranch className="h-4 w-4 mr-2" />
              Gérer les migrations
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Vider le cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
