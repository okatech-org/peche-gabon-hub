import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, History, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AddEditBaremeDialog } from "./AddEditBaremeDialog";
import { HistoriqueBaremeDialog } from "./HistoriqueBaremeDialog";

interface BaremeTaxe {
  id: string;
  nom: string;
  type_taxe: string;
  description: string | null;
  date_debut: string;
  date_fin: string | null;
  montant_fixe_kg: number | null;
  taux_pourcentage: number | null;
  seuil_min_kg: number | null;
  seuil_max_kg: number | null;
  espece_id: string | null;
  actif: boolean;
  created_at: string;
  espece?: {
    nom: string;
    code: string;
  } | null;
}

export function BaremesTaxesManagement() {
  const [loading, setLoading] = useState(true);
  const [baremes, setBaremes] = useState<BaremeTaxe[]>([]);
  const [especes, setEspeces] = useState<Array<{ id: string; nom: string; code: string }>>([]);
  const [filteredBaremes, setFilteredBaremes] = useState<BaremeTaxe[]>([]);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterEspece, setFilterEspece] = useState<string>("all");
  
  // Dialogs
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedBareme, setSelectedBareme] = useState<BaremeTaxe | null>(null);
  const [historiqueDialogOpen, setHistoriqueDialogOpen] = useState(false);
  const [selectedBaremeForHistory, setSelectedBaremeForHistory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [baremes, searchTerm, filterType, filterStatut, filterEspece]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les barèmes
      const { data: baremesData, error: baremesError } = await supabase
        .from("bareme_taxes")
        .select(`
          *,
          espece:especes(nom, code)
        `)
        .order("created_at", { ascending: false });

      if (baremesError) throw baremesError;
      
      // Charger les espèces pour les filtres
      const { data: especesData, error: especesError } = await supabase
        .from("especes")
        .select("id, nom, code")
        .order("nom");

      if (especesError) throw especesError;

      setBaremes(baremesData || []);
      setEspeces(especesData || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des barèmes");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...baremes];

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.espece?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (filterType !== "all") {
      filtered = filtered.filter((b) => b.type_taxe === filterType);
    }

    // Filtre par statut
    if (filterStatut !== "all") {
      filtered = filtered.filter((b) => 
        filterStatut === "actif" ? b.actif : !b.actif
      );
    }

    // Filtre par espèce
    if (filterEspece !== "all") {
      filtered = filtered.filter((b) => b.espece_id === filterEspece);
    }

    setFilteredBaremes(filtered);
  };

  const handleToggleActif = async (bareme: BaremeTaxe) => {
    try {
      const { error } = await supabase
        .from("bareme_taxes")
        .update({ actif: !bareme.actif })
        .eq("id", bareme.id);

      if (error) throw error;
      
      toast.success(`Barème ${!bareme.actif ? "activé" : "désactivé"}`);
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleEdit = (bareme: BaremeTaxe) => {
    setSelectedBareme(bareme);
    setAddEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedBareme(null);
    setAddEditDialogOpen(true);
  };

  const handleShowHistory = (baremeId: string) => {
    setSelectedBaremeForHistory(baremeId);
    setHistoriqueDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Barèmes de Taxes</CardTitle>
              <CardDescription>
                Gérer les barèmes de taxes sur les captures
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau barème
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type de taxe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="capture">Capture</SelectItem>
                <SelectItem value="licence">Licence</SelectItem>
                <SelectItem value="autorisation">Autorisation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEspece} onValueChange={setFilterEspece}>
              <SelectTrigger>
                <SelectValue placeholder="Espèce" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les espèces</SelectItem>
                {especes.map((espece) => (
                  <SelectItem key={espece.id} value={espece.id}>
                    {espece.nom} ({espece.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des barèmes */}
          {filteredBaremes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Aucun barème trouvé
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Espèce</TableHead>
                    <TableHead>Montant/Taux</TableHead>
                    <TableHead>Seuils (kg)</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBaremes.map((bareme) => (
                    <TableRow key={bareme.id}>
                      <TableCell className="font-medium">{bareme.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bareme.type_taxe}</Badge>
                      </TableCell>
                      <TableCell>
                        {bareme.espece ? (
                          <span className="text-sm">
                            {bareme.espece.nom}
                            <span className="text-muted-foreground ml-1">
                              ({bareme.espece.code})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Toutes espèces
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bareme.montant_fixe_kg ? (
                          <span>{bareme.montant_fixe_kg} FCFA/kg</span>
                        ) : bareme.taux_pourcentage ? (
                          <span>{bareme.taux_pourcentage}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {bareme.seuil_min_kg || bareme.seuil_max_kg ? (
                          <span>
                            {bareme.seuil_min_kg || "0"} - {bareme.seuil_max_kg || "∞"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(bareme.date_debut), "dd/MM/yyyy", { locale: fr })}
                        {bareme.date_fin && (
                          <span> - {format(new Date(bareme.date_fin), "dd/MM/yyyy", { locale: fr })}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bareme.actif ? "default" : "secondary"}>
                          {bareme.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(bareme)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowHistory(bareme.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={bareme.actif ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleToggleActif(bareme)}
                          >
                            {bareme.actif ? "Désactiver" : "Activer"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEditBaremeDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        bareme={selectedBareme}
        especes={especes}
        onSuccess={loadData}
      />

      <HistoriqueBaremeDialog
        open={historiqueDialogOpen}
        onOpenChange={setHistoriqueDialogOpen}
        baremeId={selectedBaremeForHistory}
      />
    </div>
  );
}
