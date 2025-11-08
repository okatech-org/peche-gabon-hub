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
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "section" | "document" | "alert";
  title: string;
  description: string;
  url: string;
  icon: any;
  badge?: string;
}

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
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents_ministeriels")
        .select("id, titre, numero_reference, type_document")
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
        badge: doc.type_document
      }));

      setDocuments(docResults);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchTerm = query.toLowerCase();
    
    // Search in sections
    const sectionResults = sections.filter(section =>
      section.title.toLowerCase().includes(searchTerm) ||
      section.description.toLowerCase().includes(searchTerm)
    );

    // Search in documents
    const documentResults = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description.toLowerCase().includes(searchTerm)
    );

    setResults([...sectionResults, ...documentResults].slice(0, 8));
    setSelectedIndex(0);
  }, [query, documents]);

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
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
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