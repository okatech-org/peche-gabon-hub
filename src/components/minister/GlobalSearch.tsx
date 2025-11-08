import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FileText, 
  TrendingUp, 
  Anchor, 
  Ship, 
  MapPin, 
  DollarSign, 
  Bell,
  Gavel,
  History,
  Settings,
  Building2,
  Filter,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SearchResult {
  id: string;
  type: "section" | "document" | "alert";
  title: string;
  description: string;
  url: string;
  icon: any;
  badge?: string;
  date?: Date;
}

type FilterType = "all" | "section" | "document" | "alert";

const sections: SearchResult[] = [
  { 
    id: "overview", 
    type: "section", 
    title: "Vue d'ensemble", 
    description: "KPIs et statistiques globales",
    url: "/minister-dashboard",
    icon: TrendingUp
  },
  { 
    id: "artisanal", 
    type: "section", 
    title: "Pêche Artisanale", 
    description: "Captures, CPUE, licences",
    url: "/minister-dashboard/artisanal",
    icon: Anchor
  },
  { 
    id: "industrial", 
    type: "section", 
    title: "Pêche Industrielle", 
    description: "Navires, armements, activité",
    url: "/minister-dashboard/industrial",
    icon: Ship
  },
  { 
    id: "surveillance", 
    type: "section", 
    title: "Surveillance", 
    description: "Carte, zones, infractions",
    url: "/minister-dashboard/surveillance",
    icon: MapPin
  },
  { 
    id: "economy", 
    type: "section", 
    title: "Économie", 
    description: "Exportations, valeur, prix",
    url: "/minister-dashboard/economy",
    icon: DollarSign
  },
  { 
    id: "flows", 
    type: "section", 
    title: "Remontées Finances", 
    description: "Taxes et répartition",
    url: "/minister-dashboard/institutional-flows",
    icon: Building2
  },
  { 
    id: "alerts", 
    type: "section", 
    title: "Alertes", 
    description: "Notifications automatiques",
    url: "/minister-dashboard/alerts",
    icon: Bell,
    badge: "3"
  },
  { 
    id: "documents", 
    type: "section", 
    title: "Documents", 
    description: "Génération documents ministériels",
    url: "/minister-dashboard/documents",
    icon: FileText
  },
  { 
    id: "powers", 
    type: "section", 
    title: "Pouvoirs", 
    description: "Actions ministérielles",
    url: "/minister-dashboard/powers",
    icon: Gavel
  },
  { 
    id: "history", 
    type: "section", 
    title: "Historique", 
    description: "Réglementations, notifications",
    url: "/minister-dashboard/history",
    icon: History
  },
  { 
    id: "settings", 
    type: "section", 
    title: "Paramètres", 
    description: "Configuration",
    url: "/minister-dashboard/settings",
    icon: Settings
  },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [alerts, setAlerts] = useState<SearchResult[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load documents and alerts on mount
  useEffect(() => {
    loadDocuments();
    loadAlerts();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents_ministeriels")
        .select("id, titre, numero_reference, type_document, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const docResults: SearchResult[] = (data || []).map(doc => ({
        id: doc.id,
        type: "document" as const,
        title: doc.titre,
        description: doc.numero_reference,
        url: "/minister-dashboard/documents",
        icon: FileText,
        badge: doc.type_document,
        date: new Date(doc.created_at)
      }));

      setDocuments(docResults);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alertes_rapports")
        .select("id, indicateur, type_variation, severite, created_at, statut")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const alertResults: SearchResult[] = (data || []).map(alert => ({
        id: alert.id,
        type: "alert" as const,
        title: alert.indicateur,
        description: `${alert.type_variation} - ${alert.statut}`,
        url: "/minister-dashboard/alerts",
        icon: Bell,
        badge: alert.severite,
        date: new Date(alert.created_at)
      }));

      setAlerts(alertResults);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  // Search logic with filters
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchTerm = query.toLowerCase();
    let allResults: SearchResult[] = [];
    
    // Filter by type
    if (filterType === "all" || filterType === "section") {
      const sectionResults = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm) ||
        section.description.toLowerCase().includes(searchTerm)
      );
      allResults.push(...sectionResults);
    }

    if (filterType === "all" || filterType === "document") {
      const documentResults = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm)
      );
      allResults.push(...documentResults);
    }

    if (filterType === "all" || filterType === "alert") {
      const alertResults = alerts.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm) ||
        alert.description.toLowerCase().includes(searchTerm)
      );
      allResults.push(...alertResults);
    }

    // Filter by date range
    if (startDate || endDate) {
      allResults = allResults.filter(result => {
        if (!result.date) return result.type === "section"; // Keep sections as they don't have dates
        const resultDate = result.date;
        
        if (startDate && endDate) {
          return resultDate >= startDate && resultDate <= endDate;
        } else if (startDate) {
          return resultDate >= startDate;
        } else if (endDate) {
          return resultDate <= endDate;
        }
        return true;
      });
    }

    setResults(allResults.slice(0, 8));
    setSelectedIndex(0);
  }, [query, documents, alerts, filterType, startDate, endDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }

      // Arrow navigation
      if (isOpen && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "section":
        return <Badge variant="secondary" className="text-xs">Section</Badge>;
      case "document":
        return <Badge variant="outline" className="text-xs">Document</Badge>;
      case "alert":
        return <Badge variant="destructive" className="text-xs">Alerte</Badge>;
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setFilterType("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = filterType !== "all" || startDate || endDate;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Rechercher... (⌘K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9 pr-4 bg-muted/50 border-muted-foreground/20 focus:bg-background"
          />
        </div>
        
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className={`relative ${hasActiveFilters ? 'border-primary' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filtres avancés</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "section", "document", "alert"] as FilterType[]).map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                      className="text-xs"
                    >
                      {type === "all" ? "Tous" : type === "section" ? "Sections" : type === "document" ? "Documents" : "Alertes"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Période</label>
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <span className="text-xs">
                          {startDate ? format(startDate, "d MMM yyyy", { locale: fr }) : "Date de début"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <span className="text-xs">
                          {endDate ? format(endDate, "d MMM yyyy", { locale: fr }) : "Date de fin"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Dropdown Results */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-fade-in"
        >
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left ${
                      index === selectedIndex ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        {result.badge && (
                          <Badge variant="destructive" className="h-4 text-xs px-1.5">
                            {result.badge}
                          </Badge>
                        )}
                        {getTypeBadge(result.type)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Commencez à taper pour rechercher...
            </div>
          )}
        </div>
      )}
    </div>
  );
}