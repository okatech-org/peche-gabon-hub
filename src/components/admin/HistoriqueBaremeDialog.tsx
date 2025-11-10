import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HistoriqueEntry {
  id: string;
  action: string;
  champs_modifies: Record<string, boolean>;
  anciennes_valeurs: any;
  nouvelles_valeurs: any;
  modifie_le: string;
  commentaire: string | null;
  modifie_par: string | null;
}

interface HistoriqueBaremeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baremeId: string | null;
}

export function HistoriqueBaremeDialog({
  open,
  onOpenChange,
  baremeId,
}: HistoriqueBaremeDialogProps) {
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);

  useEffect(() => {
    if (open && baremeId) {
      loadHistorique();
    }
  }, [open, baremeId]);

  const loadHistorique = async () => {
    if (!baremeId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bareme_taxes_historique")
        .select("*")
        .eq("bareme_id", baremeId)
        .order("modifie_le", { ascending: false });

      if (error) throw error;
      setHistorique((data || []) as any);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      creation: "default",
      modification: "secondary",
      activation: "default",
      desactivation: "destructive",
    };

    const labels: Record<string, string> = {
      creation: "Création",
      modification: "Modification",
      activation: "Activation",
      desactivation: "Désactivation",
    };

    return (
      <Badge variant={variants[action] || "outline"}>
        {labels[action] || action}
      </Badge>
    );
  };

  const formatFieldName = (field: string): string => {
    const labels: Record<string, string> = {
      nom: "Nom",
      type_taxe: "Type de taxe",
      montant_fixe_kg: "Montant fixe",
      taux_pourcentage: "Taux",
      seuil_min_kg: "Seuil min",
      seuil_max_kg: "Seuil max",
      date_debut: "Date début",
      date_fin: "Date fin",
      espece_id: "Espèce",
      actif: "Statut",
    };
    return labels[field] || field;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return format(new Date(value), "dd/MM/yyyy", { locale: fr });
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des modifications</DialogTitle>
          <DialogDescription>
            Historique complet des modifications apportées à ce barème
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : historique.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            Aucun historique disponible
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Champs modifiés</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historique.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {format(new Date(entry.modifie_le), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>{getActionBadge(entry.action)}</TableCell>
                    <TableCell>
                      {Object.keys(entry.champs_modifies || {}).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(entry.champs_modifies).map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {formatFieldName(field)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.action === "modification" && entry.anciennes_valeurs && entry.nouvelles_valeurs ? (
                        <div className="space-y-1 text-xs">
                          {Object.keys(entry.champs_modifies || {}).map((field) => (
                            <div key={field} className="flex items-center gap-2">
                              <span className="font-medium">{formatFieldName(field)}:</span>
                              <span className="text-muted-foreground line-through">
                                {formatValue(entry.anciennes_valeurs[field])}
                              </span>
                              <span>→</span>
                              <span className="text-primary">
                                {formatValue(entry.nouvelles_valeurs[field])}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : entry.action === "creation" && entry.nouvelles_valeurs ? (
                        <div className="text-xs text-muted-foreground">
                          Barème créé
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {entry.action === "activation" ? "Barème activé" : "Barème désactivé"}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
