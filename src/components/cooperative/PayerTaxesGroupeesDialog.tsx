import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PayerTaxesGroupeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxesIds: string[];
  montantTotal: number;
  onSuccess: () => void;
}

export function PayerTaxesGroupeesDialog({
  open,
  onOpenChange,
  taxesIds,
  montantTotal,
  onSuccess
}: PayerTaxesGroupeesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mode_paiement: "",
    reference_paiement: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: cooperativeData } = await supabase
        .from("cooperatives")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!cooperativeData) throw new Error("Coopérative non trouvée");

      // Créer le paiement groupé
      const { data: paiementGroupe, error: paiementError } = await supabase
        .from("paiements_groupes_taxes")
        .insert({
          cooperative_id: cooperativeData.id,
          gestionnaire_id: user.id,
          montant_total: montantTotal,
          mode_paiement: formData.mode_paiement,
          reference_paiement: formData.reference_paiement || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (paiementError) throw paiementError;

      // Créer les détails pour chaque taxe
      const details = taxesIds.map(taxeId => ({
        paiement_groupe_id: paiementGroupe.id,
        taxe_capture_id: taxeId,
        montant_paye: 0, // Sera calculé depuis la taxe
      }));

      const { error: detailsError } = await supabase
        .from("paiements_taxes_detail")
        .insert(details);

      if (detailsError) throw detailsError;

      // Marquer les taxes comme payées
      const { error: updateError } = await supabase
        .from("taxes_captures")
        .update({
          statut_paiement: 'paye',
          date_paiement: new Date().toISOString(),
        })
        .in('id', taxesIds);

      if (updateError) throw updateError;

      toast.success("Paiement groupé enregistré avec succès");
      onSuccess();
      onOpenChange(false);
      setFormData({ mode_paiement: "", reference_paiement: "", notes: "" });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un Paiement Groupé</DialogTitle>
          <DialogDescription>
            {taxesIds.length} taxe(s) sélectionnée(s) - Total: {montantTotal.toLocaleString()} FCFA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mode de Paiement *</Label>
            <Select
              value={formData.mode_paiement}
              onValueChange={(value) => setFormData({ ...formData, mode_paiement: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="virement">Virement Bancaire</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Référence de Paiement</Label>
            <Input
              value={formData.reference_paiement}
              onChange={(e) => setFormData({ ...formData, reference_paiement: e.target.value })}
              placeholder="N° de chèque, transaction, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer le Paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
