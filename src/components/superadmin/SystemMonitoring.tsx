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
          <h2 className="text-2xl font-bold text-slate-100">Monitoring Système</h2>
          <p className="text-slate-400 text-sm mt-1">Vue d'ensemble des ressources et performances</p>
        </div>
        <Button 
          onClick={fetchSystemStats} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Ressources Système */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.cpu.toFixed(1)}%</div>
            <Progress value={stats.cpu} className="mt-2 h-2" />
            <Badge 
              variant={getStatusColor(stats.cpu, 'cpu')} 
              className="mt-2 text-xs"
            >
              {stats.cpu > 80 ? "Élevé" : stats.cpu > 60 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Mémoire</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.memory.toFixed(1)}%</div>
            <Progress value={stats.memory} className="mt-2 h-2" />
            <Badge 
              variant={getStatusColor(stats.memory, 'memory')} 
              className="mt-2 text-xs"
            >
              {stats.memory > 85 ? "Élevé" : stats.memory > 70 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Disque</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.disk.toFixed(1)}%</div>
            <Progress value={stats.disk} className="mt-2 h-2" />
            <Badge 
              variant={getStatusColor(stats.disk, 'disk')} 
              className="mt-2 text-xs"
            >
              {stats.disk > 85 ? "Élevé" : stats.disk > 70 ? "Modéré" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.uptime}</div>
            <p className="text-xs text-slate-400 mt-2">Système stable</p>
            <Badge variant="secondary" className="mt-2 text-xs">Actif</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Métriques Application */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-slate-200">Requêtes</CardTitle>
            <CardDescription className="text-slate-400">Dernières 24h</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{stats.requests.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-2">
              ~{Math.floor(stats.requests / 24)} req/heure
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-slate-200">Erreurs</CardTitle>
            <CardDescription className="text-slate-400">Taux d'erreur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{stats.errors}</div>
            <p className="text-xs text-slate-400 mt-2">
              {((stats.errors / stats.requests) * 100).toFixed(2)}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-slate-200">Latence Moyenne</CardTitle>
            <CardDescription className="text-slate-400">Temps de réponse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{stats.latency}ms</div>
            <Badge 
              variant={stats.latency > 200 ? "destructive" : "secondary"} 
              className="mt-2 text-xs"
            >
              {stats.latency > 200 ? "Lent" : "Rapide"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
