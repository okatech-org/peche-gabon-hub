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
import { Loader2, Search, Plus, Edit, Trash2, Ship, Upload, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const PiroguesManagement = () => {
  const [pirogues, setPirogues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [coopFilter, setCoopFilter] = useState<string>("all");
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [piroguesResult, coopsResult] = await Promise.all([
        supabase
          .from('pirogues')
          .select(`
            *,
            proprietaires(nom, prenom, nationalite),
            cooperatives(nom),
            sites(nom)
          `)
          .order('nom'),
        supabase.from('cooperatives').select('id, nom').order('nom'),
      ]);

      if (piroguesResult.error) throw piroguesResult.error;
      if (coopsResult.error) throw coopsResult.error;

      setPirogues(piroguesResult.data || []);
      setCooperatives(coopsResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette pirogue ?")) return;

    try {
      const { error } = await supabase
        .from('pirogues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Pirogue supprimée avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting pirogue:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filtered = pirogues.filter(p => {
    const matchesSearch = 
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proprietaires?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proprietaires?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCoop = coopFilter === "all" || p.cooperative_id === coopFilter;

    return matchesSearch && matchesCoop;
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
                <Ship className="h-5 w-5" />
                Gestion de la Flotte Artisanale
              </CardTitle>
              <CardDescription>
                Pirogues immatriculées ({filtered.length} pirogues)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button onClick={() => toast.info("Formulaire en développement")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Pirogue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, immatriculation ou propriétaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-64">
              <Select value={coopFilter} onValueChange={setCoopFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Coopérative" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes coopératives</SelectItem>
                  {cooperatives.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
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
                  <TableHead>Nom / Immatriculation</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Coopérative</TableHead>
                  <TableHead>Site d'attache</TableHead>
                  <TableHead>Caractéristiques</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune pirogue trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((pirogue) => (
                    <TableRow key={pirogue.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pirogue.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {pirogue.immatriculation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {pirogue.proprietaires?.prenom} {pirogue.proprietaires?.nom}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pirogue.proprietaires?.nationalite}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pirogue.cooperatives?.nom ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {pirogue.cooperatives.nom}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{pirogue.sites?.nom || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {pirogue.materiau && <div>Matériau: {pirogue.materiau}</div>}
                          {pirogue.puissance_cv && <div>Moteur: {pirogue.puissance_cv} CV</div>}
                          {pirogue.nb_pecheurs && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {pirogue.nb_pecheurs} pêcheurs
                            </div>
                          )}
                          {pirogue.annee_construction && (
                            <div className="text-muted-foreground">
                              Année: {pirogue.annee_construction}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pirogue.statut === 'active' ? 'default' : 'secondary'}>
                          {pirogue.statut === 'active' ? 'Active' : 'Inactive'}
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
                            onClick={() => handleDelete(pirogue.id)}
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
                <p className="text-sm text-muted-foreground">Total Pirogues</p>
                <p className="text-2xl font-bold">{pirogues.length}</p>
              </div>
              <Ship className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pirogues Actives</p>
                <p className="text-2xl font-bold">
                  {pirogues.filter(p => p.statut === 'active').length}
                </p>
              </div>
              <Ship className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coopératives</p>
                <p className="text-2xl font-bold">{cooperatives.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
