import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPDFButtonProps {
  elementId?: string;
  filename?: string;
  filters?: {
    annee: string;
    mois: string;
    province: string;
    typePeche: string;
  };
}

const ExportPDFButton = ({ 
  elementId = "main-content", 
  filename = "rapport-ministre", 
  filters 
}: ExportPDFButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Get the element to export
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Élément non trouvé");
      }

      toast.info("Génération du PDF en cours...");

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Calculate PDF dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add header with confidential stamp and filters
      pdf.setFontSize(10);
      pdf.setTextColor(220, 38, 38); // red
      pdf.text("CONFIDENTIEL - PÊCHE GABON", 105, 10, { align: "center" });
      
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      const date = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Généré le: ${date}`, 105, 15, { align: "center" });

      // Add filters info if provided
      if (filters) {
        const filterText = `Filtres: Année ${filters.annee} | Mois: ${filters.mois === 'tous' ? 'Tous' : filters.mois} | Province: ${filters.province === 'tous' ? 'Toutes' : filters.province} | Type: ${filters.typePeche === 'tous' ? 'Tous' : filters.typePeche}`;
        pdf.text(filterText, 105, 20, { align: "center" });
      }

      // Add first page
      pdf.addImage(imgData, "PNG", 0, 25, imgWidth, imgHeight);
      heightLeft -= pageHeight - 25;

      // Add more pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${filename}-${timestamp}.pdf`);

      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de l'export du PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={exporting}
      variant="outline"
      className="gap-2"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Export en cours...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Exporter PDF
        </>
      )}
    </Button>
  );
};

export default ExportPDFButton;
