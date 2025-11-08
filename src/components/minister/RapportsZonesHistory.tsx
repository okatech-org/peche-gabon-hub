import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Trash2, Eye, Clock, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Rapport {
  id: string;
  created_at: string;
  titre: string;
  statistiques: any;
  recommandations_ia: string;
  fichier_path: string;
  metadata: any;
  tags: string[];
  region: string | null;
  categorie_id: string | null;
  categories_rapports?: {
    nom: string;
    couleur: string;
    icone: string;
  };
}

interface Categorie {
  id: string;
  nom: string;
  description: string;
  couleur: string;
  icone: string;
}

interface RapportsZonesHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RapportsZonesHistory = ({ open, onOpenChange }: RapportsZonesHistoryProps) => {
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [filteredRapports, setFilteredRapports] = useState<Rapport[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Filtres
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (open) {
      loadRapports();
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [rapports, filterCategorie, filterRegion, filterTag]);

  const loadRapports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rapports_zones")
        .select(`
          *,
          categories_rapports (
            nom,
            couleur,
            icone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRapports(data || []);
    } catch (error) {
      console.error("Error loading rapports:", error);
      toast.error("Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories_rapports")
        .select("*")
        .order("nom");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...rapports];

    // Filtre par catégorie
    if (filterCategorie !== "all") {
      filtered = filtered.filter((r) => r.categorie_id === filterCategorie);
    }

    // Filtre par région
    if (filterRegion !== "all") {
      filtered = filtered.filter((r) => r.region === filterRegion);
    }

    // Filtre par tag
    if (filterTag) {
      filtered = filtered.filter((r) =>
        r.tags.some((tag) => tag.toLowerCase().includes(filterTag.toLowerCase()))
      );
    }

    setFilteredRapports(filtered);
  };

  const clearFilters = () => {
    setFilterCategorie("all");
    setFilterRegion("all");
    setFilterTag("");
  };

  const uniqueRegions = Array.from(new Set(rapports.map((r) => r.region).filter(Boolean)));

  const downloadRapport = async (rapport: Rapport) => {
    setDownloading(rapport.id);
    try {
      const { data, error } = await supabase.storage
        .from("rapports-zones")
        .download(rapport.fichier_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${rapport.titre}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Rapport téléchargé");
    } catch (error) {
      console.error("Error downloading rapport:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const deleteRapport = async (rapport: Rapport) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) return;

    setDeleting(rapport.id);
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from("rapports-zones")
        .remove([rapport.fichier_path]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from("rapports_zones")
        .delete()
        .eq("id", rapport.id);

      if (dbError) throw dbError;

      setRapports((prev) => prev.filter((r) => r.id !== rapport.id));
      toast.success("Rapport supprimé");
    } catch (error) {
      console.error("Error deleting rapport:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const viewDetails = (rapport: Rapport) => {
    setSelectedRapport(rapport);
    setShowDetails(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Historique des Rapports d'Analyse
                </DialogTitle>
                <DialogDescription>
                  Consultez et téléchargez vos rapports précédemment générés
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {(filterCategorie !== "all" || filterRegion !== "all" || filterTag) && (
                  <Badge variant="secondary" className="ml-1">
                    {[
                      filterCategorie !== "all" ? 1 : 0,
                      filterRegion !== "all" ? 1 : 0,
                      filterTag ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </DialogHeader>

          {/* Section des filtres */}
          {showFilters && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filtres</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icone} {cat.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Région</label>
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {uniqueRegions.map((region) => (
                        <SelectItem key={region} value={region!}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag</label>
                  <Input
                    placeholder="Rechercher par tag..."
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRapports.length === 0 ? (
            rapports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun rapport généré pour le moment</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Dessinez une zone sur la carte et générez un rapport pour commencer
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun rapport ne correspond aux filtres</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Effacer les filtres
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {filteredRapports.map((rapport) => (
                <Card key={rapport.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{rapport.titre}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            {format(new Date(rapport.created_at), "PPP à HH:mm", { locale: fr })}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDetails(rapport)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadRapport(rapport)}
                          disabled={downloading === rapport.id}
                        >
                          {downloading === rapport.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRapport(rapport)}
                          disabled={deleting === rapport.id}
                        >
                          {deleting === rapport.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rapport.categories_rapports && (
                        <Badge
                          style={{
                            backgroundColor: rapport.categories_rapports.couleur + "20",
                            color: rapport.categories_rapports.couleur,
                            borderColor: rapport.categories_rapports.couleur,
                          }}
                          className="border"
                        >
                          {rapport.categories_rapports.icone} {rapport.categories_rapports.nom}
                        </Badge>
                      )}
                      {rapport.region && (
                        <Badge variant="outline">📍 {rapport.region}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {(rapport.statistiques.totalCaptures / 1000).toFixed(2)}T captures
                      </Badge>
                      <Badge variant="secondary">
                        {rapport.statistiques.nombreSites} sites
                      </Badge>
                      <Badge variant="secondary">
                        CPUE: {rapport.statistiques.moyenneCPUE}
                      </Badge>
                    </div>
                    {rapport.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {rapport.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog des détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRapport?.titre}</DialogTitle>
            <DialogDescription>
              Généré le {selectedRapport && format(new Date(selectedRapport.created_at), "PPP à HH:mm", { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {selectedRapport && (
            <div className="space-y-6">
              {/* Statistiques */}
              <div>
                <h3 className="font-semibold mb-3">Statistiques Clés</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Total Captures</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {(selectedRapport.statistiques.totalCaptures / 1000).toFixed(2)}T
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Sites</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{selectedRapport.statistiques.nombreSites}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">CPUE Moyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{selectedRapport.statistiques.moyenneCPUE}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Provinces</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedRapport.statistiques.capturesParProvince?.length || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recommandations IA */}
              {selectedRapport.recommandations_ia && (
                <div>
                  <h3 className="font-semibold mb-3">Recommandations IA</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedRapport.recommandations_ia}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Fermer
                </Button>
                <Button onClick={() => downloadRapport(selectedRapport)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RapportsZonesHistory;
