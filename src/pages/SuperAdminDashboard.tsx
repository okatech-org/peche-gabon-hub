import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Activity, FileText, Rocket, Database, Code, Shield, Network, HardDrive } from "lucide-react";
import { SystemMonitoring } from "@/components/superadmin/SystemMonitoring";
import { LogsViewer } from "@/components/superadmin/LogsViewer";
import { PerformanceMetrics } from "@/components/superadmin/PerformanceMetrics";
import { DeploymentTools } from "@/components/superadmin/DeploymentTools";
import { DatabaseManager } from "@/components/superadmin/DatabaseManager";
import { BackupManager } from "@/components/superadmin/BackupManager";
import { SecurityPanel } from "@/components/superadmin/SecurityPanel";
import { DeveloppementPanel } from "@/components/admin/DeveloppementPanel";

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("monitoring");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-slate-800 to-zinc-900 border border-slate-700">
              <Server className="h-6 w-6 text-slate-200" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Super Admin Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Gestion technique complète - Architecture, Backend, Frontend, Sécurité & Réseau
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="monitoring" className="gap-2">
              <Activity className="h-4 w-4" />
              Monitoring Système
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Network className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Base de données
            </TabsTrigger>
            <TabsTrigger value="deployment" className="gap-2">
              <Rocket className="h-4 w-4" />
              Déploiement
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <HardDrive className="h-4 w-4" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="developpement" className="gap-2">
              <Code className="h-4 w-4" />
              Développement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <LogsViewer />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseManager />
          </TabsContent>

          <TabsContent value="deployment" className="space-y-6">
            <DeploymentTools />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <BackupManager />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityPanel />
          </TabsContent>

          <TabsContent value="developpement" className="space-y-6">
            <DeveloppementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
