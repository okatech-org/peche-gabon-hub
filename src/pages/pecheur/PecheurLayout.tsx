import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PecheurSidebar } from "@/components/pecheur/PecheurSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { DemoBadge } from "@/components/DemoBadge";
import { Menu } from "lucide-react";

export default function PecheurLayout() {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <DemoBadge />
      <div className="min-h-screen w-full flex bg-background">
        <PecheurSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-First Header */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3">
              <SidebarTrigger className="hover:bg-accent transition-colors rounded-md p-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-sm md:text-base truncate">PÊCHE GABON</h1>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-muted/20 py-4">
            <div className="container mx-auto px-4">
              <p className="text-xs text-center text-muted-foreground">
                © 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture
              </p>
            </div>
          </footer>
        </div>
      </div>
      
      <Toaster />
    </SidebarProvider>
  );
}
