import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle, CheckCircle2, Key, UserX, FileText } from "lucide-react";

export const SecurityPanel = () => {
  const securityScore = 87;
  
  const securityMetrics = [
    { name: "RLS Policies", status: "active", count: 45, icon: Shield, color: "text-green-400" },
    { name: "API Keys Actives", status: "active", count: 12, icon: Key, color: "text-blue-400" },
    { name: "Sessions Actives", status: "normal", count: 23, icon: Lock, color: "text-purple-400" },
    { name: "Tentatives Échouées", status: "warning", count: 8, icon: UserX, color: "text-orange-400" },
  ];

  const alerts = [
    { 
      severity: "medium", 
      message: "8 tentatives de connexion échouées détectées dans les 24 dernières heures",
      timestamp: "Il y a 2h"
    },
    { 
      severity: "low", 
      message: "Certificat SSL expire dans 45 jours",
      timestamp: "Il y a 1j"
    },
  ];

  const recentActions = [
    { user: "admin@demo.ga", action: "Modification RLS policy - table demandes", timestamp: "Il y a 30 min" },
    { user: "super_admin", action: "Rotation des clés API", timestamp: "Il y a 2h" },
    { user: "admin@demo.ga", action: "Ajout utilisateur - role: inspecteur", timestamp: "Il y a 5h" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Security Panel</h2>
        <p className="text-muted-foreground text-sm mt-1">Surveillance et gestion de la sécurité</p>
      </div>

      {/* Security Score */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border/50">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Score de Sécurité Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-foreground">{securityScore}/100</div>
            <Badge className="text-lg px-4 py-2 bg-green-500/20 text-green-400 border-green-500/30">
              {securityScore >= 80 ? "Excellent" : securityScore >= 60 ? "Bon" : "À améliorer"}
            </Badge>
          </div>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {securityMetrics.map((metric) => (
          <Card key={metric.name} className="border-border/50 bg-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {metric.name}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.count}</div>
              <Badge 
                className={`mt-2 ${
                  metric.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : 
                  metric.status === "normal" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : 
                  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                }`}
              >
                {metric.status === "active" ? "Actif" : metric.status === "normal" ? "Normal" : "Attention"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Alerts */}
      <Card className="border-border/50 bg-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">Alertes de Sécurité</CardTitle>
          <CardDescription className="text-muted-foreground">
            Notifications et événements récents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert 
              key={index}
              className={`${
                alert.severity === "high" 
                  ? "bg-red-500/10 border-red-500/30" 
                  : alert.severity === "medium"
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-muted/30 border-border/50"
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${
                alert.severity === "high" 
                  ? "text-red-400" 
                  : alert.severity === "medium"
                  ? "text-orange-400"
                  : "text-muted-foreground"
              }`} />
              <AlertDescription className="text-foreground">
                {alert.message}
                <span className="block text-xs text-muted-foreground mt-1">{alert.timestamp}</span>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Recent Security Actions */}
      <Card className="border-border/50 bg-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">Actions Récentes</CardTitle>
          <CardDescription className="text-muted-foreground">
            Modifications de sécurité effectuées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActions.map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{action.action}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{action.user}</span>
                    <span>•</span>
                    <span>{action.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Gérer les RLS
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Rotation des clés
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Rapport d'audit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
