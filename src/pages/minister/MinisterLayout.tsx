import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MinisterSidebar } from "@/components/minister/MinisterSidebar";
import { Badge } from "@/components/ui/badge";
import ExportPDFButton from "@/components/minister/ExportPDFButton";
import { GlobalSearch } from "@/components/minister/GlobalSearch";
import { useState } from "react";

export default function MinisterLayout() {
  const location = useLocation();
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "tous",
    province: "tous",
    typePeche: "tous",
  });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-gradient-subtle">
        <MinisterSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
            <div className="flex items-center gap-4 px-6 py-3">
              <SidebarTrigger className="hover:bg-muted" />
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold truncate">Tableau de Bord Exécutif</h1>
                  <p className="text-sm text-muted-foreground truncate">
                    Vue stratégique du secteur halieutique
                  </p>
                </div>
                <div className="flex-1 max-w-md">
                  <GlobalSearch />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-accent hidden sm:flex">
                  Ministre
                </Badge>
                <ExportPDFButton filters={filters} />
              </div>
            </div>
          </header>

          {/* Main Content - Rendered by child routes with transitions */}
          <main className="flex-1 overflow-auto" id="main-content">
            <div className="container mx-auto px-6 py-6">
              <div 
                key={location.pathname}
                className="animate-fade-in"
              >
                <Outlet context={{ filters, setFilters }} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}