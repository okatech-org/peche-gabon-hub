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
      <div className="min-h-screen flex w-full bg-background">
        <SuperAdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-2 transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Super Admin</h1>
                  <p className="text-xs text-muted-foreground">Gestion Technique Complète</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Type to Search"
                    className="w-full h-10 pl-4 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  {roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="outline" 
                      className="border-primary/30 text-primary bg-primary/10 text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex border-border/50 hover:bg-muted hover:border-primary/30 transition-all"
                >
                  Retour
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 md:p-8">
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
