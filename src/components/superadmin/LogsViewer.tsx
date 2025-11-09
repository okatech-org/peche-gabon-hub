import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Filter, RefreshCw, Terminal, Database, Zap } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
}

export const LogsViewer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Logs simulés - Dans un système réel, ces données viendraient de Supabase
  const consoleLogs: LogEntry[] = [
    { id: "1", timestamp: "2025-11-09 10:42:21", level: "info", source: "auth", message: "User login successful: admin@demo.ga" },
    { id: "2", timestamp: "2025-11-09 10:42:15", level: "info", source: "api", message: "GET /admin/users - 200 OK (1.7s)" },
    { id: "3", timestamp: "2025-11-09 10:41:30", level: "warn", source: "database", message: "Query performance degraded: 3.2s" },
    { id: "4", timestamp: "2025-11-09 10:40:12", level: "error", source: "edge-function", message: "Timeout in analyze-insights function" },
  ];

  const edgeFunctionLogs: LogEntry[] = [
    { id: "1", timestamp: "2025-11-09 10:42:30", level: "info", source: "setup-demo-accounts", message: "Demo accounts initialized successfully" },
    { id: "2", timestamp: "2025-11-09 10:41:45", level: "info", source: "analyze-insights", message: "Processing 127 data points" },
    { id: "3", timestamp: "2025-11-09 10:40:22", level: "error", source: "prevoir-recettes", message: "Failed to fetch historical data" },
  ];

  const postgresLogs: LogEntry[] = [
    { id: "1", timestamp: "2025-11-09 10:42:25", level: "info", source: "postgres", message: "Connection authorized: user=authenticator" },
    { id: "2", timestamp: "2025-11-09 10:41:50", level: "info", source: "postgres", message: "Checkpoint complete: wrote 20 buffers" },
    { id: "3", timestamp: "2025-11-09 10:40:15", level: "warn", source: "postgres", message: "Slow query detected: 2.8s on table demandes" },
  ];

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error": return "destructive";
      case "warn": return "outline";
      case "info": return "secondary";
      case "debug": return "default";
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const LogList = ({ logs }: { logs: LogEntry[] }) => (
    <ScrollArea className="h-[600px] w-full rounded-md border border-slate-700 bg-slate-900/50 p-4">
      <div className="space-y-2">
        {logs
          .filter(log => 
            searchQuery === "" || 
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.source.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getLevelColor(log.level)} className="text-xs">
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400">{log.timestamp}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.source}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-200 font-mono">{log.message}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Logs Système</h2>
          <p className="text-slate-400 text-sm mt-1">Consultation des logs en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Logs Tabs */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <Tabs defaultValue="console">
            <TabsList className="bg-slate-900/50">
              <TabsTrigger value="console" className="gap-2">
                <Terminal className="h-4 w-4" />
                Console
              </TabsTrigger>
              <TabsTrigger value="edge-functions" className="gap-2">
                <Zap className="h-4 w-4" />
                Edge Functions
              </TabsTrigger>
              <TabsTrigger value="postgres" className="gap-2">
                <Database className="h-4 w-4" />
                PostgreSQL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="mt-4">
              <LogList logs={consoleLogs} />
            </TabsContent>

            <TabsContent value="edge-functions" className="mt-4">
              <LogList logs={edgeFunctionLogs} />
            </TabsContent>

            <TabsContent value="postgres" className="mt-4">
              <LogList logs={postgresLogs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
