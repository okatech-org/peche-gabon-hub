import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, TrendingUp, TrendingDown, AlertTriangle, Eye, Check, X, Loader2, Plus, Star, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Alerte {
  id: string;
  created_at: string;
  indicateur: string;
  valeur_precedente: number;
  valeur_actuelle: number;
  variation_pourcentage: number;
  type_variation: string;
  severite: string;
  statut: string;
  recommandations_ia: string | null;
  rapport_nouveau: {
    id: string;
    titre: string;
    region: string;
    created_at: string;
  };
  rapport_reference: {
    id: string;
    titre: string;
    created_at: string;
  };
  seuil: {
    nom: string;
    description: string;
  };
}

interface ActionCorrective {
  id: string;
  alerte_id: string;
  action_description: string;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'abandonnee';
  date_debut: string | null;
  date_fin_prevue: string | null;
  date_fin_reelle: string | null;
  resultats: string | null;
  efficacite: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Commentaire {
  id: string;
  action_id: string;
  user_id: string;
  commentaire: string;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const AlertesRapportsPanel = () => {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionCorrective[]>([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState({
    action_description: '',
    date_debut: '',
    date_fin_prevue: '',
    notes: ''
  });
  const [editingAction, setEditingAction] = useState<ActionCorrective | null>(null);
  const [commentaires, setCommentaires] = useState<Record<string, Commentaire[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAlertes();
    // Charger l'ID utilisateur actuel
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (selectedAlerte) {
      loadActions(selectedAlerte.id);
    }
  }, [selectedAlerte]);

  useEffect(() => {
    // Setup realtime subscription for comments
    const channel = supabase
      .channel('commentaires-actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commentaires_actions'
        },
        (payload) => {
          console.log('Realtime comment update:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newComment = payload.new as any;
            // Reload comments for this action
            if (newComment.action_id) {
              loadCommentaires(newComment.action_id);
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedComment = payload.old as any;
            if (deletedComment.action_id) {
              setCommentaires(prev => ({
                ...prev,
                [deletedComment.action_id]: (prev[deletedComment.action_id] || []).filter(c => c.id !== deletedComment.id)
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAlertes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("alertes_rapports")
        .select(`
          *,
          rapport_nouveau:rapports_zones!rapport_nouveau_id (
            id,
            titre,
            region,
            created_at
          ),
          rapport_reference:rapports_zones!rapport_reference_id (
            id,
            titre,
            created_at
          ),
          seuil:seuils_alertes_rapports!seuil_id (
            nom,
            description
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertes(data || []);
    } catch (error) {
      console.error("Error loading alertes:", error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const loadCommentaires = async (actionId: string) => {
    try {
      const { data, error } = await supabase
        .from("commentaires_actions")
        .select("*")
        .eq("action_id", actionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Charger les profils séparément
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const commentairesWithProfiles = data.map(c => ({
          ...c,
          profiles: profilesMap.get(c.user_id) || null
        }));
        
        setCommentaires(prev => ({
          ...prev,
          [actionId]: commentairesWithProfiles as Commentaire[]
        }));
      } else {
        setCommentaires(prev => ({
          ...prev,
          [actionId]: []
        }));
      }
    } catch (error) {
      console.error("Error loading commentaires:", error);
    }
  };

  const addCommentaire = async (actionId: string) => {
    const commentText = newComment[actionId]?.trim();
    if (!commentText) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("commentaires_actions")
        .insert({
          action_id: actionId,
          user_id: userData.user?.id,
          commentaire: commentText
        });

      if (error) throw error;

      toast.success("Commentaire ajouté");
      setNewComment(prev => ({ ...prev, [actionId]: '' }));
      // Le realtime va recharger automatiquement
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const deleteCommentaire = async (commentId: string, actionId: string) => {
    try {
      const { error } = await supabase
        .from("commentaires_actions")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Commentaire supprimé");
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getUserDisplayName = (comment: Commentaire) => {
    if (comment.profiles?.first_name && comment.profiles?.last_name) {
      return `${comment.profiles.first_name} ${comment.profiles.last_name}`;
    }
    return comment.profiles?.email || 'Utilisateur';
  };

  const loadActions = async (alerteId: string) => {
    try {
      const { data, error } = await supabase
        .from("actions_correctives")
        .select("*")
        .eq("alerte_id", alerteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActions((data || []) as ActionCorrective[]);
      
      // Charger les commentaires pour chaque action
      if (data) {
        for (const action of data) {
          loadCommentaires(action.id);
        }
      }
    } catch (error) {
      console.error("Error loading actions:", error);
    }
  };

  const createAction = async () => {
    if (!selectedAlerte || !newAction.action_description) {
      toast.error("Description de l'action requise");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("actions_correctives")
        .insert({
          alerte_id: selectedAlerte.id,
          action_description: newAction.action_description,
          date_debut: newAction.date_debut || null,
          date_fin_prevue: newAction.date_fin_prevue || null,
          notes: newAction.notes || null,
          created_by: userData.user?.id,
          responsable: userData.user?.id
        });

      if (error) throw error;

      toast.success("Action corrective créée");
      setShowAddAction(false);
      setNewAction({ action_description: '', date_debut: '', date_fin_prevue: '', notes: '' });
      loadActions(selectedAlerte.id);
    } catch (error: any) {
      console.error("Error creating action:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const updateAction = async (actionId: string, updates: Partial<ActionCorrective>) => {
    try {
      const { error } = await supabase
        .from("actions_correctives")
        .update(updates)
        .eq("id", actionId);

      if (error) throw error;

      toast.success("Action mise à jour");
      if (selectedAlerte) {
        loadActions(selectedAlerte.id);
      }
      setEditingAction(null);
    } catch (error: any) {
      console.error("Error updating action:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifiee': return 'Planifiée';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'abandonnee': return 'Abandonnée';
      default: return statut;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifiee': return 'secondary';
      case 'en_cours': return 'default';
      case 'terminee': return 'outline';
      case 'abandonnee': return 'destructive';
      default: return 'outline';
    }
  };

  const updateStatut = async (alerteId: string, newStatut: string) => {
    setUpdatingStatus(alerteId);
    try {
      const updateData: any = {
        statut: newStatut,
      };

      if (newStatut === "vue") {
        updateData.vue_par = (await supabase.auth.getUser()).data.user?.id;
        updateData.vue_le = new Date().toISOString();
      } else if (newStatut === "traitee") {
        updateData.traitee_par = (await supabase.auth.getUser()).data.user?.id;
        updateData.traitee_le = new Date().toISOString();
      }

      const { error } = await supabase
        .from("alertes_rapports")
        .update(updateData)
        .eq("id", alerteId);

      if (error) throw error;

      setAlertes((prev) =>
        prev.map((a) =>
          a.id === alerteId ? { ...a, statut: newStatut } : a
        )
      );
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Error updating statut:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getIndicateurLabel = (indicateur: string) => {
    switch (indicateur) {
      case "captures_totales":
        return "Captures totales";
      case "cpue_moyen":
        return "CPUE moyen";
      case "nombre_sites":
        return "Nombre de sites";
      default:
        return indicateur;
    }
  };

  const getSeverityColor = (severite: string) => {
    switch (severite) {
      case "elevee":
        return "destructive";
      case "moyenne":
        return "default";
      case "faible":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityLabel = (severite: string) => {
    switch (severite) {
      case "elevee":
        return "Élevée";
      case "moyenne":
        return "Moyenne";
      case "faible":
        return "Faible";
      default:
        return severite;
    }
  };

  const filteredAlertes = (statut: string) => {
    if (statut === "toutes") return alertes;
    return alertes.filter((a) => a.statut === statut);
  };

  const AlerteCard = ({ alerte }: { alerte: Alerte }) => (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
      setSelectedAlerte(alerte);
      setShowDetails(true);
      if (alerte.statut === "nouvelle") {
        updateStatut(alerte.id, "vue");
      }
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {alerte.type_variation === "hausse" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <CardTitle className="text-base">{alerte.seuil.nom}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {alerte.rapport_nouveau.region} - {format(new Date(alerte.created_at), "PPP", { locale: fr })}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={getSeverityColor(alerte.severite as any)}>
              {getSeverityLabel(alerte.severite)}
            </Badge>
            {alerte.statut === "nouvelle" && (
              <Badge variant="outline" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Nouvelle
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getIndicateurLabel(alerte.indicateur)}</span>
            <span className={`font-semibold ${alerte.type_variation === "hausse" ? "text-green-600" : "text-red-600"}`}>
              {alerte.variation_pourcentage > 0 ? "+" : ""}{alerte.variation_pourcentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {alerte.valeur_precedente.toFixed(2)} → {alerte.valeur_actuelle.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Automatiques
              </CardTitle>
              <CardDescription>
                Variations significatives détectées dans les rapports
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadAlertes} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nouvelles">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nouvelles">
                Nouvelles ({filteredAlertes("nouvelle").length})
              </TabsTrigger>
              <TabsTrigger value="vues">
                Vues ({filteredAlertes("vue").length})
              </TabsTrigger>
              <TabsTrigger value="traitees">
                Traitées ({filteredAlertes("traitee").length})
              </TabsTrigger>
              <TabsTrigger value="toutes">
                Toutes ({alertes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nouvelles" className="space-y-3 mt-4">
              {filteredAlertes("nouvelle").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune nouvelle alerte</p>
              ) : (
                filteredAlertes("nouvelle").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="vues" className="space-y-3 mt-4">
              {filteredAlertes("vue").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte vue</p>
              ) : (
                filteredAlertes("vue").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="traitees" className="space-y-3 mt-4">
              {filteredAlertes("traitee").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte traitée</p>
              ) : (
                filteredAlertes("traitee").map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>

            <TabsContent value="toutes" className="space-y-3 mt-4">
              {alertes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune alerte pour le moment</p>
              ) : (
                alertes.map((alerte) => (
                  <AlerteCard key={alerte.id} alerte={alerte} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog des détails */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlerte?.type_variation === "hausse" ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              {selectedAlerte?.seuil.nom}
            </DialogTitle>
            <DialogDescription>
              {selectedAlerte?.seuil.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAlerte && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Région</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{selectedAlerte.rapport_nouveau.region}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Variation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-semibold ${selectedAlerte.type_variation === "hausse" ? "text-green-600" : "text-red-600"}`}>
                      {selectedAlerte.variation_pourcentage > 0 ? "+" : ""}{selectedAlerte.variation_pourcentage.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{getIndicateurLabel(selectedAlerte.indicateur)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Rapport précédent</p>
                      <p className="text-lg font-semibold">{selectedAlerte.valeur_precedente.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedAlerte.rapport_reference.created_at), "PP", { locale: fr })}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      →
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nouveau rapport</p>
                      <p className="text-lg font-semibold">{selectedAlerte.valeur_actuelle.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedAlerte.rapport_nouveau.created_at), "PP", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedAlerte.recommandations_ia && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        🤖
                      </span>
                      Recommandations IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {selectedAlerte.recommandations_ia}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="my-6" />

              {/* Section Actions Correctives */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Actions Correctives</h3>
                  <Button size="sm" onClick={() => setShowAddAction(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Action
                  </Button>
                </div>

                {showAddAction && (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Créer une action corrective</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="action-desc">Description de l'action *</Label>
                        <Textarea
                          id="action-desc"
                          value={newAction.action_description}
                          onChange={(e) => setNewAction({ ...newAction, action_description: e.target.value })}
                          placeholder="Décrire l'action à mettre en œuvre..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="date-debut">Date de début</Label>
                          <Input
                            id="date-debut"
                            type="date"
                            value={newAction.date_debut}
                            onChange={(e) => setNewAction({ ...newAction, date_debut: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date-fin">Date de fin prévue</Label>
                          <Input
                            id="date-fin"
                            type="date"
                            value={newAction.date_fin_prevue}
                            onChange={(e) => setNewAction({ ...newAction, date_fin_prevue: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newAction.notes}
                          onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })}
                          placeholder="Notes additionnelles..."
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setShowAddAction(false);
                          setNewAction({ action_description: '', date_debut: '', date_fin_prevue: '', notes: '' });
                        }}>
                          Annuler
                        </Button>
                        <Button size="sm" onClick={createAction}>
                          Créer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {actions.length === 0 && !showAddAction && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Aucune action corrective enregistrée
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Créez une action pour suivre sa mise en œuvre
                      </p>
                    </CardContent>
                  </Card>
                )}

                {actions.map((action) => (
                  <Card key={action.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingAction?.id === action.id ? (
                            <Textarea
                              value={editingAction.action_description}
                              onChange={(e) => setEditingAction({ ...editingAction, action_description: e.target.value })}
                              className="mb-2"
                              rows={2}
                            />
                          ) : (
                            <CardTitle className="text-sm font-medium">
                              {action.action_description}
                            </CardTitle>
                          )}
                          <CardDescription className="text-xs mt-1">
                            Créée le {format(new Date(action.created_at), "PPP", { locale: fr })}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatutColor(action.statut) as any}>
                          {getStatutLabel(action.statut)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {editingAction?.id === action.id ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Statut</Label>
                              <Select
                                value={editingAction.statut}
                                onValueChange={(value: any) => setEditingAction({ ...editingAction, statut: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planifiee">Planifiée</SelectItem>
                                  <SelectItem value="en_cours">En cours</SelectItem>
                                  <SelectItem value="terminee">Terminée</SelectItem>
                                  <SelectItem value="abandonnee">Abandonnée</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Date de fin réelle</Label>
                              <Input
                                type="date"
                                value={editingAction.date_fin_reelle || ''}
                                onChange={(e) => setEditingAction({ ...editingAction, date_fin_reelle: e.target.value })}
                                className="h-8"
                              />
                            </div>
                          </div>
                          {editingAction.statut === 'terminee' && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Efficacité (1-5)</Label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <Button
                                      key={rating}
                                      type="button"
                                      variant={editingAction.efficacite === rating ? "default" : "outline"}
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => setEditingAction({ ...editingAction, efficacite: rating })}
                                    >
                                      <Star className={`h-4 w-4 ${editingAction.efficacite === rating ? 'fill-current' : ''}`} />
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Résultats obtenus</Label>
                                <Textarea
                                  value={editingAction.resultats || ''}
                                  onChange={(e) => setEditingAction({ ...editingAction, resultats: e.target.value })}
                                  placeholder="Décrire les résultats et impacts..."
                                  rows={3}
                                />
                              </div>
                            </>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingAction(null)}>
                              Annuler
                            </Button>
                            <Button size="sm" onClick={() => updateAction(action.id, editingAction)}>
                              Enregistrer
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {action.date_debut && (
                              <div>
                                <p className="text-muted-foreground">Début</p>
                                <p className="font-medium">{format(new Date(action.date_debut), "PP", { locale: fr })}</p>
                              </div>
                            )}
                            {action.date_fin_prevue && (
                              <div>
                                <p className="text-muted-foreground">Fin prévue</p>
                                <p className="font-medium">{format(new Date(action.date_fin_prevue), "PP", { locale: fr })}</p>
                              </div>
                            )}
                            {action.date_fin_reelle && (
                              <div>
                                <p className="text-muted-foreground">Fin réelle</p>
                                <p className="font-medium">{format(new Date(action.date_fin_reelle), "PP", { locale: fr })}</p>
                              </div>
                            )}
                          </div>
                          {action.efficacite && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Efficacité:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Star
                                    key={rating}
                                    className={`h-3 w-3 ${rating <= action.efficacite! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {action.resultats && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Résultats:</p>
                              <p className="text-xs">{action.resultats}</p>
                            </div>
                          )}
                          {action.notes && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                              <p className="text-xs">{action.notes}</p>
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingAction({ ...action })}>
                              Modifier
                            </Button>
                          </div>
                        </>
                      )}
                      
                      {/* Section Commentaires */}
                      {!editingAction && (
                        <div className="border-t pt-3 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                            className="w-full justify-between"
                          >
                            <span className="text-xs font-medium">
                              Commentaires ({(commentaires[action.id] || []).length})
                            </span>
                            {expandedAction === action.id ? '▲' : '▼'}
                          </Button>
                          
                          {expandedAction === action.id && (
                            <div className="mt-3 space-y-3">
                              {/* Liste des commentaires */}
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {(commentaires[action.id] || []).map((comment) => (
                                  <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs font-semibold">
                                            {getUserDisplayName(comment).charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium">{getUserDisplayName(comment)}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(comment.created_at), "PPP 'à' HH:mm", { locale: fr })}
                                          </p>
                                        </div>
                                      </div>
                                      {comment.user_id === currentUserId && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => deleteCommentaire(comment.id, action.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-sm whitespace-pre-line">{comment.commentaire}</p>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Formulaire nouveau commentaire */}
                              <div className="flex gap-2">
                                <Textarea
                                  value={newComment[action.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [action.id]: e.target.value }))}
                                  placeholder="Ajouter un commentaire..."
                                  rows={2}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => addCommentaire(action.id)}
                                  disabled={!newComment[action.id]?.trim()}
                                >
                                  Envoyer
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2">
                {selectedAlerte.statut === "nouvelle" || selectedAlerte.statut === "vue" ? (
                  <Button
                    onClick={() => {
                      updateStatut(selectedAlerte.id, "traitee");
                      setShowDetails(false);
                    }}
                    disabled={updatingStatus === selectedAlerte.id}
                    className="gap-2"
                  >
                    {updatingStatus === selectedAlerte.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Marquer comme traitée
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlertesRapportsPanel;
