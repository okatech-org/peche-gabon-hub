import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const departSchema = z.object({
  pirogue_id: z.string().min(1, "Sélectionnez une pirogue"),
  site_id: z.string().min(1, "Sélectionnez un site"),
  date_depart: z.string().min(1, "Date requise"),
  heure_depart: z.string().min(1, "Heure requise"),
});

type DepartFormData = z.infer<typeof departSchema>;

interface DepartEnMerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DepartEnMerDialog = ({ open, onOpenChange, onSuccess }: DepartEnMerDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pirogues, setPirogues] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const form = useForm<DepartFormData>({
    resolver: zodResolver(departSchema),
    defaultValues: {
      date_depart: new Date().toISOString().split('T')[0],
      heure_depart: new Date().toTimeString().slice(0, 5),
    },
  });

  useEffect(() => {
    if (open) {
      loadReferenceData();
      form.reset({
        date_depart: new Date().toISOString().split('T')[0],
        heure_depart: new Date().toTimeString().slice(0, 5),
      });
    }
  }, [open]);

  const loadReferenceData = async () => {
    try {
      console.log("Chargement des données de référence...");
      
      // Load pirogues
      const { data: piroguesData, error: piroguesError } = await supabase
        .from('pirogues')
        .select('id, nom, immatriculation')
        .eq('statut', 'active')
        .order('nom');
      
      if (piroguesError) {
        console.error("Erreur pirogues:", piroguesError);
      } else {
        console.log("Pirogues chargées:", piroguesData);
      }
      
      // Load sites  
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id, nom, province')
        .order('nom');

      if (sitesError) {
        console.error("Erreur sites:", sitesError);
      } else {
        console.log("Sites chargés:", sitesData);
      }

      setPirogues(piroguesData || []);
      setSites(sitesData || []);
      
      if (!piroguesData || piroguesData.length === 0) {
        toast.info("Aucune pirogue active disponible");
      }
      if (!sitesData || sitesData.length === 0) {
        toast.info("Aucun site actif disponible");
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const onSubmit = async (data: DepartFormData) => {
    try {
      setLoading(true);

      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Vérifier qu'il n'y a pas déjà une sortie en cours
      const { data: sortieEnCours, error: checkError } = await supabase
        .from("sorties_peche")
        .select("id")
        .eq("pecheur_id", user.id)
        .is("date_retour", null)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Erreur vérification sortie:", checkError);
      }

      if (sortieEnCours) {
        toast.error("Vous avez déjà une sortie en cours");
        return;
      }

      const { error } = await supabase.from("sorties_peche").insert({
        pecheur_id: user.id,
        pirogue_id: data.pirogue_id,
        site_id: data.site_id,
        date_depart: data.date_depart,
        heure_depart: data.heure_depart,
      } as any);

      if (error) throw error;

      toast.success("Départ en mer enregistré avec succès");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Départ en Mer</DialogTitle>
          <DialogDescription>
            Enregistrez votre départ en mer pour démarrer une nouvelle sortie de pêche
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pirogue_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pirogue *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une pirogue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {pirogues.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Aucune pirogue disponible
                        </div>
                      ) : (
                        pirogues.map((pirogue) => (
                          <SelectItem key={pirogue.id} value={pirogue.id}>
                            {pirogue.nom} - {pirogue.immatriculation}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site de Départ *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {sites.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Aucun site disponible
                        </div>
                      ) : (
                        sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.nom} {site.province ? `(${site.province})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_depart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de Départ *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heure_depart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de Départ *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le Départ
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};