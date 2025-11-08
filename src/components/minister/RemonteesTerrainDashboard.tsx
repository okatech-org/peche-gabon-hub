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
  Eye
} from "lucide-react";
import { SubmitRemonteeDialog } from "./SubmitRemonteeDialog";
import { GenerateSyntheseDialog } from "./GenerateSyntheseDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RemonteeTypeCards } from "./RemonteeTypeCards";

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

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "nouveau": return "bg-blue-500";
      case "en_analyse": return "bg-yellow-500";
      case "en_traitement": return "bg-orange-500";
      case "resolu": return "bg-green-500";
      case "rejete": return "bg-red-500";
      case "archive": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

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

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Remontées Terrain</h2>
          <p className="text-sm text-muted-foreground">
            Gestion des réclamations, suggestions et informations du terrain
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateSyntheseDialog remonteeIds={selectedIds} onSuccess={() => setSelectedIds([])} />
          <SubmitRemonteeDialog />
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveau</p>
                <p className="text-2xl font-bold">{stats.nouveau}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En analyse</p>
                <p className="text-2xl font-bold">{stats.en_analyse}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold">{stats.en_traitement}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résolu</p>
                <p className="text-2xl font-bold">{stats.resolu}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cartes de types de remontées */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtrer par type</h3>
        </div>
        <RemonteeTypeCards 
          selectedType={filterType}
          onTypeSelect={setFilterType}
          typeCounts={stats.par_type}
          newCounts={stats.nouveaux_par_type}
        />
      </div>

      {/* Filtres additionnels */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Rechercher par titre, description, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Liste des remontées */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Remontées ({filteredRemontees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRemontees.map((remontee) => (
              <Card key={remontee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(remontee.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds([...selectedIds, remontee.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== remontee.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex items-start justify-between flex-1">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{remontee.numero_reference}</Badge>
                        <Badge variant={getPrioriteColor(remontee.niveau_priorite)}>
                          {remontee.niveau_priorite}
                        </Badge>
                        <Badge variant="outline">{getTypeLabel(remontee.type_remontee)}</Badge>
                        {remontee.sentiment && (
                          <span className="text-lg">{getSentimentIcon(remontee.sentiment)}</span>
                        )}
                      </div>
                      
                      <h4 className="font-semibold">{remontee.titre}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {remontee.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {remontee.source && <span>Source: {remontee.source}</span>}
                        {remontee.localisation && <span>📍 {remontee.localisation}</span>}
                        {remontee.categorie && <span>🏷️ {remontee.categorie}</span>}
                        <span>{new Date(remontee.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs text-white ${getStatutColor(remontee.statut)}`}>
                        {remontee.statut}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedRemontee(remontee)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredRemontees.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucune remontée ne correspond aux critères de recherche
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
