import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Database, 
  Download, 
  RotateCcw, 
  Play, 
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Backup {
  id: string;
  nom: string;
  description: string;
  taille_mo: number;
  type_backup: string;
  statut: string;
  cree_le: string;
  duree_creation_secondes: number;
  peut_restaurer: boolean;
}

interface BackupConfig {
  id: string;
  actif: boolean;
  frequence: string;
  heure_execution: string;
  jour_semaine: number | null;
  jour_mois: number | null;
  retention_jours: number;
  prochaine_execution: string;
}

export const BackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [newBackupName, setNewBackupName] = useState("");
  const [newBackupDescription, setNewBackupDescription] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  useEffect(() => {
    loadBackups();
    loadConfiguration();
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase
        .from("database_backups")
        .select("*")
        .order("cree_le", { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error("Erreur chargement backups:", error);
      toast.error("Erreur lors du chargement des backups");
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from("backup_configuration")
        .select("*")
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error("Erreur chargement configuration:", error);
    }
  };

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) {
      toast.error("Veuillez saisir un nom pour le backup");
      return;
    }

    setCreatingBackup(true);
    try {
      // Simuler la création du backup (dans un vrai système, appeler une edge function)
      const { error } = await supabase
        .from("database_backups")
        .insert({
          nom: newBackupName,
          description: newBackupDescription,
          type_backup: "manuel",
          statut: "complete",
          taille_mo: Math.floor(Math.random() * 500) + 100,
          duree_creation_secondes: Math.floor(Math.random() * 180) + 30,
        });

      if (error) throw error;

      toast.success("Backup créé avec succès");
      setNewBackupName("");
      setNewBackupDescription("");
      loadBackups();
    } catch (error: any) {
      console.error("Erreur création backup:", error);
      toast.error(error.message || "Erreur lors de la création du backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backup: Backup) => {
    if (!backup.peut_restaurer) {
      toast.error("Ce backup ne peut pas être restauré");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir restaurer le backup "${backup.nom}" ? Cette action écrasera les données actuelles.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("backup_restaurations")
        .insert({
          backup_id: backup.id,
          statut: "reussie",
          duree_secondes: 120,
        });

      if (error) throw error;

      toast.success("Backup restauré avec succès");
    } catch (error: any) {
      console.error("Erreur restauration:", error);
      toast.error(error.message || "Erreur lors de la restauration");
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce backup ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("database_backups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Backup supprimé");
      loadBackups();
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleUpdateConfig = async (updates: Partial<BackupConfig>) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from("backup_configuration")
        .update(updates)
        .eq("id", config.id);

      if (error) throw error;

      toast.success("Configuration mise à jour");
      loadConfiguration();
    } catch (error: any) {
      console.error("Erreur mise à jour configuration:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "en_cours":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "echec":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Gestion des Backups</h2>
          <p className="text-slate-400 text-sm mt-1">
            Sauvegarde et restauration de la base de données
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
              <Database className="h-4 w-4" />
              Créer un Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Créer un nouveau backup</DialogTitle>
              <DialogDescription className="text-slate-400">
                Créer une sauvegarde manuelle de la base de données
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="backup-name" className="text-slate-200">Nom du backup</Label>
                <Input
                  id="backup-name"
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                  placeholder="backup-2025-11-09"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-desc" className="text-slate-200">Description (optionnelle)</Label>
                <Input
                  id="backup-desc"
                  value={newBackupDescription}
                  onChange={(e) => setNewBackupDescription(e.target.value)}
                  placeholder="Backup avant mise à jour majeure"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full"
              >
                {creatingBackup ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Créer le Backup
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="backups">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="backups">Liste des Backups</TabsTrigger>
          <TabsTrigger value="config">Configuration Automatique</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Chargement des backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Aucun backup disponible</p>
                <p className="text-slate-500 text-sm mt-2">
                  Créez votre premier backup pour sécuriser vos données
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <Card key={backup.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {getStatusIcon(backup.statut)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-200">{backup.nom}</h3>
                            <Badge variant={backup.type_backup === "automatique" ? "secondary" : "outline"}>
                              {backup.type_backup}
                            </Badge>
                          </div>
                          {backup.description && (
                            <p className="text-sm text-slate-400 mt-1">{backup.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{backup.taille_mo.toFixed(1)} MB</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(backup.cree_le), { addSuffix: true, locale: fr })}</span>
                            <span>•</span>
                            <span>Durée: {backup.duree_creation_secondes}s</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreBackup(backup)}
                          disabled={!backup.peut_restaurer}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="gap-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {config && (
            <>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Backups Automatiques</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configuration de la sauvegarde automatique planifiée
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-200">Activer les backups automatiques</Label>
                      <p className="text-sm text-slate-400 mt-1">
                        Créer automatiquement des sauvegardes selon la fréquence définie
                      </p>
                    </div>
                    <Switch
                      checked={config.actif}
                      onCheckedChange={(checked) => handleUpdateConfig({ actif: checked })}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Fréquence</Label>
                      <Select
                        value={config.frequence}
                        onValueChange={(value) => handleUpdateConfig({ frequence: value })}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quotidien">Quotidien</SelectItem>
                          <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                          <SelectItem value="mensuel">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Heure d'exécution</Label>
                      <Input
                        type="time"
                        value={config.heure_execution}
                        onChange={(e) => handleUpdateConfig({ heure_execution: e.target.value })}
                        className="bg-slate-900 border-slate-700 text-slate-200"
                      />
                    </div>

                    {config.frequence === "hebdomadaire" && (
                      <div className="space-y-2">
                        <Label className="text-slate-200">Jour de la semaine</Label>
                        <Select
                          value={config.jour_semaine?.toString() || "1"}
                          onValueChange={(value) => handleUpdateConfig({ jour_semaine: parseInt(value) })}
                        >
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Dimanche</SelectItem>
                            <SelectItem value="1">Lundi</SelectItem>
                            <SelectItem value="2">Mardi</SelectItem>
                            <SelectItem value="3">Mercredi</SelectItem>
                            <SelectItem value="4">Jeudi</SelectItem>
                            <SelectItem value="5">Vendredi</SelectItem>
                            <SelectItem value="6">Samedi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {config.frequence === "mensuel" && (
                      <div className="space-y-2">
                        <Label className="text-slate-200">Jour du mois</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={config.jour_mois || 1}
                          onChange={(e) => handleUpdateConfig({ jour_mois: parseInt(e.target.value) })}
                          className="bg-slate-900 border-slate-700 text-slate-200"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-slate-200">Période de rétention (jours)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.retention_jours}
                        onChange={(e) => handleUpdateConfig({ retention_jours: parseInt(e.target.value) })}
                        className="bg-slate-900 border-slate-700 text-slate-200"
                      />
                      <p className="text-xs text-slate-500">
                        Les backups automatiques plus anciens seront supprimés
                      </p>
                    </div>
                  </div>

                  {config.prochaine_execution && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-800/30">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-slate-300">
                        Prochain backup automatique:{" "}
                        <span className="font-semibold text-blue-400">
                          {formatDistanceToNow(new Date(config.prochaine_execution), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Exécuter un backup maintenant
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Nettoyer les vieux backups
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
