import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Download, Edit, Trash2, Plus, Play } from "lucide-react";
import { exportToExcel, prepareExportData } from "@/lib/excelExport";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ScheduledExport {
  id: string;
  nom: string;
  type_export: 'full' | 'summary' | 'raw' | 'custom';
  frequence: 'daily' | 'weekly' | 'monthly';
  jour_semaine?: number;
  jour_mois?: number;
  heure_execution: string;
  actif: boolean;
  dernier_export_at?: string;
  prochain_export_at?: string;
  created_at: string;
}

interface ExportHistory {
  id: string;
  nom_fichier: string;
  type_export: string;
  statut: 'success' | 'failed' | 'pending';
  taille_kb?: number;
  nombre_lignes?: number;
  genere_at: string;
}

export const ScheduledExportsManagement = ({ financialData }: { financialData?: any }) => {
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledExport | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    nom: string;
    type_export: 'full' | 'summary' | 'raw' | 'custom';
    frequence: 'daily' | 'weekly' | 'monthly';
    jour_semaine: number;
    jour_mois: number;
    heure_execution: string;
  }>({
    nom: "",
    type_export: "full",
    frequence: "monthly",
    jour_semaine: 1,
    jour_mois: 1,
    heure_execution: "09:00",
  });

  useEffect(() => {
    loadSchedules();
    loadHistory();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("exports_planifies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSchedules((data || []) as ScheduledExport[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les planifications",
        variant: "destructive",
      });
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("exports_historique")
        .select("*")
        .order("genere_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory((data || []) as ExportHistory[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const scheduleData = {
        ...formData,
        jour_semaine: formData.frequence === 'weekly' ? formData.jour_semaine : null,
        jour_mois: formData.frequence === 'monthly' ? formData.jour_mois : null,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from("exports_planifies")
          .update(scheduleData)
          .eq("id", editingSchedule.id);

        if (error) throw error;
        toast({ title: "Planification mise à jour" });
      } else {
        const { error } = await supabase
          .from("exports_planifies")
          .insert([scheduleData]);

        if (error) throw error;
        toast({ title: "Planification créée" });
      }

      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (schedule: ScheduledExport) => {
    try {
      const { error } = await supabase
        .from("exports_planifies")
        .update({ actif: !schedule.actif })
        .eq("id", schedule.id);

      if (error) throw error;
      loadSchedules();
      toast({
        title: schedule.actif ? "Planification désactivée" : "Planification activée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette planification ?")) return;

    try {
      const { error } = await supabase
        .from("exports_planifies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadSchedules();
      toast({ title: "Planification supprimée" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGenerateNow = async (schedule: ScheduledExport) => {
    try {
      setLoading(true);

      const exportData = prepareExportData(
        financialData?.kpis || {},
        financialData?.monthlyData || [],
        financialData?.previsionsData || []
      );

      const fileName = `Export_${schedule.nom}_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
      
      exportToExcel(
        exportData,
        schedule.type_export as 'full' | 'summary' | 'raw'
      );

      // Enregistrer dans l'historique
      const { error } = await supabase
        .from("exports_historique")
        .insert([{
          planification_id: schedule.id,
          nom_fichier: `${fileName}.xlsx`,
          type_export: schedule.type_export,
          statut: 'success',
          taille_kb: Math.round(JSON.stringify(exportData).length / 1024),
          nombre_lignes: Object.values(exportData).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
        }]);

      if (error) throw error;

      // Mettre à jour la date du dernier export
      await supabase
        .from("exports_planifies")
        .update({ dernier_export_at: new Date().toISOString() })
        .eq("id", schedule.id);

      loadHistory();
      loadSchedules();

      toast({
        title: "Export généré avec succès",
        description: "Le fichier a été téléchargé",
      });
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'export",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      type_export: "full",
      frequence: "monthly",
      jour_semaine: 1,
      jour_mois: 1,
      heure_execution: "09:00",
    });
  };

  const openEditDialog = (schedule: ScheduledExport) => {
    setEditingSchedule(schedule);
    setFormData({
      nom: schedule.nom,
      type_export: schedule.type_export,
      frequence: schedule.frequence,
      jour_semaine: schedule.jour_semaine || 1,
      jour_mois: schedule.jour_mois || 1,
      heure_execution: schedule.heure_execution,
    });
    setDialogOpen(true);
  };

  const getFrequenceLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return freq;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'Complet';
      case 'summary': return 'Résumé';
      case 'raw': return 'Données brutes';
      case 'custom': return 'Personnalisé';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exports Planifiés (Mode Démo)</h2>
          <p className="text-muted-foreground">
            Gérez vos exports automatiques - en mode démo les exports sont téléchargés directement
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle planification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Modifier la planification" : "Nouvelle planification d'export"}
              </DialogTitle>
              <DialogDescription>
                Configurez un export automatique récurrent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom de la planification</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Rapport mensuel finances"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type_export">Type d'export</Label>
                  <Select
                    value={formData.type_export}
                    onValueChange={(value: any) => setFormData({ ...formData, type_export: value })}
                  >
                    <SelectTrigger id="type_export">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Complet</SelectItem>
                      <SelectItem value="summary">Résumé (KPIs)</SelectItem>
                      <SelectItem value="raw">Données brutes</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequence">Fréquence</Label>
                  <Select
                    value={formData.frequence}
                    onValueChange={(value: any) => setFormData({ ...formData, frequence: value })}
                  >
                    <SelectTrigger id="frequence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.frequence === 'weekly' && (
                <div>
                  <Label htmlFor="jour_semaine">Jour de la semaine</Label>
                  <Select
                    value={formData.jour_semaine.toString()}
                    onValueChange={(value) => setFormData({ ...formData, jour_semaine: parseInt(value) })}
                  >
                    <SelectTrigger id="jour_semaine">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                      <SelectItem value="7">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequence === 'monthly' && (
                <div>
                  <Label htmlFor="jour_mois">Jour du mois</Label>
                  <Input
                    id="jour_mois"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.jour_mois}
                    onChange={(e) => setFormData({ ...formData, jour_mois: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="heure_execution">Heure d'exécution</Label>
                <Input
                  id="heure_execution"
                  type="time"
                  value={formData.heure_execution}
                  onChange={(e) => setFormData({ ...formData, heure_execution: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={loading || !formData.nom}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planifications actives
          </CardTitle>
          <CardDescription>
            {schedules.filter(s => s.actif).length} planification(s) active(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Dernier export</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune planification configurée
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(schedule.type_export)}</Badge>
                    </TableCell>
                    <TableCell>{getFrequenceLabel(schedule.frequence)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {schedule.heure_execution}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.dernier_export_at
                        ? format(new Date(schedule.dernier_export_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                        : "Jamais"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={schedule.actif}
                        onCheckedChange={() => handleToggleActive(schedule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateNow(schedule)}
                          disabled={loading}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Historique des exports
          </CardTitle>
          <CardDescription>20 derniers exports générés</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun export dans l'historique
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nom_fichier}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(item.type_export)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.statut === 'success'
                            ? 'default'
                            : item.statut === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {item.statut === 'success' ? 'Réussi' : item.statut === 'failed' ? 'Échoué' : 'En cours'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.taille_kb ? `${item.taille_kb} KB` : '-'}</TableCell>
                    <TableCell>{item.nombre_lignes || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(item.genere_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
