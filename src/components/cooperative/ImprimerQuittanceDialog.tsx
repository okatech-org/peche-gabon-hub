import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuittanceData {
  id: string;
  numero_quittance: string;
  date_paiement: string;
  montant_total: number;
  mode_paiement: string;
  reference_paiement: string | null;
  notes: string | null;
  cooperative?: {
    nom: string;
    responsable: string;
    adresse: string;
  };
}

interface ImprimerQuittanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paiementId: string;
}

export function ImprimerQuittanceDialog({
  open,
  onOpenChange,
  paiementId
}: ImprimerQuittanceDialogProps) {
  const [loading, setLoading] = useState(true);
  const [quittance, setQuittance] = useState<QuittanceData | null>(null);

  useEffect(() => {
    if (open && paiementId) {
      loadQuittanceData();
    }
  }, [open, paiementId]);

  const loadQuittanceData = async () => {
    try {
      const { data, error } = await supabase
        .from("paiements_groupes_taxes")
        .select(`
          *,
          cooperative:cooperatives(nom, responsable, adresse)
        `)
        .eq("id", paiementId)
        .single();

      if (error) throw error;
      setQuittance(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("quittance-content");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`quittance-${quittance?.numero_quittance}.pdf`);
  };

  if (loading || !quittance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Reçu Officiel de Paiement</DialogTitle>
        </DialogHeader>

        <div id="quittance-content" className="bg-background p-8 space-y-6">
          {/* En-tête officiel */}
          <div className="text-center border-b-2 border-primary pb-4">
            <h1 className="text-2xl font-bold text-primary">RÉPUBLIQUE GABONAISE</h1>
            <p className="text-lg font-semibold mt-2">Ministère de la Pêche et de l'Aquaculture</p>
            <p className="text-sm text-muted-foreground">Direction Générale des Pêches Artisanales</p>
          </div>

          {/* Numéro de quittance */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Quittance N°</p>
            <p className="text-3xl font-bold text-primary">{quittance.numero_quittance}</p>
          </div>

          {/* Informations du paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date de paiement</p>
              <p className="font-semibold">
                {format(new Date(quittance.date_paiement), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode de paiement</p>
              <p className="font-semibold">
                {quittance.mode_paiement === 'especes' ? 'Espèces' :
                 quittance.mode_paiement === 'cheque' ? 'Chèque' :
                 quittance.mode_paiement === 'virement' ? 'Virement Bancaire' :
                 quittance.mode_paiement === 'mobile_money' ? 'Mobile Money' :
                 quittance.mode_paiement}
              </p>
            </div>
          </div>

          {/* Informations de la coopérative */}
          {quittance.cooperative && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-2">Payé par</h3>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Coopérative:</span> <strong>{quittance.cooperative.nom}</strong></p>
                <p><span className="text-muted-foreground">Responsable:</span> {quittance.cooperative.responsable}</p>
                {quittance.cooperative.adresse && (
                  <p><span className="text-muted-foreground">Adresse:</span> {quittance.cooperative.adresse}</p>
                )}
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="border-2 border-primary rounded-lg p-6 text-center bg-primary/5">
            <p className="text-sm text-muted-foreground mb-2">Montant Total Payé</p>
            <p className="text-4xl font-bold text-primary">{quittance.montant_total.toLocaleString()} FCFA</p>
          </div>

          {/* Référence et notes */}
          {(quittance.reference_paiement || quittance.notes) && (
            <div className="border-t pt-4 space-y-2">
              {quittance.reference_paiement && (
                <div>
                  <p className="text-sm text-muted-foreground">Référence de paiement</p>
                  <p className="font-mono">{quittance.reference_paiement}</p>
                </div>
              )}
              {quittance.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{quittance.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Pied de page */}
          <div className="border-t pt-4 mt-8 text-sm text-muted-foreground">
            <p className="text-center">
              Document officiel émis par le Ministère de la Pêche et de l'Aquaculture
            </p>
            <p className="text-center mt-1">
              Fait à Libreville, le {format(new Date(), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end print:hidden mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
