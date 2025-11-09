import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, Globe, Database, Clock } from "lucide-react";

export const PerformanceMetrics = () => {
  const metrics = [
    {
      name: "Temps de chargement moyen",
      value: "1.2s",
      change: -15,
      trend: "down",
      icon: Clock,
      color: "text-blue-400",
    },
    {
      name: "Requêtes API/min",
      value: "847",
      change: 23,
      trend: "up",
      icon: Zap,
      color: "text-green-400",
    },
    {
      name: "Bande passante",
      value: "234 MB/s",
      change: 8,
      trend: "up",
      icon: Globe,
      color: "text-purple-400",
    },
    {
      name: "Query DB moyen",
      value: "45ms",
      change: -12,
      trend: "down",
      icon: Database,
      color: "text-amber-400",
    },
  ];

  const endpoints = [
    { path: "/api/admin/users", calls: 1234, avgTime: "120ms", errors: 2, status: "healthy" },
    { path: "/api/captures", calls: 856, avgTime: "95ms", errors: 0, status: "healthy" },
    { path: "/api/remontees", calls: 743, avgTime: "210ms", errors: 5, status: "warning" },
    { path: "/api/auth/login", calls: 432, avgTime: "180ms", errors: 1, status: "healthy" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Performance Metrics</h2>
        <p className="text-muted-foreground text-sm mt-1">Analyse des performances en temps réel</p>
      </div>

      {/* Métriques Principales */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="border-border/50 bg-card backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {metric.name}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <div className="flex items-center gap-2 mt-2">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-xs ${metric.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="text-xs text-muted-foreground">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Endpoints Performance */}
      <Card className="border-border/50 bg-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">Performance des Endpoints</CardTitle>
          <CardDescription className="text-muted-foreground">
            Top endpoints par volume de requêtes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                    <Badge
                      className={endpoint.status === "healthy" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}
                    >
                      {endpoint.status === "healthy" ? "Sain" : "Attention"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{endpoint.calls.toLocaleString()} appels</span>
                    <span>Temps moyen: {endpoint.avgTime}</span>
                    <span className={endpoint.errors > 0 ? "text-red-400" : ""}>
                      {endpoint.errors} erreur{endpoint.errors > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Analytics */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-border/50 bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Répartition des Requêtes</CardTitle>
            <CardDescription className="text-muted-foreground">Par type de requête</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { method: "GET", count: 12450, percentage: 65 },
                { method: "POST", count: 4380, percentage: 23 },
                { method: "PUT", count: 1520, percentage: 8 },
                { method: "DELETE", count: 760, percentage: 4 },
              ].map((item) => (
                <div key={item.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{item.method}</span>
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Codes de Réponse</CardTitle>
            <CardDescription className="text-muted-foreground">Distribution des statuts HTTP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { code: "200 OK", count: 18453, color: "from-green-500 to-emerald-500" },
                { code: "400 Bad Request", count: 234, color: "from-yellow-500 to-orange-500" },
                { code: "401 Unauthorized", count: 156, color: "from-orange-500 to-red-500" },
                { code: "500 Server Error", count: 47, color: "from-red-500 to-pink-500" },
              ].map((item) => (
                <div key={item.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${item.color}`} />
                    <span className="text-sm text-foreground">{item.code}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
