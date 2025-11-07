import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const quittanceSchema = z.object({
  licence_id: z.string().min(1, "Veuillez sélectionner une licence"),
  mois: z.number().min(1).max(12, "Mois invalide"),
  annee: z.number().min(2024).max(2050, "Année invalide"),
  date_echeance: z.date({
    required_error: "La date d'échéance est requise",
  }),
  montant: z.number().min(0, "Le montant doit être positif"),
  numero_recu: z.string().optional(),
  observations: z.string().optional(),
});

type QuittanceFormValues = z.infer<typeof quittanceSchema>;

interface AddQuittanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingQuittance?: any;
}

export const AddQuittanceDialog = ({
  open,
  onOpenChange,
  onSuccess,
  editingQuittance,
}: AddQuittanceDialogProps) => {
  const [licences, setLicences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLicences, setLoadingLicences] = useState(true);
  const [selectedLicence, setSelectedLicence] = useState<any>(null);

  const form = useForm<QuittanceFormValues>({
    resolver: zodResolver(quittanceSchema),
    defaultValues: {
      licence_id: editingQuittance?.licence_id || "",
      mois: editingQuittance?.mois || new Date().getMonth() + 1,
      annee: editingQuittance?.annee || new Date().getFullYear(),
      date_echeance: editingQuittance?.date_echeance ? new Date(editingQuittance.date_echeance) : new Date(),
      montant: editingQuittance?.montant || 0,
      numero_recu: editingQuittance?.numero_recu || "",
      observations: editingQuittance?.observations || "",
    },
  });

  useEffect(() => {
    if (open) {
      loadLicences();
    }
  }, [open]);

  useEffect(() => {
    if (editingQuittance) {
      form.reset({
        licence_id: editingQuittance.licence_id,
        mois: editingQuittance.mois,
        annee: editingQuittance.annee,
        date_echeance: new Date(editingQuittance.date_echeance),
        montant: editingQuittance.montant,
        numero_recu: editingQuittance.numero_recu || "",
        observations: editingQuittance.observations || "",
      });
    }
  }, [editingQuittance, form]);

  const loadLicences = async () => {
    try {
      const { data, error } = await supabase
        .from('licences')
        .select(`
          *,
          pirogues(
            nom,
            immatriculation,
            proprietaires(nom, prenom)
          )
        `)
        .eq('statut', 'validee')
        .order('numero');

      if (error) throw error;
      setLicences(data || []);
    } catch (error: any) {
      console.error('Error loading licences:', error);
      toast.error("Erreur lors du chargement des licences");
    } finally {
      setLoadingLicences(false);
    }
  };

  // Calculer automatiquement le montant mensuel quand une licence est sélectionnée
  const handleLicenceChange = (licenceId: string) => {
    const licence = licences.find(l => l.id === licenceId);
    if (licence) {
      setSelectedLicence(licence);
      // Calcul automatique du montant mensuel (montant total / 12)
      const montantMensuel = Math.round(licence.montant_total / 12);
      form.setValue('montant', montantMensuel);
      
      // Calculer automatiquement la date d'échéance
      calculateDateEcheance(form.getValues('mois'), form.getValues('annee'));
    }
  };

  // Calculer la date d'échéance (5ème jour du mois)
  const calculateDateEcheance = (mois: number, annee: number) => {
    const date = new Date(annee, mois - 1, 5); // 5ème jour du mois
    form.setValue('date_echeance', date);
  };

  // Recalculer la date d'échéance quand le mois change
  const handleMoisChange = (mois: string) => {
    const moisNumber = parseInt(mois);
    form.setValue('mois', moisNumber);
    calculateDateEcheance(moisNumber, form.getValues('annee'));
  };

  // Recalculer la date d'échéance quand l'année change
  const handleAnneeChange = (annee: string) => {
    const anneeNumber = parseInt(annee);
    form.setValue('annee', anneeNumber);
    calculateDateEcheance(form.getValues('mois'), anneeNumber);
  };

  const onSubmit = async (data: QuittanceFormValues) => {
    setLoading(true);
    try {
      const quittanceData = {
        licence_id: data.licence_id,
        mois: data.mois,
        annee: data.annee,
        date_echeance: data.date_echeance.toISOString().split('T')[0],
        montant: data.montant,
        numero_recu: data.numero_recu || null,
        observations: data.observations || null,
        statut: 'en_attente',
      };

      if (editingQuittance) {
        const { error } = await supabase
          .from('quittances')
          .update(quittanceData)
          .eq('id', editingQuittance.id);

        if (error) throw error;
        toast.success("Quittance modifiée avec succès");
      } else {
        const { error } = await supabase
          .from('quittances')
          .insert(quittanceData);

        if (error) throw error;
        toast.success("Quittance créée avec succès");
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving quittance:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const getMoisLabel = (mois: number) => {
    const moisLabels = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return moisLabels[mois - 1];
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuittance ? "Modifier la quittance" : "Nouvelle quittance"}
          </DialogTitle>
          <DialogDescription>
            {editingQuittance 
              ? "Modifiez les informations de la quittance"
              : "Créez une nouvelle quittance de paiement mensuel"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection de la licence */}
            <FormField
              control={form.control}
              name="licence_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Licence *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleLicenceChange(value);
                    }}
                    value={field.value}
                    disabled={loadingLicences || !!editingQuittance}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une licence validée" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {licences.map((licence) => (
                        <SelectItem key={licence.id} value={licence.id}>
                          {licence.numero} - {licence.pirogues?.nom} ({licence.pirogues?.immatriculation}) - {licence.montant_total?.toLocaleString()} FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Sélectionnez la licence pour laquelle créer une quittance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Affichage des informations de la licence sélectionnée */}
            {selectedLicence && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Pirogue:</span>
                  <span>{selectedLicence.pirogues?.nom} ({selectedLicence.pirogues?.immatriculation})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Propriétaire:</span>
                  <span>
                    {selectedLicence.pirogues?.proprietaires?.prenom} {selectedLicence.pirogues?.proprietaires?.nom}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Montant total annuel:</span>
                  <span className="font-bold">{selectedLicence.montant_total?.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Montant mensuel calculé:</span>
                  <span className="font-bold">{Math.round(selectedLicence.montant_total / 12).toLocaleString()} FCFA</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Mois */}
              <FormField
                control={form.control}
                name="mois"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois *</FormLabel>
                    <Select
                      onValueChange={handleMoisChange}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le mois" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {getMoisLabel(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Année */}
              <FormField
                control={form.control}
                name="annee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année *</FormLabel>
                    <Select
                      onValueChange={handleAnneeChange}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez l'année" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date d'échéance */}
              <FormField
                control={form.control}
                name="date_echeance"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date d'échéance *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Calculée automatiquement au 5 du mois
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Montant */}
              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (FCFA) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 50000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Calculé automatiquement (modifiable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Numéro de reçu */}
            <FormField
              control={form.control}
              name="numero_recu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de reçu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: REC-2024-001"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Numéro du reçu de paiement (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observations */}
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes ou remarques..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
                {editingQuittance ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};