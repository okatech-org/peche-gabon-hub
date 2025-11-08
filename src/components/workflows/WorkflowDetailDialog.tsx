import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  MessageSquare,
  History,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface WorkflowDetailDialogProps {
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowUpdated?: () => void;
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En Attente",
  en_cours: "En Cours",
  valide: "Validé",
  refuse: "Refusé",
  archive: "Archivé",
};

const INSTITUTION_LABELS: Record<string, string> = {
  dgpa: "DGPA",
  anpa: "ANPA",
  agasa: "AGASA",
  dgmm: "DGMM",
  oprag: "OPRAG",
  dgddi: "DGDDI",
  anpn: "ANPN",
  corep: "COREP",
};

export function WorkflowDetailDialog({ 
  workflowId, 
  open, 
  onOpenChange,
  onWorkflowUpdated 
}: WorkflowDetailDialogProps) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [historique, setHistorique] = useState<any[]>([]);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (open && workflowId) {
      loadWorkflowDetails();
    }
  }, [workflowId, open]);

  const loadWorkflowDetails = async () => {
    try {
      const [workflowRes, historiqueRes, commentairesRes] = await Promise.all([
        supabase
          .from("workflows_inter_institutionnels")
          .select("*")
          .eq("id", workflowId)
          .single() as any,
        supabase
          .from("workflow_historique")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: false }) as any,
        supabase
          .from("workflow_commentaires")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: true }) as any,
      ]);

      if (workflowRes.error) throw workflowRes.error;
      setWorkflow(workflowRes.data);
      setHistorique(historiqueRes.data || []);
      setCommentaires(commentairesRes.data || []);
    } catch (error) {
      console.error("Error loading workflow details:", error);
      toast.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (newStatut: string) => {
    try {
      const { error } = await supabase
        .from("workflows_inter_institutionnels")
        .update({ statut: newStatut } as any)
        .eq("id", workflowId);

      if (error) throw error;

      toast.success("Statut mis à jour");
      loadWorkflowDetails();
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (error: any) {
      console.error("Error updating workflow:", error);
      toast.error(error.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      // Get user institution
      const { data: rolesData } = await supabase.rpc('get_user_roles', {
        _user_id: user.id
      });

      const institution = rolesData?.[0] || 'unknown';

      const { error } = await supabase
        .from("workflow_commentaires")
        .insert({
          workflow_id: workflowId,
          commentaire: newComment,
          auteur_user_id: user.id,
          auteur_institution: institution,
          est_interne: false,
        } as any);

      if (error) throw error;

      toast.success("Commentaire ajouté");
      setNewComment("");
      loadWorkflowDetails();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message);
    }
  };

  if (loading || !workflow) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="py-8 text-center">Chargement...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{workflow.numero_reference}</DialogTitle>
            <Badge>{STATUT_LABELS[workflow.statut]}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Info principale */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{INSTITUTION_LABELS[workflow.institution_emettrice]}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">{INSTITUTION_LABELS[workflow.institution_destinataire]}</span>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{workflow.objet}</h3>
                {workflow.description && (
                  <p className="text-sm text-muted-foreground mt-2">{workflow.description}</p>
                )}
              </div>

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="font-medium">{workflow.type_workflow}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priorité:</span>{" "}
                  <span className="font-medium capitalize">{workflow.priorite}</span>
                </div>
                {workflow.date_echeance && (
                  <div>
                    <span className="text-muted-foreground">Échéance:</span>{" "}
                    <span className="font-medium">
                      {new Date(workflow.date_echeance).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            {workflow.statut !== "valide" && workflow.statut !== "refuse" && (
              <div className="flex gap-2">
                {workflow.statut === "en_attente" && (
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateStatut("en_cours")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Prendre en Charge
                  </Button>
                )}
                {(workflow.statut === "en_cours" || workflow.statut === "en_attente") && (
                  <>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleUpdateStatut("valide")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleUpdateStatut("refuse")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </>
                )}
              </div>
            )}

            <Separator />

            {/* Historique */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique des Actions
              </h4>
              <div className="space-y-2">
                {historique.map((item) => (
                  <div 
                    key={item.id} 
                    className="text-sm p-3 bg-muted rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.description_action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {INSTITUTION_LABELS[item.effectue_par_institution] || "Système"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Commentaires */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Commentaires et Échanges
              </h4>
              
              <div className="space-y-3">
                {commentaires.map((comment) => (
                  <div 
                    key={comment.id} 
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {INSTITUTION_LABELS[comment.auteur_institution]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.commentaire}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}