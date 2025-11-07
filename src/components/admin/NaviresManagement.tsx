import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Search, Plus, Edit, Trash2, Anchor as ShipIcon, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const NaviresManagement = () => {
  const [navires, setNavires] = useState<any[]>([]);
  const [armements, setArmements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [armementFilter, setArmementFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [naviresResult, armementsResult] = await Promise.all([
        supabase
          .from('navires')
          .select(`
            *,
            armements(nom)
          `)
          .order('nom'),
        supabase.from('armements').select('id, nom').order('nom'),
      ]);

      if (naviresResult.error) throw naviresResult.error;
      if (armementsResult.error) throw armementsResult.error;

      setNavires(naviresResult.data || []);
      setArmements(armementsResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce navire ?")) return;

    try {
      const { error } = await supabase
        .from('navires')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Navire supprimé avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting navire:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filtered = navires.filter(n => {
    const matchesSearch = 
      n.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.capitaine?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArmement = armementFilter === "all" || n.armement_id === armementFilter;

    return matchesSearch && matchesArmement;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShipIcon className="h-5 w-5" />
                Gestion de la Flotte Industrielle
              </CardTitle>
              <CardDescription>
                Navires de pêche industrielle ({filtered.length} navires)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button onClick={() => toast.info("Formulaire en développement")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Navire
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, matricule ou capitaine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-64">
              <Select value={armementFilter} onValueChange={setArmementFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Armement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous armements</SelectItem>
                  {armements.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom / Matricule</TableHead>
                  <TableHead>Armement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Port d'attache</TableHead>
                  <TableHead>Caractéristiques</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun navire trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((navire) => (
                    <TableRow key={navire.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{navire.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {navire.matricule}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {navire.armements?.nom || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{navire.type_navire || 'Non spécifié'}</Badge>
                      </TableCell>
                      <TableCell>{navire.port_attache || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {navire.jauge_brute && <div>TJB: {navire.jauge_brute}</div>}
                          {navire.puissance_moteur_kw && (
                            <div>Puissance: {navire.puissance_moteur_kw} kW</div>
                          )}
                          {navire.annee_construction && (
                            <div className="text-muted-foreground">
                              Année: {navire.annee_construction}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={navire.statut === 'active' ? 'default' : 'secondary'}>
                          {navire.statut === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toast.info("Modification en développement")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(navire.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Navires</p>
                <p className="text-2xl font-bold">{navires.length}</p>
              </div>
              <ShipIcon className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Navires Actifs</p>
                <p className="text-2xl font-bold">
                  {navires.filter(n => n.statut === 'active').length}
                </p>
              </div>
              <ShipIcon className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Armements</p>
                <p className="text-2xl font-bold">{armements.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
