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
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3">
              <SidebarTrigger className="hover:bg-muted transition-colors rounded-md" />
              
              <div className="flex-1 min-w-0">
                {/* Titre et breadcrumbs */}
                <div className="flex items-center gap-2 mb-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all rounded-md group"
                    onClick={() => navigate('/minister-dashboard')}
                  >
                    <Home className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  </Button>
                  
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-sm transition-colors ${index === breadcrumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {crumb.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="hidden md:block">
                  <h1 className="text-lg md:text-xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Tableau de Bord Exécutif
                  </h1>
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
                
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hidden sm:flex font-medium shadow-sm">
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
          <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted" id="main-content">
            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-[1600px]">
              <div 
                key={location.pathname}
                className="animate-fade-in"
                style={{ animationDuration: '0.4s' }}
              >
                <Outlet context={{ filters, setFilters }} />
              </div>
            </div>
          </main>

          {/* Footer informatif */}
          <footer className="border-t border-border/50 bg-muted/20 backdrop-blur-sm py-4">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-muted-foreground font-medium">
                  © 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-700 dark:text-green-400 font-medium">Temps réel</span>
                  </div>
                  <span className="text-muted-foreground">Version 2.0</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}