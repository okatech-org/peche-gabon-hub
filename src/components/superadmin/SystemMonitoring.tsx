import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, Activity, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  requests: number;
  errors: number;
  latency: number;
}

export const SystemMonitoring = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: "0d 0h 0m",
    requests: 0,
    errors: 0,
    latency: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSystemStats = () => {
    setIsRefreshing(true);
    // Simulation des métriques - Dans un vrai système, ces données viendraient d'une API backend
    setTimeout(() => {
      setStats({
        cpu: Math.random() * 100,
        memory: 45 + Math.random() * 20,
        disk: 35 + Math.random() * 15,
        uptime: "7d 14h 32m",
        requests: Math.floor(15000 + Math.random() * 5000),
        errors: Math.floor(Math.random() * 50),
        latency: Math.floor(50 + Math.random() * 100),
      });
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (type === 'cpu') {
      if (value > 80) return "destructive";
      if (value > 60) return "outline";
      return "secondary";
    }
    if (value > 85) return "destructive";
    if (value > 70) return "outline";
    return "secondary";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Welcome To The Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble des ressources et performances en temps réel</p>
        </div>
        <Button 
          onClick={fetchSystemStats} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2 hover:scale-105 transition-transform"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Ressources Système */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-pink-500/10 via-card to-purple-500/10 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <div className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-sm">
            <Cpu className="h-5 w-5 text-pink-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground text-xs">Utilisation CPU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-3">{stats.cpu.toFixed(1)}%</div>
            <Progress value={stats.cpu} className="h-1.5" />
            <Badge 
              className={`mt-3 text-xs font-medium ${
                stats.cpu > 80 ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                stats.cpu > 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                "bg-green-500/20 text-green-400 border-green-500/30"
              }`}
            >
              {stats.cpu > 80 ? "Élevé" : stats.cpu > 60 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-cyan-500/10 via-card to-blue-500/10 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <div className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-sm">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground text-xs">Mémoire RAM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-3">{stats.memory.toFixed(1)}%</div>
            <Progress value={stats.memory} className="h-1.5" />
            <Badge 
              className={`mt-3 text-xs font-medium ${
                stats.memory > 85 ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                stats.memory > 70 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                "bg-green-500/20 text-green-400 border-green-500/30"
              }`}
            >
              {stats.memory > 85 ? "Élevé" : stats.memory > 70 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-orange-500/10 via-card to-red-500/10 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <div className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-sm">
            <HardDrive className="h-5 w-5 text-orange-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground text-xs">Espace Disque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-3">{stats.disk.toFixed(1)}%</div>
            <Progress value={stats.disk} className="h-1.5" />
            <Badge 
              className={`mt-3 text-xs font-medium ${
                stats.disk > 85 ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                stats.disk > 70 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                "bg-green-500/20 text-green-400 border-green-500/30"
              }`}
            >
              {stats.disk > 85 ? "Élevé" : stats.disk > 70 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-green-500/10 via-card to-emerald-500/10 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <div className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-sm">
            <Clock className="h-5 w-5 text-green-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground text-xs">System Uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-3">{stats.uptime}</div>
            <p className="text-xs text-muted-foreground mb-2">Système stable et opérationnel</p>
            <Badge className="text-xs font-medium bg-green-500/20 text-green-400 border-green-500/30">
              Actif
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Métriques Application */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Requêtes Totales</CardTitle>
            <CardDescription className="text-muted-foreground">Dernières 24 heures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-2">{stats.requests.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              ~{Math.floor(stats.requests / 24)} requêtes/heure
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-red-500/5 via-card to-orange-500/5 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Erreurs Détectées</CardTitle>
            <CardDescription className="text-muted-foreground">Taux d'erreur système</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-2">{stats.errors}</div>
            <p className="text-sm text-muted-foreground">
              {((stats.errors / stats.requests) * 100).toFixed(3)}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 via-card to-cyan-500/5 backdrop-blur-sm hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Latence Moyenne</CardTitle>
            <CardDescription className="text-muted-foreground">Temps de réponse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-2">{stats.latency}ms</div>
            <Badge 
              className={`text-xs font-medium ${
                stats.latency > 200 ? "bg-red-500/20 text-red-400 border-red-500/30" : 
                "bg-green-500/20 text-green-400 border-green-500/30"
              }`}
            >
              {stats.latency > 200 ? "Lent" : "Rapide"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
