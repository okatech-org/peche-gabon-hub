import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  AlertTriangle,
  FileText,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import * as XLSX from "xlsx";

interface Infraction {
  id: string;
  date_controle: string;
  type_infraction: string | null;
  categorie_infraction: string | null;
  sanctions: string | null;
  observations: string | null;
  pirogue_id: string | null;
  navire_id: string | null;
  mission_id: string | null;
  pirogues?: {
    immatriculation: string;
    nom: string;
  };
  navires_industriels?: {
    nom: string;
    immatriculation: string;
  };
}

const CATEGORIES = [
  "Licence invalide",
  "Engins interdits",
  "Zone interdite",
  "Espèce protégée",
  "Dépassement quota",
  "Document manquant",
  "Non-conformité sanitaire",
  "Autre",
];

const TYPES = [
  "Mineure",
  "Modérée",
  "Grave",
  "Très grave",
];

export default function Infractions() {
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("tous");
  const [filterType, setFilterType] = useState("tous");
  const [selectedInfraction, setSelectedInfraction] = useState<Infraction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type_infraction: "",
    categorie_infraction: "",
    sanctions: "",
    observations: "",
  });

  useEffect(() => {
    loadInfractions();
  }, []);

  const loadInfractions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("controles_surveillance")
        .select(`
          *,
          pirogues (immatriculation, nom),
          navires_industriels (nom, immatriculation)
        `)
        .eq("infraction", true)
        .order("date_controle", { ascending: false });

      if (error) throw error;
      setInfractions(data || []);
    } catch (error: any) {
      toast.error("Erreur de chargement", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInfraction = async () => {
    if (!formData.type_infraction || !formData.categorie_infraction) {
      toast.error("Validation", "Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      const { error } = await supabase.from("controles_surveillance").insert({
        date_controle: new Date().toISOString(),
        infraction: true,
        type_infraction: formData.type_infraction,
        categorie_infraction: formData.categorie_infraction,
        sanctions: formData.sanctions,
        observations: formData.observations,
      });

      if (error) throw error;

      toast.success("Infraction ajoutée");
      setShowAddDialog(false);
      setFormData({
        type_infraction: "",
        categorie_infraction: "",
        sanctions: "",
        observations: "",
      });
      loadInfractions();
    } catch (error: any) {
      toast.error("Erreur", error.message);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredInfractions.map((inf) => ({
      Date: format(new Date(inf.date_controle), "dd/MM/yyyy HH:mm", { locale: fr }),
      Catégorie: inf.categorie_infraction || "N/A",
      Type: inf.type_infraction || "N/A",
      Cible: inf.pirogues?.nom || inf.navires_industriels?.nom || "N/A",
      Immatriculation:
        inf.pirogues?.immatriculation || inf.navires_industriels?.immatriculation || "N/A",
      Sanctions: inf.sanctions || "Aucune",
      Observations: inf.observations || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Infractions");
    XLSX.writeFile(wb, `infractions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Export réussi");
  };

  const getSeverityBadge = (type: string | null) => {
    if (!type) return <Badge variant="secondary">N/A</Badge>;
    switch (type) {
      case "Très grave":
        return <Badge variant="destructive">{type}</Badge>;
      case "Grave":
        return <Badge className="bg-orange-500">{type}</Badge>;
      case "Modérée":
        return <Badge className="bg-yellow-500">{type}</Badge>;
      case "Mineure":
        return <Badge variant="outline">{type}</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const filteredInfractions = infractions.filter((inf) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      inf.categorie_infraction?.toLowerCase().includes(searchLower) ||
      inf.type_infraction?.toLowerCase().includes(searchLower) ||
      inf.pirogues?.nom?.toLowerCase().includes(searchLower) ||
      inf.navires_industriels?.nom?.toLowerCase().includes(searchLower);

    const matchCategorie =
      filterCategorie === "tous" || inf.categorie_infraction === filterCategorie;
    const matchType = filterType === "tous" || inf.type_infraction === filterType;

    return matchSearch && matchCategorie && matchType;
  });

  // Stats
  const stats = {
    total: infractions.length,
    tresGrave: infractions.filter((i) => i.type_infraction === "Très grave").length,
    grave: infractions.filter((i) => i.type_infraction === "Grave").length,
    avereSanction: infractions.filter((i) => i.sanctions && i.sanctions.length > 0).length,
  };

  if (loading) {
    return <TableSkeleton rows={10} columns={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Infractions</h1>
          <p className="text-muted-foreground">
            Suivi et traitement des infractions constatées
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Infraction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Très graves</p>
                <p className="text-2xl font-bold text-destructive">{stats.tresGrave}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Graves</p>
                <p className="text-2xl font-bold text-orange-500">{stats.grave}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avec sanction</p>
                <p className="text-2xl font-bold text-green-500">{stats.avereSanction}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une infraction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterCategorie} onValueChange={setFilterCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes catégories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Gravité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes gravités</SelectItem>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Sanctions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInfractions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune infraction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInfractions.map((inf) => (
                  <TableRow key={inf.id}>
                    <TableCell>
                      {format(new Date(inf.date_controle), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{inf.categorie_infraction || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{getSeverityBadge(inf.type_infraction)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {inf.pirogues?.nom || inf.navires_industriels?.nom || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {inf.pirogues?.immatriculation ||
                            inf.navires_industriels?.immatriculation ||
                            ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inf.sanctions ? (
                        <span className="text-sm">{inf.sanctions.substring(0, 30)}...</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInfraction(inf);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'infraction</DialogTitle>
          </DialogHeader>

          {selectedInfraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedInfraction.date_controle), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gravité</Label>
                  <div className="mt-1">{getSeverityBadge(selectedInfraction.type_infraction)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Catégorie</Label>
                <p className="font-medium">{selectedInfraction.categorie_infraction || "N/A"}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Cible</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Nom:</span>
                        <p className="font-medium">
                          {selectedInfraction.pirogues?.nom ||
                            selectedInfraction.navires_industriels?.nom ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Immatriculation:</span>
                        <p className="font-medium">
                          {selectedInfraction.pirogues?.immatriculation ||
                            selectedInfraction.navires_industriels?.immatriculation ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedInfraction.sanctions && (
                <div>
                  <Label className="text-muted-foreground">Sanctions appliquées</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedInfraction.sanctions}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedInfraction.observations && (
                <div>
                  <Label className="text-muted-foreground">Observations</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedInfraction.observations}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrer une nouvelle infraction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.categorie_infraction}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categorie_infraction: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Gravité <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type_infraction}
                  onValueChange={(value) => setFormData({ ...formData, type_infraction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Sanctions appliquées</Label>
              <Textarea
                placeholder="Décrire les sanctions appliquées..."
                value={formData.sanctions}
                onChange={(e) => setFormData({ ...formData, sanctions: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Observations</Label>
              <Textarea
                placeholder="Observations complémentaires..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddInfraction}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
