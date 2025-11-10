import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const baremeSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  type_taxe: z.enum(["capture", "licence", "autorisation"]),
  description: z.string().optional(),
  date_debut: z.string().min(1, "La date de début est requise"),
  date_fin: z.string().optional(),
  montant_fixe_kg: z.number().nullable(),
  taux_pourcentage: z.number().nullable(),
  seuil_min_kg: z.number().nullable(),
  seuil_max_kg: z.number().nullable(),
  espece_id: z.string().nullable(),
  actif: z.boolean(),
}).refine(
  (data) => data.montant_fixe_kg !== null || data.taux_pourcentage !== null,
  {
    message: "Le montant fixe ou le taux en pourcentage doit être défini",
    path: ["montant_fixe_kg"],
  }
);

type BaremeFormData = z.infer<typeof baremeSchema>;

interface AddEditBaremeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bareme: any | null;
  especes: Array<{ id: string; nom: string; code: string }>;
  onSuccess: () => void;
}

export function AddEditBaremeDialog({
  open,
  onOpenChange,
  bareme,
  especes,
  onSuccess,
}: AddEditBaremeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [calculationType, setCalculationType] = useState<"fixe" | "pourcentage">("fixe");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BaremeFormData>({
    resolver: zodResolver(baremeSchema),
    defaultValues: {
      actif: true,
      montant_fixe_kg: null,
      taux_pourcentage: null,
      seuil_min_kg: null,
      seuil_max_kg: null,
      espece_id: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (bareme) {
        // Mode édition
        reset({
          nom: bareme.nom,
          type_taxe: bareme.type_taxe,
          description: bareme.description || "",
          date_debut: bareme.date_debut,
          date_fin: bareme.date_fin || "",
          montant_fixe_kg: bareme.montant_fixe_kg,
          taux_pourcentage: bareme.taux_pourcentage,
          seuil_min_kg: bareme.seuil_min_kg,
          seuil_max_kg: bareme.seuil_max_kg,
          espece_id: bareme.espece_id,
          actif: bareme.actif,
        });
        setCalculationType(bareme.montant_fixe_kg ? "fixe" : "pourcentage");
      } else {
        // Mode création
        reset({
          actif: true,
          montant_fixe_kg: null,
          taux_pourcentage: null,
          seuil_min_kg: null,
          seuil_max_kg: null,
          espece_id: null,
        });
        setCalculationType("fixe");
      }
    }
  }, [open, bareme, reset]);

  const onSubmit = async (data: BaremeFormData) => {
    try {
      setLoading(true);

      // Nettoyer les données selon le type de calcul
      const cleanedData: any = {
        nom: data.nom,
        type_taxe: data.type_taxe,
        date_debut: data.date_debut,
        actif: data.actif,
        montant_fixe_kg: calculationType === "fixe" ? data.montant_fixe_kg : null,
        taux_pourcentage: calculationType === "pourcentage" ? data.taux_pourcentage : null,
        date_fin: data.date_fin || null,
        espece_id: data.espece_id || null,
        description: data.description || null,
        seuil_min_kg: data.seuil_min_kg || null,
        seuil_max_kg: data.seuil_max_kg || null,
      };

      if (bareme) {
        // Mise à jour
        const { error } = await supabase
          .from("bareme_taxes")
          .update(cleanedData)
          .eq("id", bareme.id);

        if (error) throw error;
        toast.success("Barème modifié avec succès");
      } else {
        // Création
        const { error } = await supabase
          .from("bareme_taxes")
          .insert([cleanedData]);

        if (error) throw error;
        toast.success("Barème créé avec succès");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bareme ? "Modifier le barème" : "Nouveau barème"}
          </DialogTitle>
          <DialogDescription>
            Définir les paramètres du barème de taxe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du barème *</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_taxe">Type de taxe *</Label>
              <Select
                value={watch("type_taxe")}
                onValueChange={(value) => setValue("type_taxe", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capture">Capture</SelectItem>
                  <SelectItem value="licence">Licence</SelectItem>
                  <SelectItem value="autorisation">Autorisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input id="date_debut" type="date" {...register("date_debut")} />
              {errors.date_debut && (
                <p className="text-sm text-destructive">{errors.date_debut.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin</Label>
              <Input id="date_fin" type="date" {...register("date_fin")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="espece_id">Espèce (optionnel)</Label>
            <Select
              value={watch("espece_id") || "none"}
              onValueChange={(value) => setValue("espece_id", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les espèces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Toutes les espèces</SelectItem>
                {especes.map((espece) => (
                  <SelectItem key={espece.id} value={espece.id}>
                    {espece.nom} ({espece.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label>Mode de calcul *</Label>
              <Select value={calculationType} onValueChange={(value: any) => setCalculationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixe">Montant fixe par kg</SelectItem>
                  <SelectItem value="pourcentage">Taux en pourcentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculationType === "fixe" ? (
              <div className="space-y-2">
                <Label htmlFor="montant_fixe_kg">Montant fixe (FCFA/kg) *</Label>
                <Input
                  id="montant_fixe_kg"
                  type="number"
                  step="0.01"
                  {...register("montant_fixe_kg", { valueAsNumber: true })}
                />
                {errors.montant_fixe_kg && (
                  <p className="text-sm text-destructive">{errors.montant_fixe_kg.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="taux_pourcentage">Taux en pourcentage (%) *</Label>
                <Input
                  id="taux_pourcentage"
                  type="number"
                  step="0.01"
                  {...register("taux_pourcentage", { valueAsNumber: true })}
                />
                {errors.taux_pourcentage && (
                  <p className="text-sm text-destructive">{errors.taux_pourcentage.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seuil_min_kg">Seuil minimum (kg)</Label>
              <Input
                id="seuil_min_kg"
                type="number"
                step="0.01"
                {...register("seuil_min_kg", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seuil_max_kg">Seuil maximum (kg)</Label>
              <Input
                id="seuil_max_kg"
                type="number"
                step="0.01"
                {...register("seuil_max_kg", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="actif"
              checked={watch("actif")}
              onCheckedChange={(checked) => setValue("actif", checked)}
            />
            <Label htmlFor="actif">Barème actif</Label>
          </div>

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
              {bareme ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
