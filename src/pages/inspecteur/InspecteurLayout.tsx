import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { InspecteurSidebar } from "@/components/inspecteur/InspecteurSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Toaster } from "@/components/ui/toaster";
import { DemoBadge } from "@/components/DemoBadge";

export default function InspecteurLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <DemoBadge />
      <div className="min-h-screen flex w-full bg-background">
        <InspecteurSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header mobile-first */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="-ml-2" />
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 animate-fade-in">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/30 py-3 px-4">
            <div className="text-center text-xs text-muted-foreground">
              © 2025 PÊCHE GABON - Contrôle et Surveillance
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
