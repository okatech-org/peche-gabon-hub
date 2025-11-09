import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  Newspaper,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Filter,
  Eye,
  Map,
  List
} from "lucide-react";
import { GenerateSyntheseDialog } from "./GenerateSyntheseDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RemonteeTypeCards } from "./RemonteeTypeCards";
import { RemonteeTypeDetailDialog } from "./RemonteeTypeDetailDialog";
import { RemonteesSyntheseGlobale } from "./RemonteesSyntheseGlobale";
import { RemonteesMap } from "./RemonteesMap";
import { RemonteeCardEnriched } from "./RemonteeCardEnriched";

interface RemonteeStats {
  total: number;
  nouveau: number;
  en_analyse: number;
  en_traitement: number;
  resolu: number;
  par_type: Record<string, number>;
  par_priorite: Record<string, number>;
  par_sentiment: Record<string, number>;
  nouveaux_par_type: Record<string, number>;
}

interface Remontee {
  id: string;
  numero_reference: string;
  type_remontee: string;
  titre: string;
  description: string;
  source?: string;
  url_source?: string;
  localisation?: string;
  niveau_priorite: string;
  statut: string;
  sentiment?: string;
  categorie?: string;
  validation_status: string;
  created_at: string;
  date_incident?: string;
  impact_estime?: string;
  nb_personnes_concernees?: number;
}

