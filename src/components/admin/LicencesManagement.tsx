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
import { Loader2, Search, Plus, Edit, Trash2, FileCheck, Ship, CheckCircle, XCircle, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GenerateQuittancesDialog } from "./GenerateQuittancesDialog";

export const LicencesManagement = () => {
  const [licences, setLicences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [especes, setEspeces] = useState<any[]>([]);
  const [engins, setEngins] = useState<any[]>([]);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [licencesResult, especesResult, enginsResult] = await Promise.all([
        supabase
          .from('licences')
          .select(`
            *,
            pirogues(
              nom,
              immatriculation,
              proprietaires(nom, prenom)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('especes').select('id, nom, nom_scientifique').order('nom'),
        supabase.from('engins').select('id, nom').order('nom'),
      ]);

      if (licencesResult.error) throw licencesResult.error;
      if (especesResult.error) throw especesResult.error;
      if (enginsResult.error) throw enginsResult.error;

      setLicences(licencesResult.data || []);
      setEspeces(especesResult.data || []);
      setEngins(enginsResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette licence ?")) return;

    try {
      const { error } = await supabase
        .from('licences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Licence supprimée avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting licence:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleValidate = async (id: string, currentStatut: string) => {
    const newStatut = currentStatut === 'validee' ? 'en_attente' : 'validee';
    
    try {
      const { error: updateError } = await supabase
        .from('licences')
        .update({ 
          statut: newStatut,
          valide_le: newStatut === 'validee' ? new Date().toISOString() : null,
          valide_par: newStatut === 'validee' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Si la licence vient d'être validée, ouvrir le dialogue de génération
      if (newStatut === 'validee') {
        const licence = licences.find(l => l.id === id);
        setSelectedLicence(licence);
        setGenerateDialogOpen(true);
      }

      toast.success(newStatut === 'validee' ? "Licence validée" : "Validation annulée");
      loadData();
    } catch (error: any) {
      console.error('Error validating licence:', error);
      toast.error("Erreur lors de la validation");
    }
  };

  const getEspeceNom = (especeId: string) => {
    const espece = especes.find(e => e.id === especeId);
    return espece?.nom || especeId;
  };

  const getEnginNom = (enginId: string) => {
    const engin = engins.find(e => e.id === enginId);
    return engin?.nom || enginId;
  };

  const filtered = licences.filter(l => {
    const matchesSearch = 
      l.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.pirogues?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.pirogues?.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = statutFilter === "all" || l.statut === statutFilter;

    return matchesSearch && matchesStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case 'validee':
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Validée</Badge>;
      case 'refusee':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Refusée</Badge>;
      case 'expiree':
        return <Badge variant="secondary">Expirée</Badge>;
      default:
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenerateQuittancesDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        licence={selectedLicence}
        onSuccess={loadData}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Gestion des Licences de Pêche
              </CardTitle>
              <CardDescription>
                Licences artisanales ({filtered.length} licences)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => toast.info("Formulaire en développement")}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Licence
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, pirogue ou immatriculation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-64">
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="refusee">Refusée</SelectItem>
                  <SelectItem value="expiree">Expirée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Pirogue</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Espèces Cibles</TableHead>
                  <TableHead>Engins Autorisés</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune licence trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((licence) => (
                    <TableRow key={licence.id}>
                      <TableCell>
                        <div className="font-medium">{licence.numero}</div>
                        <div className="text-xs text-muted-foreground">
                          Année {licence.annee}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Ship className="h-3 w-3" />
                          <div>
                            <div className="font-medium">{licence.pirogues?.nom}</div>
                            <div className="text-xs text-muted-foreground">
                              {licence.pirogues?.immatriculation}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(licence.date_debut).toLocaleDateString('fr-FR')}</div>
                          <div className="text-muted-foreground">
                            → {new Date(licence.date_fin).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {licence.especes_cibles?.slice(0, 3).map((especeId: string) => (
                            <Badge key={especeId} variant="outline" className="text-xs">
                              {getEspeceNom(especeId)}
                            </Badge>
                          ))}
                          {licence.especes_cibles?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{licence.especes_cibles.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {licence.engins_autorises?.slice(0, 2).map((enginId: string) => (
                            <Badge key={enginId} variant="secondary" className="text-xs">
                              {getEnginNom(enginId)}
                            </Badge>
                          ))}
                          {licence.engins_autorises?.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{licence.engins_autorises.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{licence.montant_total?.toLocaleString()} FCFA</div>
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(licence.statut)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleValidate(licence.id, licence.statut)}
                            title={licence.statut === 'validee' ? 'Annuler la validation' : 'Valider et générer les quittances'}
                            className={licence.statut !== 'validee' ? 'text-green-600 hover:text-green-700' : ''}
                          >
                            {licence.statut !== 'validee' && <Sparkles className="mr-1 h-3 w-3" />}
                            <CheckCircle className="h-4 w-4" />
                          </Button>
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
                            onClick={() => handleDelete(licence.id)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Licences</p>
                <p className="text-2xl font-bold">{licences.length}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-green-600">
                  {licences.filter(l => l.statut === 'validee').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {licences.filter(l => l.statut === 'en_attente').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refusées / Expirées</p>
                <p className="text-2xl font-bold">
                  {licences.filter(l => l.statut === 'refusee' || l.statut === 'expiree').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};