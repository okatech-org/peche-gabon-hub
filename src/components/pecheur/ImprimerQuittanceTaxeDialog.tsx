import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ImprimerQuittanceTaxeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quittanceNumero: string;
  taxesIds: string[];
  montantTotal: number;
}

interface TaxeDetail {
  id: string;
  poids_taxable_kg: number;
  montant_taxe: number;
  espece: { nom: string } | null;
  bareme: { nom: string } | null;
}

export function ImprimerQuittanceTaxeDialog({
  open,
  onOpenChange,
  quittanceNumero,
  taxesIds,
  montantTotal,
}: ImprimerQuittanceTaxeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState<TaxeDetail[]>([]);
  const [pecheurInfo, setPecheurInfo] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, taxesIds]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les informations du profil utilisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setPecheurInfo(profile || {
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
      });

      // Charger les détails des taxes
      const { data: taxesData } = await supabase
        .from("taxes_captures")
        .select("id, poids_taxable_kg, montant_taxe, espece:especes(nom), bareme:bareme_taxes(nom)")
        .in("id", taxesIds);

      setTaxes(taxesData as any || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
  };

  const genererQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Erreur génération QR:", error);
      return "";
    }
  };

  const genererPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const dateNow = new Date();

      // En-tête
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RÉPUBLIQUE GABONAISE", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Ministère de la Pêche et de l'Aquaculture", pageWidth / 2, 28, { align: "center" });
      
      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);

      // Titre
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("QUITTANCE DE PAIEMENT", pageWidth / 2, 45, { align: "center" });

      // Numéro de quittance
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`N° ${quittanceNumero}`, pageWidth / 2, 55, { align: "center" });

      // Informations du pêcheur
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let yPos = 70;

      if (pecheurInfo) {
        doc.text("Bénéficiaire:", 20, yPos);
        doc.setFont("helvetica", "bold");
        const nom = `${pecheurInfo.first_name || ""} ${pecheurInfo.last_name || ""}`.trim() || "N/A";
        doc.text(nom, 60, yPos);
        
        yPos += 8;
        doc.setFont("helvetica", "normal");
        if (pecheurInfo.phone) {
          doc.text("Téléphone:", 20, yPos);
          doc.text(pecheurInfo.phone, 60, yPos);
          yPos += 8;
        }
        if (pecheurInfo.email) {
          doc.text("Email:", 20, yPos);
          doc.text(pecheurInfo.email, 60, yPos);
          yPos += 8;
        }
      }

      doc.text("Date de paiement:", 20, yPos);
      doc.text(format(dateNow, "dd MMMM yyyy 'à' HH:mm", { locale: fr }), 60, yPos);
      
      yPos += 15;
      
      // Tableau des taxes
      doc.setFont("helvetica", "bold");
      doc.text("Détail des taxes payées:", 20, yPos);
      yPos += 8;

      // En-têtes du tableau
      doc.setFontSize(10);
      const colWidths = [80, 35, 35];
      const headers = ["Espèce / Barème", "Poids (kg)", "Montant (FCFA)"];
      let xPos = 20;
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      
      yPos += 2;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 6;

      // Lignes du tableau
      doc.setFont("helvetica", "normal");
      taxes.forEach((taxe) => {
        xPos = 20;
        const especeNom = taxe.espece?.nom || "N/A";
        const baremeNom = taxe.bareme?.nom || "";
        const ligne1 = especeNom;
        const ligne2 = baremeNom ? `(${baremeNom})` : "";
        
        doc.text(ligne1, xPos, yPos);
        if (ligne2) {
          doc.setFontSize(8);
          doc.text(ligne2, xPos, yPos + 4);
          doc.setFontSize(10);
        }
        
        xPos += colWidths[0];
        doc.text(taxe.poids_taxable_kg.toFixed(2), xPos, yPos);
        
        xPos += colWidths[1];
        doc.text(taxe.montant_taxe.toLocaleString(), xPos, yPos);
        
        yPos += ligne2 ? 10 : 8;
      });

      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      // Total
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("MONTANT TOTAL:", 20, yPos);
      doc.text(`${montantTotal.toLocaleString()} FCFA`, pageWidth - 20, yPos, { align: "right" });

      yPos += 15;

      // QR Code pour vérification
      const qrData = JSON.stringify({
        numero: quittanceNumero,
        montant: montantTotal,
        date: dateNow.toISOString(),
        taxes: taxesIds,
      });
      
      const qrCodeDataUrl = await genererQRCode(qrData);
      
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, "PNG", pageWidth / 2 - 25, yPos, 50, 50);
        yPos += 55;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Scanner ce QR code pour vérifier l'authenticité", pageWidth / 2, yPos, { align: "center" });
      }

      // Pied de page
      yPos = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Ce document est une quittance officielle de paiement de taxes de pêche.", pageWidth / 2, yPos, { align: "center" });
      doc.text("Conservez ce document comme preuve de paiement.", pageWidth / 2, yPos + 5, { align: "center" });
      doc.text(`Document généré le ${format(dateNow, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, pageWidth / 2, yPos + 10, { align: "center" });

      // Sauvegarder le PDF
      doc.save(`Quittance_${quittanceNumero}.pdf`);
      toast.success("Quittance téléchargée avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  const imprimerQuittance = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const dateNow = new Date();

      // Même contenu que genererPDF
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RÉPUBLIQUE GABONAISE", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Ministère de la Pêche et de l'Aquaculture", pageWidth / 2, 28, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("QUITTANCE DE PAIEMENT", pageWidth / 2, 45, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`N° ${quittanceNumero}`, pageWidth / 2, 55, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let yPos = 70;

      if (pecheurInfo) {
        doc.text("Bénéficiaire:", 20, yPos);
        doc.setFont("helvetica", "bold");
        const nom = `${pecheurInfo.first_name || ""} ${pecheurInfo.last_name || ""}`.trim() || "N/A";
        doc.text(nom, 60, yPos);
        
        yPos += 8;
        doc.setFont("helvetica", "normal");
        if (pecheurInfo.phone) {
          doc.text("Téléphone:", 20, yPos);
          doc.text(pecheurInfo.phone, 60, yPos);
          yPos += 8;
        }
        if (pecheurInfo.email) {
          doc.text("Email:", 20, yPos);
          doc.text(pecheurInfo.email, 60, yPos);
          yPos += 8;
        }
      }

      doc.text("Date de paiement:", 20, yPos);
      doc.text(format(dateNow, "dd MMMM yyyy 'à' HH:mm", { locale: fr }), 60, yPos);
      
      yPos += 15;
      
      doc.setFont("helvetica", "bold");
      doc.text("Détail des taxes payées:", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      const colWidths = [80, 35, 35];
      const headers = ["Espèce / Barème", "Poids (kg)", "Montant (FCFA)"];
      let xPos = 20;
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      
      yPos += 2;
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      taxes.forEach((taxe) => {
        xPos = 20;
        const especeNom = taxe.espece?.nom || "N/A";
        const baremeNom = taxe.bareme?.nom || "";
        const ligne1 = especeNom;
        const ligne2 = baremeNom ? `(${baremeNom})` : "";
        
        doc.text(ligne1, xPos, yPos);
        if (ligne2) {
          doc.setFontSize(8);
          doc.text(ligne2, xPos, yPos + 4);
          doc.setFontSize(10);
        }
        
        xPos += colWidths[0];
        doc.text(taxe.poids_taxable_kg.toFixed(2), xPos, yPos);
        
        xPos += colWidths[1];
        doc.text(taxe.montant_taxe.toLocaleString(), xPos, yPos);
        
        yPos += ligne2 ? 10 : 8;
      });

      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("MONTANT TOTAL:", 20, yPos);
      doc.text(`${montantTotal.toLocaleString()} FCFA`, pageWidth - 20, yPos, { align: "right" });

      yPos += 15;

      const qrData = JSON.stringify({
        numero: quittanceNumero,
        montant: montantTotal,
        date: dateNow.toISOString(),
        taxes: taxesIds,
      });
      
      const qrCodeDataUrl = await genererQRCode(qrData);
      
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, "PNG", pageWidth / 2 - 25, yPos, 50, 50);
        yPos += 55;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Scanner ce QR code pour vérifier l'authenticité", pageWidth / 2, yPos, { align: "center" });
      }

      yPos = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Ce document est une quittance officielle de paiement de taxes de pêche.", pageWidth / 2, yPos, { align: "center" });
      doc.text("Conservez ce document comme preuve de paiement.", pageWidth / 2, yPos + 5, { align: "center" });
      doc.text(`Document généré le ${format(dateNow, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, pageWidth / 2, yPos + 10, { align: "center" });

      // Ouvrir dans une nouvelle fenêtre pour impression
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success("Fenêtre d'impression ouverte");
    } catch (error) {
      console.error("Erreur impression:", error);
      toast.error("Erreur lors de l'impression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quittance de paiement</DialogTitle>
          <DialogDescription>
            Téléchargez ou imprimez votre quittance de paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Numéro:</span>
              <span className="font-mono font-semibold">{quittanceNumero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Montant total:</span>
              <span className="font-semibold">{montantTotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nombre de taxes:</span>
              <span>{taxesIds.length}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={genererPDF}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </>
              )}
            </Button>

            <Button
              onClick={imprimerQuittance}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Préparation...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            La quittance inclut un QR code pour vérification d'authenticité
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
