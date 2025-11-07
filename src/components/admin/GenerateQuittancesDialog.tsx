import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

interface GenerateQuittancesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licence: any;
  onSuccess: () => void;
}

export const GenerateQuittancesDialog = ({
  open,
  onOpenChange,
  licence,
  onSuccess,
}: GenerateQuittancesDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Calculer le montant mensuel
      const montantMensuel = Math.round(licence.montant_total / 12);

      // Créer 12 quittances (une par mois)
      const quittances = Array.from({ length: 12 }, (_, index) => {
        const mois = index + 1;
        const dateEcheance = new Date(licence.annee, mois - 1, 5); // 5ème jour du mois

        return {
          licence_id: licence.id,
          mois: mois,
          annee: licence.annee,
          date_echeance: dateEcheance.toISOString().split('T')[0],
          montant: montantMensuel,
          statut: 'en_attente',
        };
      });

      // Insérer toutes les quittances
      const { error } = await supabase
        .from('quittances')
        .insert(quittances);

      if (error) throw error;

      toast.success("12 quittances générées avec succès !");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating quittances:', error);
      toast.error("Erreur lors de la génération des quittances");
    } finally {
      setLoading(false);
    }
  };

  if (!licence) return null;

  const montantMensuel = Math.round(licence.montant_total / 12);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générer les Quittances Annuelles
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-foreground">
              Vous êtes sur le point de générer automatiquement <strong>12 quittances mensuelles</strong> pour
              la licence <strong>{licence.numero}</strong>.
            </div>
            
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pirogue:</span>
                <span className="font-medium">{licence.pirogues?.nom}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Montant total annuel:</span>
                <span className="font-bold">{licence.montant_total?.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">Montant mensuel (calculé):</span>
                <span className="font-bold text-primary">{montantMensuel.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>12 quittances seront créées, une pour chaque mois de l'année {licence.annee}</span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Date d'échéance: le 5 de chaque mois</span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Statut initial: En attente</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Cette action créera automatiquement toutes les quittances nécessaires pour le suivi des paiements.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Sparkles className="mr-2 h-4 w-4" />
            Générer les 12 quittances
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};