import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInHours, differenceInMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";

const retourSchema = z.object({
  date_retour: z.string().min(1, "Date requise"),
  heure_retour: z.string().min(1, "Heure requise"),
});

type RetourFormData = z.infer<typeof retourSchema>;

interface SortieEnCours {
  id: string;
  pirogue_id: string;
  site_id: string;
  date_depart: string;
  heure_depart: string;
  pirogue_nom?: string;
  site_nom?: string;
}

interface RetourAuPortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortie: SortieEnCours | null;
  onSuccess?: () => void;
}

export const RetourAuPortDialog = ({ open, onOpenChange, sortie, onSuccess }: RetourAuPortDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [effortCalcule, setEffortCalcule] = useState<number | null>(null);

  const form = useForm<RetourFormData>({
    resolver: zodResolver(retourSchema),
    defaultValues: {
      date_retour: new Date().toISOString().split('T')[0],
      heure_retour: new Date().toTimeString().slice(0, 5),
    },
  });

  const dateRetour = form.watch("date_retour");
  const heureRetour = form.watch("heure_retour");

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setSubmitSuccess(false);
      form.reset({
        date_retour: new Date().toISOString().split('T')[0],
        heure_retour: new Date().toTimeString().slice(0, 5),
      });
    }
  }, [open]);

  // Calculer l'effort automatiquement
  useEffect(() => {
    if (!sortie || !dateRetour || !heureRetour) {
      setEffortCalcule(null);
      return;
    }

    try {
      const depart = new Date(`${sortie.date_depart}T${sortie.heure_depart}`);
      const retour = new Date(`${dateRetour}T${heureRetour}`);
      
      if (retour > depart) {
        const heures = differenceInHours(retour, depart);
        const minutes = differenceInMinutes(retour, depart) % 60;
        const effortEnHeures = heures + (minutes / 60);
        setEffortCalcule(parseFloat(effortEnHeures.toFixed(2)));
      } else {
        setEffortCalcule(null);
      }
    } catch (error) {
      setEffortCalcule(null);
    }
  }, [sortie, dateRetour, heureRetour]);

  const onSubmit = async (data: RetourFormData) => {
    try {
      setLoading(true);

      if (!sortie) {
        toast.error("Aucune sortie en cours");
        return;
      }

      if (!effortCalcule || effortCalcule <= 0) {
        toast.error("La date/heure de retour doit être après le départ");
        return;
      }

      const { error } = await supabase
        .from("sorties_peche")
        .update({
          date_retour: data.date_retour,
          heure_retour: data.heure_retour,
          effort_unite: effortCalcule,
        })
        .eq("id", sortie.id);

      if (error) throw error;

      setSubmitSuccess(true);
      toast.success(`Retour enregistré - Effort de pêche: ${effortCalcule.toFixed(2)}h`);
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  if (!sortie) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Retour au Port</DialogTitle>
          <DialogDescription>
            Enregistrez votre retour au port - L'effort de pêche sera calculé automatiquement
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2 mb-4">
          <p className="text-sm"><strong>Pirogue:</strong> {sortie.pirogue_nom}</p>
          <p className="text-sm"><strong>Départ:</strong> {sortie.date_depart} à {sortie.heure_depart}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_retour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de Retour *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heure_retour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de Retour *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {effortCalcule !== null && effortCalcule > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Effort de pêche calculé:</strong> {effortCalcule.toFixed(2)} heures
                </AlertDescription>
              </Alert>
            )}

            {effortCalcule !== null && effortCalcule <= 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  L'heure de retour doit être après l'heure de départ
                </AlertDescription>
              </Alert>
            )}

            {submitSuccess && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Retour enregistré ! Fermeture automatique...
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading || submitSuccess}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading || submitSuccess || !effortCalcule || effortCalcule <= 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le Retour
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};