export function RemonteesTerrainDashboard() {
  const [stats, setStats] = useState<RemonteeStats>({
    total: 0,
    nouveau: 0,
    en_analyse: 0,
    en_traitement: 0,
    resolu: 0,
    par_type: {},
    par_priorite: {},
    par_sentiment: {},
    nouveaux_par_type: {},
  });
  const [remontees, setRemontees] = useState<Remontee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRemontee, setSelectedRemontee] = useState<Remontee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTypeForDetail, setSelectedTypeForDetail] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("remontees_terrain")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRemontees(data || []);
      
      // Calculer les statistiques
      const newStats: RemonteeStats = {
        total: data?.length || 0,
        nouveau: data?.filter(r => r.statut === "nouveau").length || 0,
        en_analyse: data?.filter(r => r.statut === "en_analyse").length || 0,
        en_traitement: data?.filter(r => r.statut === "en_traitement").length || 0,
        resolu: data?.filter(r => r.statut === "resolu").length || 0,
        par_type: {},
        par_priorite: {},
        par_sentiment: {},
        nouveaux_par_type: {},
      };

      // Compter par type
      data?.forEach(r => {
        newStats.par_type[r.type_remontee] = (newStats.par_type[r.type_remontee] || 0) + 1;
        newStats.par_priorite[r.niveau_priorite] = (newStats.par_priorite[r.niveau_priorite] || 0) + 1;
        if (r.sentiment) {
          newStats.par_sentiment[r.sentiment] = (newStats.par_sentiment[r.sentiment] || 0) + 1;
        }
        // Compter les nouvelles remontées par type
        if (r.statut === "nouveau") {
          newStats.nouveaux_par_type[r.type_remontee] = (newStats.nouveaux_par_type[r.type_remontee] || 0) + 1;
        }
      });

      setStats(newStats);
    } catch (error: any) {
      console.error("Error loading remontees:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les remontées",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRemontees = remontees.filter(r => {
    const matchesType = filterType === "tous" || r.type_remontee === filterType;
    const matchesStatut = filterStatut === "tous" || r.statut === filterStatut;
    const matchesSearch = !searchTerm || 
      r.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.numero_reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatut && matchesSearch;
  });

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "critique": return "destructive";
      case "haut": return "default";
      case "moyen": return "secondary";
      case "bas": return "outline";
      default: return "outline";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positif": return "😊";
      case "neutre": return "😐";
      case "negatif": return "😟";
      default: return "";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reclamation: "Réclamation",
      suggestion: "Suggestion",
      denonciation: "Dénonciation",
      article_presse: "Article de presse",
      commentaire_reseau: "Commentaire réseau",
      avis_reseau_social: "Avis réseau social",
    };
    return labels[type] || type;
  };

  const handleViewTypeDetails = (typeId: string) => {
    setSelectedTypeForDetail(typeId);
    setDetailDialogOpen(true);
  };

  const getRemonteesByType = (typeId: string) => {
    return remontees.filter(r => r.type_remontee === typeId);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête moderne */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Remontées Terrain
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des réclamations, suggestions et informations du terrain
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              Désélectionner tout
            </Button>
          )}
          <GenerateSyntheseDialog 
            remonteeIds={selectedIds.length > 0 ? selectedIds : remontees.map(r => r.id)} 
            onSuccess={() => setSelectedIds([])} 
          />
        </div>
      </div>

      {/* Synthèse globale */}
      <RemonteesSyntheseGlobale
        stats={stats}
        remontees={remontees}
        onGenerateSynthese={() => {
          // Générer synthèse de toutes les remontées
          const allIds = remontees.map(r => r.id);
          // On pourrait ouvrir le dialog de synthèse ici
        }}
      />

      {/* Statistiques globales modernes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nouveau</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">{stats.nouveau}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Analyse</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">{stats.en_analyse}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-yellow-500/10">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Traitement</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">{stats.en_traitement}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Résolu</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">{stats.resolu}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cartes de types de remontées avec design moderne */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Types de remontées</h3>
              <p className="text-xs text-muted-foreground">
                Cliquez pour filtrer ou survolez pour voir les détails
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/40">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 text-xs"
              >
                <List className="h-3.5 w-3.5 mr-1" />
                Liste
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="h-7 text-xs"
              >
                <Map className="h-3.5 w-3.5 mr-1" />
                Carte
              </Button>
            </div>
          </div>
        </div>
        <RemonteeTypeCards 
          selectedType={filterType}
          onTypeSelect={setFilterType}
          typeCounts={stats.par_type}
          newCounts={stats.nouveaux_par_type}
          onViewDetails={handleViewTypeDetails}
        />
      </div>

      {/* Vue Liste ou Carte */}
      {viewMode === "map" ? (
        <RemonteesMap
          remontees={filteredRemontees}
          onRemonteeSelect={(remontee) => setSelectedRemontee(remontee)}
        />
      ) : (
        <>
      {/* Filtres additionnels avec design moderne */}
      <Card className="border-border/40 bg-gradient-to-br from-card to-card/95">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="🔍 Rechercher par titre, description, référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background/50"
            />
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_analyse">En analyse</SelectItem>
                <SelectItem value="en_traitement">En traitement</SelectItem>
                <SelectItem value="resolu">Résolu</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

          {/* Liste des remontées enrichies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Remontées ({filteredRemontees.length})
              </h3>
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRemontees.map((remontee) => (
                <RemonteeCardEnriched
                  key={remontee.id}
                  remontee={remontee}
                  onViewDetails={() => setSelectedRemontee(remontee)}
                  selected={selectedIds.includes(remontee.id)}
                  onSelect={(checked) => {
                    if (checked) {
                      setSelectedIds([...selectedIds, remontee.id]);
                    } else {
                      setSelectedIds(selectedIds.filter(id => id !== remontee.id));
                    }
                  }}
                />
              ))}
            </div>
            
            {filteredRemontees.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Aucune remontée ne correspond aux critères de recherche
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez de modifier vos filtres
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Dialog de détails */}
      <Dialog open={!!selectedRemontee} onOpenChange={() => setSelectedRemontee(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la remontée</DialogTitle>
          </DialogHeader>
          {selectedRemontee && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedRemontee.numero_reference}</Badge>
                <Badge variant={getPrioriteColor(selectedRemontee.niveau_priorite)}>
                  {selectedRemontee.niveau_priorite}
                </Badge>
                <Badge variant="outline">{getTypeLabel(selectedRemontee.type_remontee)}</Badge>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{selectedRemontee.titre}</h3>
                <p className="text-sm text-muted-foreground mt-2">{selectedRemontee.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedRemontee.source && (
                  <div>
                    <span className="font-medium">Source:</span> {selectedRemontee.source}
                  </div>
                )}
                {selectedRemontee.localisation && (
                  <div>
                    <span className="font-medium">Localisation:</span> {selectedRemontee.localisation}
                  </div>
                )}
                {selectedRemontee.categorie && (
                  <div>
                    <span className="font-medium">Catégorie:</span> {selectedRemontee.categorie}
                  </div>
                )}
                {selectedRemontee.sentiment && (
                  <div>
                    <span className="font-medium">Sentiment:</span> {selectedRemontee.sentiment}
                  </div>
                )}
                {selectedRemontee.date_incident && (
                  <div>
                    <span className="font-medium">Date incident:</span>{" "}
                    {new Date(selectedRemontee.date_incident).toLocaleDateString()}
                  </div>
                )}
                {selectedRemontee.nb_personnes_concernees && (
                  <div>
                    <span className="font-medium">Personnes concernées:</span>{" "}
                    {selectedRemontee.nb_personnes_concernees}
                  </div>
                )}
              </div>

              {selectedRemontee.impact_estime && (
                <div>
                  <h4 className="font-medium mb-1">Impact estimé</h4>
                  <p className="text-sm">{selectedRemontee.impact_estime}</p>
                </div>
              )}

              {selectedRemontee.url_source && (
                <div>
                  <h4 className="font-medium mb-1">Lien source</h4>
                  <a 
                    href={selectedRemontee.url_source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedRemontee.url_source}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de détails par type */}
      <RemonteeTypeDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        typeId={selectedTypeForDetail}
        typeLabel={getTypeLabel(selectedTypeForDetail)}
        remontees={getRemonteesByType(selectedTypeForDetail)}
      />
    </div>
  );
}
