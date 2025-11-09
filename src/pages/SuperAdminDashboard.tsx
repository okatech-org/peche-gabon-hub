import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, LogOut, Menu } from "lucide-react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
import { SystemMonitoring } from "@/components/superadmin/SystemMonitoring";
import { LogsViewer } from "@/components/superadmin/LogsViewer";
import { PerformanceMetrics } from "@/components/superadmin/PerformanceMetrics";
import { DeploymentTools } from "@/components/superadmin/DeploymentTools";
import { DatabaseManager } from "@/components/superadmin/DatabaseManager";
import { BackupManager } from "@/components/superadmin/BackupManager";
import { SecurityPanel } from "@/components/superadmin/SecurityPanel";
import { DeveloppementPanel } from "@/components/admin/DeveloppementPanel";

const SuperAdminDashboard = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950">
        <SuperAdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 rounded-md p-2 transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-lg">
                  <Server className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-100 tracking-tight">Super Admin</h1>
                  <p className="text-xs text-slate-500">Gestion Technique Complète</p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-slate-400">{user?.email}</span>
                  {roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="outline" 
                      className="border-slate-700 text-slate-300 bg-slate-900/50 text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-slate-100 hover:border-slate-600 transition-all"
                >
                  Retour Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/superadmin-dashboard/monitoring" replace />} />
              <Route path="/monitoring" element={<SystemMonitoring />} />
              <Route path="/logs" element={<LogsViewer />} />
              <Route path="/performance" element={<PerformanceMetrics />} />
              <Route path="/database" element={<DatabaseManager />} />
              <Route path="/deployment" element={<DeploymentTools />} />
              <Route path="/backup" element={<BackupManager />} />
              <Route path="/security" element={<SecurityPanel />} />
              <Route path="/developpement" element={<DeveloppementPanel />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;
