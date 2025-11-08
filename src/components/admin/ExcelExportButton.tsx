import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, prepareExportData } from "@/lib/excelExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExcelExportButtonProps {
  data: {
    kpis?: any[];
    monthlyData?: any[];
    previsionsData?: any[];
    rawData?: {
      quittances?: any[];
      exportations?: any[];
      taxes?: any[];
      demandes?: any[];
    };
  };
  filename?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ExcelExportButton = ({
  data,
  filename = "export_finances_peche_gabon.xlsx",
  variant = "default",
  size = "default",
  className = "",
}: ExcelExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (exportType: 'full' | 'summary' | 'raw') => {
    setIsExporting(true);
    
    try {
      let exportData;
      let exportFilename = filename;

      switch (exportType) {
        case 'summary':
          // Export only KPIs and summary statistics
          exportData = prepareExportData(
            data.kpis || [],
            data.monthlyData || [],
            data.previsionsData || [],
            undefined
          );
          exportFilename = filename.replace('.xlsx', '_resume.xlsx');
          break;
        
        case 'raw':
          // Export only raw data
          exportData = prepareExportData(
            [],
            [],
            [],
            data.rawData
          );
          exportFilename = filename.replace('.xlsx', '_donnees_brutes.xlsx');
          break;
        
        case 'full':
        default:
          // Export everything
          exportData = prepareExportData(
            data.kpis || [],
            data.monthlyData || [],
            data.previsionsData || [],
            data.rawData
          );
          exportFilename = filename.replace('.xlsx', '_complet.xlsx');
          break;
      }

      await exportToExcel(exportData, exportFilename);
      
      toast({
        title: "Export réussi",
        description: `Le fichier ${exportFilename} a été téléchargé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export Excel.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter Excel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Options d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('full')}>
          <Download className="mr-2 h-4 w-4" />
          Export Complet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('summary')}>
          <Download className="mr-2 h-4 w-4" />
          Résumé (KPIs uniquement)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('raw')}>
          <Download className="mr-2 h-4 w-4" />
          Données Brutes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
