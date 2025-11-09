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
import { Loader2, Search, Plus, Edit, Trash2, Receipt, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, Printer } from "lucide-react";
import { toast } from "sonner";
import { AddQuittanceDialog } from "./AddQuittanceDialog";
import { ImprimerQuittanceLicenceDialog } from "./ImprimerQuittanceLicenceDialog";
import { GenerateQuittancesDialog } from "./GenerateQuittancesDialog";

export const QuittancesManagement = () => {
  const [quittances, setQuittances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [fenetreFilter, setFenetreFilter] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuittance, setEditingQuittance] = useState<any>(null);
  const [selectedQuittance, setSelectedQuittance] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('quittances')
        .select(`
          *,
          licences(
            numero,
            pirogues(
              nom,
              immatriculation,
              proprietaires(nom, prenom)
            )
          )
        `)
        .order('date_echeance', { ascending: true });

      if (error) throw error;

      // Enrichir les données avec le calcul de la fenêtre de paiement
      const enrichedData = await Promise.all(
        (data || []).map(async (q) => {
          const { data: fenetreData } = await supabase
            .rpc('est_dans_fenetre_paiement', { p_date_echeance: q.date_echeance });
          
          return {
            ...q,
            dans_fenetre_paiement: fenetreData || false,
            jours_restants: Math.ceil((new Date(q.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          };
        })
      );

      setQuittances(enrichedData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette quittance ?")) return;

    try {
      const { error } = await supabase
        .from('quittances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Quittance supprimée avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting quittance:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleValidatePaiement = async (id: string, currentStatut: string) => {
    const newStatut = currentStatut === 'paye' ? 'en_attente' : 'paye';
    
    try {
      const { error } = await supabase
        .from('quittances')
        .update({ 
          statut: newStatut,
          date_paiement: newStatut === 'paye' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(newStatut === 'paye' ? "Paiement validé" : "Validation annulée");
      loadData();
    } catch (error: any) {
      console.error('Error validating paiement:', error);
      toast.error("Erreur lors de la validation");
    }
  };

  const filtered = quittances.filter(q => {
    const matchesSearch = 
      q.licences?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.numero_recu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.licences?.pirogues?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.licences?.pirogues?.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = statutFilter === "all" || q.statut === statutFilter;
    const matchesFenetre = !fenetreFilter || q.dans_fenetre_paiement;

    return matchesSearch && matchesStatut && matchesFenetre;
  });

  const getStatutBadge = (quittance: any) => {
    if (quittance.statut === 'paye') {
      return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Payé</Badge>;
    }
    if (quittance.statut === 'retard') {
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Retard</Badge>;
    }
    if (quittance.dans_fenetre_paiement) {
      return <Badge className="bg-orange-600"><AlertTriangle className="mr-1 h-3 w-3" />À payer (J-5/J+5)</Badge>;
    }
    return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
  };

  const getDateBadge = (quittance: any) => {
    if (quittance.jours_restants < 0) {
      return <span className="text-xs text-destructive font-medium">En retard de {Math.abs(quittance.jours_restants)} jours</span>;
    }
    if (quittance.dans_fenetre_paiement) {
      return <span className="text-xs text-orange-600 font-medium">Dans {quittance.jours_restants} jours</span>;
    }
    return <span className="text-xs text-muted-foreground">Dans {quittance.jours_restants} jours</span>;
  };

  const handleEdit = (quittance: any) => {
    setEditingQuittance(quittance);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingQuittance(null);
  };

  const getMoisLabel = (mois: number) => {
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return moisLabels[mois - 1] || mois;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalMontant = quittances.reduce((sum, q) => sum + (q.montant || 0), 0);
  const montantPaye = quittances.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0);
  const montantEnAttente = quittances.filter(q => q.statut === 'en_attente' || q.statut === 'retard').reduce((sum, q) => sum + (q.montant || 0), 0);
  const dansFenetre = quittances.filter(q => q.dans_fenetre_paiement && q.statut !== 'paye').length;

  return (
    <div className="space-y-6">
      <AddQuittanceDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSuccess={loadData}
        editingQuittance={editingQuittance}
      />

      {selectedQuittance && (
        <ImprimerQuittanceLicenceDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          quittance={selectedQuittance}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gestion des Quittances de Paiement
              </CardTitle>
              <CardDescription>
                Suivi des paiements de licences ({filtered.length} quittances)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Quittance
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par licence, reçu ou pirogue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="paye">Payé</SelectItem>
                  <SelectItem value="retard">Retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={fenetreFilter ? "default" : "outline"}
              onClick={() => setFenetreFilter(!fenetreFilter)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Fenêtre J-5/J+5
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Pirogue</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Reçu N°</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune quittance trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((quittance) => (
                    <TableRow 
                      key={quittance.id}
                      className={quittance.dans_fenetre_paiement && quittance.statut !== 'paye' ? 'bg-orange-50 dark:bg-orange-950/20' : ''}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {getMoisLabel(quittance.mois)} {quittance.annee}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{quittance.licences?.numero}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quittance.licences?.pirogues?.nom}</div>
                          <div className="text-xs text-muted-foreground">
                            {quittance.licences?.pirogues?.immatriculation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(quittance.date_echeance).toLocaleDateString('fr-FR')}
                          </div>
                          {getDateBadge(quittance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">
                          {quittance.montant?.toLocaleString()} FCFA
                        </div>
                        {quittance.date_paiement && (
                          <div className="text-xs text-muted-foreground">
                            Payé le {new Date(quittance.date_paiement).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {quittance.numero_recu || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(quittance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedQuittance(quittance);
                              setShowPrintDialog(true);
                            }}
                            title="Imprimer la quittance"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleValidatePaiement(quittance.id, quittance.statut)}
                            title={quittance.statut === 'paye' ? 'Annuler le paiement' : 'Valider le paiement'}
                          >
                            <CheckCircle className={`h-4 w-4 ${quittance.statut === 'paye' ? 'text-green-600' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(quittance)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(quittance.id)}
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
                <p className="text-sm text-muted-foreground">Total Quittances</p>
                <p className="text-2xl font-bold">{quittances.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant Total</p>
                <p className="text-2xl font-bold">{totalMontant.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant Payé</p>
                <p className="text-2xl font-bold text-green-600">{montantPaye.toLocaleString()} FCFA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quittances.filter(q => q.statut === 'paye').length} quittances
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
                <p className="text-2xl font-bold text-orange-600">{montantEnAttente.toLocaleString()} FCFA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dansFenetre} dans la fenêtre J-5/J+5
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes pour paiements proches */}
      {dansFenetre > 0 && (
        <Card className="border-orange-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Paiements à échéance proche
            </CardTitle>
            <CardDescription>
              {dansFenetre} quittance(s) dans la fenêtre de paiement J-5/J+5
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};