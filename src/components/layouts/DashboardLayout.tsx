import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { getUserPrimaryRole } from "@/lib/roleConfig";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const DashboardLayout = ({ children, showSidebar = true }: DashboardLayoutProps) => {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();

  // Get primary role configuration
  const roleConfig = getUserPrimaryRole(roles as any);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!roleConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Aucun rôle attribué</p>
          <p className="text-sm text-muted-foreground">
            Veuillez contacter l'administrateur
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {showSidebar && <DashboardSidebar roleConfig={roleConfig} />}
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader roleConfig={roleConfig} />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 animate-fade-in">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/30 py-4">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>© 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture</p>
                <p>Données mises à jour quotidiennement</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};
