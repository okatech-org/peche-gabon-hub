import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Inspection {
  id: string;
  numero: string;
  type: string;
  cible: string;
  site: string;
  date: string;
  statut: "en_cours" | "terminee" | "conforme" | "non_conforme";
  observations?: string;
}

export default function Inspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [filterType, setFilterType] = useState<string>("tous");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Formulaire nouvelle inspection
  const [formData, setFormData] = useState({
    type: "",
    cible: "",
    site: "",
    observations: "",
  });

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    filterInspections();
  }, [inspections, searchTerm, filterStatut, filterType]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      
      // Données simulées pour démonstration
      const mockInspections: Inspection[] = [
        {
          id: "1",
          numero: "INS-2025-001",
          type: "Debarquement",
          cible: "Pirogue PA-1234",
          site: "Port Gentil",
          date: "2025-01-09",
          statut: "terminee",
          observations: "Inspection de routine - Conforme",
        },
        {
          id: "2",
          numero: "INS-2025-002",
          type: "Licence",
          cible: "Navire NI-5678",
          site: "Libreville",
          date: "2025-01-09",
          statut: "en_cours",
          observations: "Vérification documents en cours",
        },
        {
          id: "3",
          numero: "INS-2025-003",
          type: "Sanitaire",
          cible: "Site Cap Esterias",
          site: "Cap Esterias",
          date: "2025-01-08",
          statut: "non_conforme",
          observations: "Non-conformité détectée - Conditions sanitaires",
        },
        {
          id: "4",
          numero: "INS-2025-004",
          type: "Engins",
          cible: "Pirogue PA-2890",
          site: "Mayumba",
          date: "2025-01-08",
          statut: "conforme",
          observations: "Mailles réglementaires - RAS",
        },
        {
          id: "5",
          numero: "INS-2025-005",
          type: "Debarquement",
          cible: "Pirogue PA-3456",
          site: "Cocobeach",
          date: "2025-01-07",
          statut: "terminee",
          observations: "Captures conformes aux quotas",
        },
      ];

      setInspections(mockInspections);
    } catch (error) {
      console.error("Erreur lors du chargement des inspections:", error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const filterInspections = () => {
    let filtered = [...inspections];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (insp) =>
          insp.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insp.cible.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insp.site.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatut !== "tous") {
      filtered = filtered.filter((insp) => insp.statut === filterStatut);
    }

    // Filtre par type
    if (filterType !== "tous") {
      filtered = filtered.filter((insp) => insp.type === filterType);
    }

    setFilteredInspections(filtered);
  };

  const handleCreateInspection = async () => {
    try {
      if (!formData.type || !formData.cible || !formData.site) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // TODO: Créer l'inspection dans la base de données
      const newInspection: Inspection = {
        id: Date.now().toString(),
        numero: `INS-2025-${String(inspections.length + 1).padStart(3, "0")}`,
        type: formData.type,
        cible: formData.cible,
        site: formData.site,
        date: new Date().toISOString().split("T")[0],
        statut: "en_cours",
        observations: formData.observations,
      };

      setInspections([newInspection, ...inspections]);
      setShowNewDialog(false);
      setFormData({ type: "", cible: "", site: "", observations: "" });
      toast.success("Inspection créée avec succès");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case "terminee":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminée
          </Badge>
        );
      case "conforme":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conforme
          </Badge>
        );
      case "non_conforme":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Non conforme
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return <ClipboardList className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Inspections</h1>
          <p className="text-sm text-muted-foreground">
            Gérez et suivez vos inspections
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle inspection
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre statut */}
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="Debarquement">Débarquement</SelectItem>
                <SelectItem value="Licence">Licence</SelectItem>
                <SelectItem value="Sanitaire">Sanitaire</SelectItem>
                <SelectItem value="Engins">Engins</SelectItem>
                <SelectItem value="Captures">Captures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des inspections */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Chargement...
            </CardContent>
          </Card>
        ) : filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune inspection trouvée
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map((inspection) => (
            <Card
              key={inspection.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedInspection(inspection);
                setShowDetailDialog(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                    {getTypeIcon(inspection.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {inspection.numero}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {inspection.type} • {inspection.cible}
                        </p>
                      </div>
                      {getStatutBadge(inspection.statut)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inspection.site}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(inspection.date).toLocaleDateString("fr-FR")}
                      </div>
                    </div>

                    {inspection.observations && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {inspection.observations}
                      </p>
                    )}
                  </div>

                  {/* Bouton voir */}
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog nouvelle inspection */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle inspection</DialogTitle>
            <DialogDescription>
              Créez une nouvelle inspection en remplissant les informations ci-dessous
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type d'inspection *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Debarquement">Débarquement</SelectItem>
                  <SelectItem value="Licence">Licence</SelectItem>
                  <SelectItem value="Sanitaire">Sanitaire</SelectItem>
                  <SelectItem value="Engins">Engins de pêche</SelectItem>
                  <SelectItem value="Captures">Captures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cible">Cible de l'inspection *</Label>
              <Input
                id="cible"
                placeholder="Ex: Pirogue PA-1234 ou Navire NI-5678"
                value={formData.cible}
                onChange={(e) =>
                  setFormData({ ...formData, cible: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site/Lieu *</Label>
              <Input
                id="site"
                placeholder="Ex: Port Gentil, Libreville..."
                value={formData.site}
                onChange={(e) =>
                  setFormData({ ...formData, site: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                placeholder="Observations initiales..."
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateInspection}>
              <Plus className="h-4 w-4 mr-2" />
              Créer l'inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog détail inspection */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedInspection?.numero}</DialogTitle>
            <DialogDescription>Détails de l'inspection</DialogDescription>
          </DialogHeader>

          {selectedInspection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{selectedInspection.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  {getStatutBadge(selectedInspection.statut)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cible</p>
                  <p className="text-sm font-medium">{selectedInspection.cible}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="text-sm font-medium">{selectedInspection.site}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedInspection.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {selectedInspection.observations && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Observations</p>
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    {selectedInspection.observations}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Modifier
                </Button>
                <Button className="flex-1">
                  Générer rapport
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
