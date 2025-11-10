import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExportRemonteesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remontees: any[];
  filtresActifs: string;
}

interface ExportOptions {
  format: "pdf" | "excel";
  includeAttachments: boolean;
  includeComments: boolean;
  includeStats: boolean;
  columns: {
    numero: boolean;
    titre: boolean;
    type: boolean;
    statut: boolean;
    priorite: boolean;
    localisation: boolean;
    date: boolean;
    description: boolean;
  };
  orientation: "portrait" | "landscape";
  titre: string;
}

const typeLabels: Record<string, string> = {
  reclamation: "Réclamation",
  suggestion: "Suggestion",
  denonciation: "Dénonciation",
  article_presse: "Article de Presse",
  commentaire_reseaux: "Commentaire Réseaux",
  avis_reseaux: "Avis Réseaux",
};

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  rejete: "Rejeté",
};

export function ExportRemonteesDialog({
  open,
  onOpenChange,
  remontees,
  filtresActifs,
}: ExportRemonteesDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: "pdf",
    includeAttachments: false,
    includeComments: true,
    includeStats: true,
    columns: {
      numero: true,
      titre: true,
      type: true,
      statut: true,
      priorite: true,
      localisation: true,
      date: true,
      description: true,
    },
    orientation: "landscape",
    titre: `Export Remontées - ${format(new Date(), "dd/MM/yyyy")}`,
  });

  const updateColumn = (column: keyof ExportOptions["columns"], value: boolean) => {
    setOptions({
      ...options,
      columns: { ...options.columns, [column]: value },
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: options.orientation,
      unit: "mm",
      format: "a4",
    });

    // En-tête
    doc.setFontSize(16);
    doc.text(options.titre, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Date d'export: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}`, 14, 22);
    
    if (filtresActifs) {
      doc.setFontSize(9);
      doc.text(`Filtres appliqués: ${filtresActifs}`, 14, 28);
    }

    // Statistiques
    if (options.includeStats) {
      const stats = {
        total: remontees.length,
        nouveau: remontees.filter((r) => r.statut === "nouveau").length,
        en_cours: remontees.filter((r) => r.statut === "en_cours").length,
        traite: remontees.filter((r) => r.statut === "traite").length,
      };

      const yPos = filtresActifs ? 35 : 30;
      doc.setFontSize(10);
      doc.text("Statistiques:", 14, yPos);
      doc.setFontSize(9);
      doc.text(
        `Total: ${stats.total} | Nouveaux: ${stats.nouveau} | En cours: ${stats.en_cours} | Traités: ${stats.traite}`,
        14,
        yPos + 5
      );
    }

    // Préparer les colonnes et données
    const columns: any[] = [];
    const columnKeys: string[] = [];

    if (options.columns.numero) {
      columns.push("N° Référence");
      columnKeys.push("numero_reference");
    }
    if (options.columns.titre) {
      columns.push("Titre");
      columnKeys.push("titre");
    }
    if (options.columns.type) {
      columns.push("Type");
      columnKeys.push("type_remontee");
    }
    if (options.columns.statut) {
      columns.push("Statut");
      columnKeys.push("statut");
    }
    if (options.columns.priorite) {
      columns.push("Priorité");
      columnKeys.push("niveau_priorite");
    }
    if (options.columns.localisation) {
      columns.push("Localisation");
      columnKeys.push("localisation");
    }
    if (options.columns.date) {
      columns.push("Date");
      columnKeys.push("created_at");
    }
    if (options.columns.description) {
      columns.push("Description");
      columnKeys.push("description");
    }

    const rows = remontees.map((r) => {
      return columnKeys.map((key) => {
        if (key === "type_remontee") return typeLabels[r[key]] || r[key];
        if (key === "statut") return statusLabels[r[key]] || r[key];
        if (key === "created_at")
          return format(new Date(r[key]), "dd/MM/yyyy", { locale: fr });
        if (key === "description" && r[key])
          return r[key].length > 100 ? r[key].substring(0, 100) + "..." : r[key];
        return r[key] || "-";
      });
    });

    // Tableau
    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: options.includeStats ? (filtresActifs ? 45 : 40) : (filtresActifs ? 35 : 30),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, right: 14, bottom: 10, left: 14 },
    });

    // Pied de page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    return doc;
  };

  const generateExcel = () => {
    const worksheetData: any[] = [];

    // En-tête
    worksheetData.push([options.titre]);
    worksheetData.push([`Date d'export: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}`]);
    
    if (filtresActifs) {
      worksheetData.push([`Filtres: ${filtresActifs}`]);
    }

    worksheetData.push([]);

    // Statistiques
    if (options.includeStats) {
      const stats = {
        total: remontees.length,
        nouveau: remontees.filter((r) => r.statut === "nouveau").length,
        en_cours: remontees.filter((r) => r.statut === "en_cours").length,
        traite: remontees.filter((r) => r.statut === "traite").length,
      };

      worksheetData.push(["STATISTIQUES"]);
      worksheetData.push(["Total", stats.total]);
      worksheetData.push(["Nouveaux", stats.nouveau]);
      worksheetData.push(["En cours", stats.en_cours]);
      worksheetData.push(["Traités", stats.traite]);
      worksheetData.push([]);
    }

    // Préparer les colonnes
    const headers: string[] = [];
    const columnKeys: string[] = [];

    if (options.columns.numero) {
      headers.push("N° Référence");
      columnKeys.push("numero_reference");
    }
    if (options.columns.titre) {
      headers.push("Titre");
      columnKeys.push("titre");
    }
    if (options.columns.type) {
      headers.push("Type");
      columnKeys.push("type_remontee");
    }
    if (options.columns.statut) {
      headers.push("Statut");
      columnKeys.push("statut");
    }
    if (options.columns.priorite) {
      headers.push("Priorité");
      columnKeys.push("niveau_priorite");
    }
    if (options.columns.localisation) {
      headers.push("Localisation");
      columnKeys.push("localisation");
    }
    if (options.columns.date) {
      headers.push("Date");
      columnKeys.push("created_at");
    }
    if (options.columns.description) {
      headers.push("Description");
      columnKeys.push("description");
    }

    worksheetData.push(headers);

    // Données
    remontees.forEach((r) => {
      const row = columnKeys.map((key) => {
        if (key === "type_remontee") return typeLabels[r[key]] || r[key];
        if (key === "statut") return statusLabels[r[key]] || r[key];
        if (key === "created_at")
          return format(new Date(r[key]), "dd/MM/yyyy", { locale: fr });
        return r[key] || "-";
      });
      worksheetData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Remontées");

    return wb;
  };

  const handleExport = async () => {
    if (remontees.length === 0) {
      toast.error("Aucune remontée à exporter");
      return;
    }

    setExporting(true);

    try {
      if (options.format === "pdf") {
        const doc = generatePDF();
        doc.save(`remontees_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
        toast.success("Export PDF généré avec succès");
      } else {
        const wb = generateExcel();
        XLSX.writeFile(wb, `remontees_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
        toast.success("Export Excel généré avec succès");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de la génération de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exporter les remontées</DialogTitle>
          <DialogDescription>
            Personnalisez votre export ({remontees.length} remontée(s) sélectionnée(s))
          </DialogDescription>
        </DialogHeader>

        <Tabs value={options.format} onValueChange={(v) => setOptions({ ...options, format: v as any })}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="excel">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Titre du document</Label>
              <Input
                value={options.titre}
                onChange={(e) => setOptions({ ...options, titre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <RadioGroup
                value={options.orientation}
                onValueChange={(v) => setOptions({ ...options, orientation: v as any })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait">Portrait</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape">Paysage</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Titre du document</Label>
              <Input
                value={options.titre}
                onChange={(e) => setOptions({ ...options, titre: e.target.value })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Options d'export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stats"
                  checked={options.includeStats}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeStats: checked as boolean })
                  }
                />
                <Label htmlFor="stats" className="cursor-pointer">
                  Inclure les statistiques
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={options.includeComments}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeComments: checked as boolean })
                  }
                />
                <Label htmlFor="comments" className="cursor-pointer">
                  Inclure les commentaires
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-base font-semibold mb-3 block">Colonnes à exporter</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="numero"
                  checked={options.columns.numero}
                  onCheckedChange={(checked) => updateColumn("numero", checked as boolean)}
                />
                <Label htmlFor="numero" className="cursor-pointer">
                  N° Référence
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="titre"
                  checked={options.columns.titre}
                  onCheckedChange={(checked) => updateColumn("titre", checked as boolean)}
                />
                <Label htmlFor="titre" className="cursor-pointer">
                  Titre
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type"
                  checked={options.columns.type}
                  onCheckedChange={(checked) => updateColumn("type", checked as boolean)}
                />
                <Label htmlFor="type" className="cursor-pointer">
                  Type
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statut"
                  checked={options.columns.statut}
                  onCheckedChange={(checked) => updateColumn("statut", checked as boolean)}
                />
                <Label htmlFor="statut" className="cursor-pointer">
                  Statut
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="priorite"
                  checked={options.columns.priorite}
                  onCheckedChange={(checked) => updateColumn("priorite", checked as boolean)}
                />
                <Label htmlFor="priorite" className="cursor-pointer">
                  Priorité
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="localisation"
                  checked={options.columns.localisation}
                  onCheckedChange={(checked) => updateColumn("localisation", checked as boolean)}
                />
                <Label htmlFor="localisation" className="cursor-pointer">
                  Localisation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="date"
                  checked={options.columns.date}
                  onCheckedChange={(checked) => updateColumn("date", checked as boolean)}
                />
                <Label htmlFor="date" className="cursor-pointer">
                  Date
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="description"
                  checked={options.columns.description}
                  onCheckedChange={(checked) => updateColumn("description", checked as boolean)}
                />
                <Label htmlFor="description" className="cursor-pointer">
                  Description
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                {options.format === "pdf" ? (
                  <FileDown className="h-4 w-4 mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
