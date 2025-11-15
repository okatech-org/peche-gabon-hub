import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, CheckCircle, Clock, XCircle } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

interface Licence {
  id: string;
  numero: string;
  statut: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  pirogue_id: string;
  engins_autorises: string[];
  especes_cibles: string[];
  montant_total: number;
  observations?: string | null;
}

export function LicencesManagement() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [filteredLicences, setFilteredLicences] = useState<Licence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  

  useEffect(() => {
    loadLicences();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [licences, searchTerm, filterStatut]);

  const loadLicences = async () => {
    try {
      const { data, error } = await supabase
        .from("licences")
        .select("*")
        .order("date_debut", { ascending: false });

      if (error) throw error;
      setLicences(data || []);
    } catch (error) {
      console.error("Erreur chargement licences:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...licences];

    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.numero?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatut !== "tous") {
      filtered = filtered.filter((l) => l.statut === filterStatut);
    }

    setFilteredLicences(filtered);
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      active: { variant: "default", icon: CheckCircle, label: "Active" },
      en_attente: { variant: "secondary", icon: Clock, label: "En attente" },
      expiree: { variant: "destructive", icon: XCircle, label: "Expirée" },
      suspendue: { variant: "outline", icon: XCircle, label: "Suspendue" },
    };

    const config = variants[statut] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="expiree">Expirée</SelectItem>
            <SelectItem value="suspendue">Suspendue</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-green-600">
            {licences.filter((l) => l.statut === "active").length}
          </div>
          <div className="text-sm text-muted-foreground">Actives</div>
        </div>
        <div className="p-3 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-amber-600">
            {licences.filter((l) => l.statut === "en_attente").length}
          </div>
          <div className="text-sm text-muted-foreground">En attente</div>
        </div>
        <div className="p-3 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-red-600">
            {licences.filter((l) => l.statut === "expiree").length}
          </div>
          <div className="text-sm text-muted-foreground">Expirées</div>
        </div>
        <div className="p-3 border rounded-lg bg-card">
          <div className="text-2xl font-bold text-blue-600">
            {filteredLicences.length}
          </div>
          <div className="text-sm text-muted-foreground">Affichées</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Année</TableHead>
              <TableHead>Date début</TableHead>
              <TableHead>Date fin</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune licence trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredLicences.map((licence) => (
                <TableRow key={licence.id}>
                  <TableCell className="font-medium">
                    {licence.numero}
                  </TableCell>
                  <TableCell>{licence.annee}</TableCell>
                  <TableCell>
                    {new Date(licence.date_debut).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {new Date(licence.date_fin).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>{licence.montant_total.toLocaleString()} FCFA</TableCell>
                  <TableCell>{getStatutBadge(licence.statut)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
