import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Table, HardDrive, Zap, RefreshCw } from "lucide-react";

export const DatabaseManager = () => {
  const tables = [
    { name: "demandes", rows: 15234, size: "45.2 MB", lastUpdate: "Il y a 5 min" },
    { name: "quittances", rows: 28456, size: "78.5 MB", lastUpdate: "Il y a 12 min" },
    { name: "captures", rows: 45789, size: "125.8 MB", lastUpdate: "Il y a 3 min" },
    { name: "remontees", rows: 12345, size: "32.4 MB", lastUpdate: "Il y a 8 min" },
    { name: "users", rows: 234, size: "1.2 MB", lastUpdate: "Il y a 1h" },
  ];

  const connections = {
    active: 12,
    idle: 8,
    max: 100,
    usage: 20,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Gestion Base de Données</h2>
          <p className="text-slate-400 text-sm mt-1">Monitoring et administration PostgreSQL</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Connexions Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Connexions Actives</CardTitle>
            <Zap className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{connections.active}</div>
            <p className="text-xs text-slate-400 mt-1">En cours d'utilisation</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Connexions Idle</CardTitle>
            <Database className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{connections.idle}</div>
            <p className="text-xs text-slate-400 mt-1">En attente</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Utilisation</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{connections.usage}%</div>
            <p className="text-xs text-slate-400 mt-1">{connections.active + connections.idle}/{connections.max} max</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Taille Totale</CardTitle>
            <Table className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">283 MB</div>
            <p className="text-xs text-slate-400 mt-1">5 tables principales</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Tables de la Base de Données</CardTitle>
          <CardDescription className="text-slate-400">
            Vue d'ensemble des tables principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <Table className="h-5 w-5 text-blue-400" />
                  <div>
                    <code className="text-sm font-mono font-semibold text-slate-200">
                      {table.name}
                    </code>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{table.rows.toLocaleString()} lignes</span>
                      <span>•</span>
                      <span>{table.size}</span>
                      <span>•</span>
                      <span>MAJ: {table.lastUpdate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Voir
                  </Button>
                  <Button variant="outline" size="sm">
                    Exporter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Operations */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Créer une sauvegarde
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              Dernière: Il y a 6h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Optimisation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Optimiser les tables
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              Dernière: Il y a 2j
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Analyse</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              <Table className="h-4 w-4 mr-2" />
              Analyser les performances
            </Button>
            <p className="text-xs text-slate-400 mt-2">
              Dernière: Il y a 1j
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
