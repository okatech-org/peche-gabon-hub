import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const captureSchema = z.object({
  pirogue_id: z.string().min(1, "Sélectionnez une pirogue"),
  site_id: z.string().min(1, "Sélectionnez un site"),
  date_capture: z.string().min(1, "Date requise"),
  engin_id: z.string().min(1, "Sélectionnez un engin"),
  espece_id: z.string().min(1, "Sélectionnez une espèce"),
  poids_kg: z.string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Le poids doit être supérieur à 0"
    }),
  nb_individus: z.string().optional(),
  effort_unite: z.string().optional(),
  zone_peche: z.string().optional(),
  observations: z.string().optional(),
});

type CaptureFormData = z.infer<typeof captureSchema>;

interface DeclarerCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeclarerCaptureDialog = ({ open, onOpenChange }: DeclarerCaptureDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [pirogues, setPirogues] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [engins, setEngins] = useState<any[]>([]);
  const [especes, setEspeces] = useState<any[]>([]);
  const [cpueCalcule, setCpueCalcule] = useState<number | null>(null);

  const form = useForm<CaptureFormData>({
    resolver: zodResolver(captureSchema),
    defaultValues: {
      date_capture: new Date().toISOString().split('T')[0],
    },
  });

  const poids = form.watch("poids_kg");
  const effort = form.watch("effort_unite");

  useEffect(() => {
    if (poids && effort) {
      const p = parseFloat(poids);
      const e = parseFloat(effort);
      if (!isNaN(p) && !isNaN(e) && e > 0) {
        setCpueCalcule(p / e);
      } else {
        setCpueCalcule(null);
      }
    } else {
      setCpueCalcule(null);
    }
  }, [poids, effort]);

  useEffect(() => {
    if (open) {
      loadReferenceData();
    }
  }, [open]);

  const loadReferenceData = async () => {
    try {
      const [piroguesRes, sitesRes, enginsRes, especesRes] = await Promise.all([
        supabase.from('pirogues').select('id, nom, immatriculation').eq('statut', 'active'),
        supabase.from('sites').select('id, nom'),
        supabase.from('engins').select('id, nom'),
        supabase.from('especes').select('id, nom, categorie'),
      ]);

      if (piroguesRes.data) setPirogues(piroguesRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (enginsRes.data) setEngins(enginsRes.data);
      if (especesRes.data) setEspeces(especesRes.data);
    } catch (error) {
      console.error('Error loading reference data:', error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const onSubmit = async (data: CaptureFormData) => {
    setLoading(true);
    try {
      const dateCapture = new Date(data.date_capture);
      
      const { error } = await supabase.from('captures_pa').insert({
        pirogue_id: data.pirogue_id,
        site_id: data.site_id,
        date_capture: data.date_capture,
        annee: dateCapture.getFullYear(),
        mois: dateCapture.getMonth() + 1,
        engin_id: data.engin_id,
        espece_id: data.espece_id,
        poids_kg: parseFloat(data.poids_kg),
        nb_individus: data.nb_individus ? parseInt(data.nb_individus) : null,
        effort_unite: data.effort_unite ? parseFloat(data.effort_unite) : null,
        zone_peche: data.zone_peche || null,
        observations: data.observations || null,
      });

      if (error) throw error;

      toast.success("Capture déclarée avec succès");
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error declaring capture:', error);
      toast.error(error.message || "Erreur lors de la déclaration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déclarer une Capture</DialogTitle>
          <DialogDescription>
            Enregistrez les détails de la capture. Le CPUE sera calculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
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
                      <SelectContent>
                        {pirogues.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom} ({p.immatriculation})
                          </SelectItem>
                        ))}
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
                    <FormLabel>Site de débarquement *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_capture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de capture *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} max={new Date().toISOString().split('T')[0]} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="engin_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engin de pêche *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un engin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {engins.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="espece_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espèce *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une espèce" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {especes.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nom} ({e.categorie})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="poids_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 25.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nb_individus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d'individus</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 10" {...field} />
                    </FormControl>
                    <FormDescription>Optionnel</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effort_unite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effort (heures)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Ex: 4.5" {...field} />
                    </FormControl>
                    <FormDescription>Pour calcul du CPUE</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zone_peche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone de pêche</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Zone côtière nord" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {cpueCalcule !== null && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>CPUE calculé:</strong> {cpueCalcule.toFixed(4)} kg/heure
                  <br />
                  <span className="text-sm text-muted-foreground">
                    (Poids: {poids} kg / Effort: {effort} heures)
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations complémentaires..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
