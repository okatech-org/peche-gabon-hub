import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ImprimerQuittanceLicenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quittance: any;
}

export function ImprimerQuittanceLicenceDialog({
  open,
  onOpenChange,
  quittance
}: ImprimerQuittanceLicenceDialogProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("quittance-licence-content");
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
    pdf.save(`quittance-${quittance.numero_quittance || quittance.id}.pdf`);
  };

  if (!quittance) return null;

  const getMoisLabel = (mois: number) => {
    const moisLabels = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return moisLabels[mois - 1] || mois;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>Reçu Officiel - Quittance de Licence</DialogTitle>
        </DialogHeader>

        <div id="quittance-licence-content" className="bg-background p-8 space-y-6">
          {/* En-tête officiel */}
          <div className="text-center border-b-2 border-primary pb-4">
            <h1 className="text-2xl font-bold text-primary">RÉPUBLIQUE GABONAISE</h1>
            <p className="text-lg font-semibold mt-2">Ministère de la Pêche et de l'Aquaculture</p>
            <p className="text-sm text-muted-foreground">Direction Générale des Pêches Artisanales</p>
          </div>

          {/* Type de document */}
          <div className="text-center">
            <h2 className="text-xl font-bold">QUITTANCE DE PAIEMENT</h2>
            <p className="text-sm text-muted-foreground mt-1">Paiement mensuel de licence de pêche</p>
          </div>

          {/* Numéro de quittance si disponible */}
          {quittance.numero_quittance && (
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Quittance N°</p>
              <p className="text-2xl font-bold text-primary">{quittance.numero_quittance}</p>
            </div>
          )}

          {/* Informations de la licence */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">Informations de la Licence</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Licence</p>
                <p className="font-semibold">{quittance.licences?.numero || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Année</p>
                <p className="font-semibold">{quittance.annee}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pirogue</p>
                <p className="font-semibold">{quittance.licences?.pirogues?.nom || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Immatriculation</p>
                <p className="font-semibold">{quittance.licences?.pirogues?.immatriculation || "N/A"}</p>
              </div>
            </div>
            {quittance.licences?.pirogues?.proprietaires && (
              <div>
                <p className="text-sm text-muted-foreground">Propriétaire</p>
                <p className="font-semibold">
                  {quittance.licences.pirogues.proprietaires.prenom} {quittance.licences.pirogues.proprietaires.nom}
                </p>
              </div>
            )}
          </div>

          {/* Informations du paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Période</p>
              <p className="font-semibold">{getMoisLabel(quittance.mois)} {quittance.annee}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date d'échéance</p>
              <p className="font-semibold">
                {format(new Date(quittance.date_echeance), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            {quittance.date_paiement && (
              <div>
                <p className="text-sm text-muted-foreground">Date de paiement</p>
                <p className="font-semibold">
                  {format(new Date(quittance.date_paiement), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            )}
            {quittance.mode_paiement && (
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
            )}
          </div>

          {/* Montant */}
          <div className="border-2 border-primary rounded-lg p-6 text-center bg-primary/5">
            <p className="text-sm text-muted-foreground mb-2">Montant à Payer / Payé</p>
            <p className="text-4xl font-bold text-primary">{quittance.montant.toLocaleString()} FCFA</p>
          </div>

          {/* Statut */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Statut du Paiement</p>
            <div className="inline-flex">
              {quittance.statut === 'paye' ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                  ✓ PAYÉ
                </span>
              ) : quittance.statut === 'en_attente' ? (
                <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                  EN ATTENTE
                </span>
              ) : (
                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
                  IMPAYÉ
                </span>
              )}
            </div>
          </div>

          {/* Référence et observations */}
          {(quittance.reference_paiement || quittance.observations) && (
            <div className="border-t pt-4 space-y-2">
              {quittance.reference_paiement && (
                <div>
                  <p className="text-sm text-muted-foreground">Référence de paiement</p>
                  <p className="font-mono">{quittance.reference_paiement}</p>
                </div>
              )}
              {quittance.observations && (
                <div>
                  <p className="text-sm text-muted-foreground">Observations</p>
                  <p className="text-sm">{quittance.observations}</p>
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
            <p className="text-center mt-2 text-xs">
              Cette quittance constitue une preuve de paiement officielle
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
