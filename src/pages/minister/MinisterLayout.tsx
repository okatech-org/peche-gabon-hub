import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MinisterSidebar } from "@/components/minister/MinisterSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ExportPDFButton from "@/components/minister/ExportPDFButton";
import { GlobalSearch } from "@/components/minister/GlobalSearch";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Home, ChevronRight } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Breadcrumb mapping pour navigation intuitive
const breadcrumbMap: Record<string, { label: string; icon?: any }[]> = {
  "/minister-dashboard": [{ label: "Vue d'ensemble" }],
  "/minister-dashboard/artisanal": [{ label: "Analytiques" }, { label: "Pêche Artisanale" }],
  "/minister-dashboard/industrial": [{ label: "Analytiques" }, { label: "Pêche Industrielle" }],
  "/minister-dashboard/surveillance": [{ label: "Analytiques" }, { label: "Surveillance" }],
  "/minister-dashboard/economy": [{ label: "Analytiques" }, { label: "Économie" }],
  "/minister-dashboard/institutional-flows": [{ label: "Analytiques" }, { label: "Remontées Finances" }],
  "/minister-dashboard/alerts": [{ label: "Actions" }, { label: "Alertes" }],
  "/minister-dashboard/remontees": [{ label: "Actions" }, { label: "Remontées Terrain" }],
  "/minister-dashboard/actions": [{ label: "Actions" }, { label: "Actions Ministérielles" }],
  "/minister-dashboard/formations": [{ label: "Actions" }, { label: "Formations" }],
  "/minister-dashboard/history": [{ label: "Actions" }, { label: "Historique" }],
  "/minister-dashboard/settings": [{ label: "Actions" }, { label: "Paramètres" }],
  "/minister-dashboard/documents": [{ label: "Actions" }, { label: "Documents" }],
  "/minister-dashboard/powers": [{ label: "Actions" }, { label: "Pouvoirs Exécutifs" }],
};

export default function MinisterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "tous",
    province: "tous",
    typePeche: "tous",
  });

  const breadcrumbs = breadcrumbMap[location.pathname] || [];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex bg-background">
        <MinisterSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header amélioré avec breadcrumbs */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3">
              <SidebarTrigger className="hover:bg-muted" />
              
              <div className="flex-1 min-w-0">
                {/* Titre et breadcrumbs */}
                <div className="flex items-center gap-2 mb-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/minister-dashboard')}
                  >
                    <Home className="h-3 w-3" />
                  </Button>
                  
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-sm ${index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {crumb.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="hidden md:block">
                  <h1 className="text-lg md:text-xl font-bold truncate">Tableau de Bord Exécutif</h1>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    Vue stratégique du secteur halieutique
                  </p>
                </div>
              </div>

              {/* Actions header */}
              <div className="flex items-center gap-2">
                <div className="hidden lg:block w-64">
                  <GlobalSearch />
                </div>
                
                <Badge variant="secondary" className="bg-primary/10 text-primary hidden sm:flex">
                  Ministre
                </Badge>
                <ThemeToggle />
                <ExportPDFButton filters={filters} />
              </div>
            </div>
            
            {/* Barre de recherche mobile */}
            <div className="lg:hidden px-4 pb-3">
              <GlobalSearch />
            </div>
          </header>

          {/* Main Content - Rendered by child routes with transitions */}
          <main className="flex-1 overflow-auto" id="main-content">
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-[1600px]">
              <div 
                key={location.pathname}
                className="animate-fade-in"
              >
                <Outlet context={{ filters, setFilters }} />
              </div>
            </div>
          </main>

          {/* Footer informatif */}
          <footer className="border-t bg-muted/30 py-3">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                <p>© 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture</p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Données mises à jour en temps réel
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}