import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Smartphone, Banknote, CheckCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImprimerQuittanceTaxeDialog } from "./ImprimerQuittanceTaxeDialog";

interface PayerTaxeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxesIds: string[];
  montantTotal: number;
  onSuccess: (paidIds?: string[], quittanceNumero?: string) => void;
}

export function PayerTaxeDialog({ open, onOpenChange, taxesIds, montantTotal, onSuccess }: PayerTaxeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [quittanceNumero, setQuittanceNumero] = useState("");
  const [showQuittanceDialog, setShowQuittanceDialog] = useState(false);
  const [modePaiement, setModePaiement] = useState<"carte" | "airtel" | "especes">("carte");
  const [numeroTelephone, setNumeroTelephone] = useState("");
  const [numeroCarte, setNumeroCarte] = useState("");
  const [cvv, setCvv] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validation selon le mode de paiement
    if (modePaiement === "airtel" && !numeroTelephone) {
      toast.error("Veuillez entrer votre numéro Airtel Money");
      return;
    }

    if (modePaiement === "carte") {
      if (!numeroCarte || !cvv || !dateExpiration) {
        toast.error("Veuillez remplir tous les champs de la carte");
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Générer un numéro de quittance unique
      const numeroQuittance = `QT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      setQuittanceNumero(numeroQuittance);
      
      // Mettre à jour les taxes (mode démo)
      const { error } = await supabase
        .from("taxes_captures")
        .update({
          statut_paiement: "paye",
          date_paiement: new Date().toISOString(),
          quittance_numero: numeroQuittance,
          mode_paiement: modePaiement,
        })
        .in("id", taxesIds);

      if (error) throw error;

      setPaymentSuccess(true);
      toast.success("Paiement effectué avec succès !", {
        description: `Quittance N° ${numeroQuittance}`,
      });

      // Informer immédiatement le parent pour MAJ optimiste
      onSuccess?.(taxesIds, numeroQuittance);

    } catch (error) {
      console.error("Erreur paiement:", error);
      toast.error("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModePaiement("carte");
    setNumeroTelephone("");
    setNumeroCarte("");
    setCvv("");
    setDateExpiration("");
  };

  if (paymentSuccess) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Paiement réussi !</h3>
                <p className="text-muted-foreground">
                  Votre paiement de {montantTotal.toLocaleString()} FCFA a été effectué avec succès.
                </p>
                <p className="text-sm font-mono text-foreground">
                  Quittance N° {quittanceNumero}
                </p>
              </div>
              <div className="flex gap-2 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentSuccess(false);
                    onOpenChange(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setShowQuittanceDialog(true);
                  }}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ImprimerQuittanceTaxeDialog
          open={showQuittanceDialog}
          onOpenChange={(open) => {
            setShowQuittanceDialog(open);
            if (!open) {
              setPaymentSuccess(false);
              onOpenChange(false);
              resetForm();
            }
          }}
          quittanceNumero={quittanceNumero}
          taxesIds={taxesIds}
          montantTotal={montantTotal}
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payer mes taxes (Mode Démo)</DialogTitle>
          <DialogDescription>
            Montant à payer : <span className="font-semibold text-foreground">{montantTotal.toLocaleString()} FCFA</span>
            <br />
            {taxesIds.length} taxe{taxesIds.length > 1 ? "s" : ""} sélectionnée{taxesIds.length > 1 ? "s" : ""}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">Le paiement sera validé automatiquement en mode démo</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <RadioGroup value={modePaiement} onValueChange={(value: any) => setModePaiement(value)}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="carte" id="carte" />
                <Label htmlFor="carte" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  Carte Bancaire
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="airtel" id="airtel" />
                <Label htmlFor="airtel" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" />
                  Airtel Money
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="especes" id="especes" />
                <Label htmlFor="especes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4" />
                  Espèces
                </Label>
              </div>
            </RadioGroup>
          </div>

          {modePaiement === "airtel" && (
            <div className="space-y-2">
              <Label htmlFor="telephone">Numéro Airtel Money</Label>
              <Input
                id="telephone"
                placeholder="Ex: 07 XX XX XX XX"
                value={numeroTelephone}
                onChange={(e) => setNumeroTelephone(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Vous recevrez une notification pour valider le paiement
              </p>
            </div>
          )}

          {modePaiement === "carte" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="numeroCarte">Numéro de carte</Label>
                <Input
                  id="numeroCarte"
                  placeholder="1234 5678 9012 3456"
                  value={numeroCarte}
                  onChange={(e) => setNumeroCarte(e.target.value)}
                  maxLength={19}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiration">Date d'expiration</Label>
                  <Input
                    id="expiration"
                    placeholder="MM/AA"
                    value={dateExpiration}
                    onChange={(e) => setDateExpiration(e.target.value)}
                    maxLength={5}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={3}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {modePaiement === "especes" && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Veuillez vous présenter au bureau de la coopérative avec le montant exact pour finaliser le paiement.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>Payer {montantTotal.toLocaleString()} FCFA</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
