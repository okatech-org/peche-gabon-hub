import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileSpreadsheet, FileText, Calendar, Filter, FileCheck } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ExcelExportButton } from "./ExcelExportButton";
import { ScheduledExportsManagement } from "./ScheduledExportsManagement";
import { useCSVData } from "@/hooks/useCSVData";
import { ExportPreviewDialog } from "./ExportPreviewDialog";

interface ExportTemplate {
  id: string;
  nom: string;
  description: string;
  tables: string[];
  colonnes: { [table: string]: string[] };
  filtresDefaut: any;
}

const templates: ExportTemplate[] = [
  {
    id: "rapport-mensuel",
    nom: "Rapport Mensuel Complet",
    description: "Quittances, paiements et statistiques du mois",
    tables: ["quittances", "licences"],
    colonnes: {
      quittances: ["numero_quittance", "mois", "annee", "montant", "statut", "date_echeance", "date_paiement"],
      licences: ["numero", "annee", "montant_total", "statut"]
    },
    filtresDefaut: { periode: "mois-courant" }
  },
  {
    id: "rapport-annuel",
    nom: "Rapport Annuel Consolidé",
    description: "Synthèse financière annuelle complète",
    tables: ["quittances", "licences", "taxes_calculees"],
    colonnes: {
      quittances: ["numero_quittance", "mois", "annee", "montant", "statut", "date_paiement"],
      licences: ["numero", "annee", "montant_total", "statut", "date_debut", "date_fin"],
      taxes_calculees: ["montant_taxe", "poids_taxable_kg", "statut_paiement"]
    },
    filtresDefaut: { periode: "annee-courante" }
  },
  {
    id: "rapport-cooperatives",
    nom: "Rapport par Coopérative",
    description: "Détail des paiements par coopérative",
    tables: ["quittances", "licences", "pirogues", "cooperatives"],
    colonnes: {
      quittances: ["numero_quittance", "mois", "annee", "montant", "statut"],
      licences: ["numero", "montant_total", "statut"],
      pirogues: ["matricule", "nom"],
      cooperatives: ["nom", "responsable"]
    },
    filtresDefaut: { periode: "annee-courante", groupBy: "cooperative" }
  },
  {
    id: "rapport-retards",
    nom: "Rapport des Retards de Paiement",
    description: "Quittances en retard avec détails",
    tables: ["quittances", "licences", "pirogues"],
    colonnes: {
      quittances: ["numero_quittance", "mois", "annee", "montant", "date_echeance", "jours_retard"],
      licences: ["numero", "montant_total"],
      pirogues: ["matricule", "nom", "proprietaire"]
    },
    filtresDefaut: { statut: "en_retard" }
  },
  {
    id: "previsions-export",
    nom: "Prévisions et Historique",
    description: "Export des prévisions et comparaisons",
    tables: ["previsions_history", "model_performance"],
    colonnes: {
      previsions_history: ["version_date", "mois_prevu", "annee_prevu", "montant_prevu", "taux_prevu", "recouvrement_prevu"],
      model_performance: ["evaluation_date", "mape", "precision", "bias"]
    },
    filtresDefaut: { periode: "6-mois" }
  },
  {
    id: "taxes-remontees",
    nom: "Taxes et Remontées Institutionnelles",
    description: "Détail des taxes calculées et remontées",
    tables: ["taxes_calculees", "remontees_effectives", "repartition_institutionnelle"],
    colonnes: {
      taxes_calculees: ["montant_taxe", "poids_taxable_kg", "statut_paiement", "date_paiement"],
      remontees_effectives: ["montant_remonte", "date_remontee", "statut"],
      repartition_institutionnelle: ["institution", "pourcentage", "montant_attribue"]
    },
    filtresDefaut: { periode: "trimestre-courant" }
  }
];

export const FinancialExportDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Filtres avancés
  const [filtreStatut, setFiltreStatut] = useState<string>("tous");
  const [filtreCooperative, setFiltreCooperative] = useState<string>("toutes");
  const [filtreMontantMin, setFiltreMontantMin] = useState<string>("");
  const [filtreMontantMax, setFiltreMontantMax] = useState<string>("");

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSelectedTables(template.tables);
      
      // Appliquer les filtres par défaut
      if (template.filtresDefaut.periode === "mois-courant") {
        const now = new Date();
        setDateDebut(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
        setDateFin(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
      } else if (template.filtresDefaut.periode === "annee-courante") {
        const now = new Date();
        setDateDebut(`${now.getFullYear()}-01-01`);
        setDateFin(`${now.getFullYear()}-12-31`);
      }
      
      if (template.filtresDefaut.statut) {
        setFiltreStatut(template.filtresDefaut.statut);
      }
    }
  };

  const buildQuery = async (tableName: string) => {
    const template = templates.find(t => t.id === selectedTemplate);
    const colonnes = template?.colonnes[tableName] || ["*"];
    
    let query: any = (supabase as any).from(tableName).select(colonnes.join(", "));

    // Appliquer les filtres de date selon la table
    if (dateDebut && dateFin) {
      if (tableName === "quittances") {
        query = query.gte("date_echeance", dateDebut).lte("date_echeance", dateFin);
      } else if (tableName === "licences") {
        query = query.gte("date_debut", dateDebut).lte("date_fin", dateFin);
      } else if (tableName === "taxes_calculees") {
        query = query.gte("date_calcul", dateDebut).lte("date_calcul", dateFin);
      }
    }

    // Filtres de statut
    if (filtreStatut !== "tous") {
      query = query.eq("statut", filtreStatut);
    }

    // Filtres de montant
    if (filtreMontantMin && tableName === "quittances") {
      query = query.gte("montant", parseFloat(filtreMontantMin));
    }
    if (filtreMontantMax && tableName === "quittances") {
      query = query.lte("montant", parseFloat(filtreMontantMax));
    }

    query = query.order("created_at", { ascending: false }).limit(1000);

    return query;
  };

  const handlePreview = async () => {
    if (!selectedTemplate || selectedTables.length === 0) {
      toast.error("Veuillez sélectionner un template");
      return;
    }

    setLoading(true);
    
    try {
      const results: any = {};
      
      for (const table of selectedTables) {
        const query = await buildQuery(table);
        const { data, error } = await query;
        
        if (error) throw error;
        results[table] = data || [];
      }
      
      setPreviewData(results);
      setShowPreview(true);
      toast.success(`Prévisualisation chargée: ${Object.values(results).flat().length} lignes`);
    } catch (error: any) {
      console.error("Error loading preview:", error);
      toast.error("Erreur lors du chargement de la prévisualisation");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!previewData) {
      toast.error("Veuillez d'abord prévisualiser les données");
      return;
    }

    setLoading(true);
    
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const wb = XLSX.utils.book_new();

      // Créer une feuille pour chaque table
      Object.entries(previewData).forEach(([tableName, data]: [string, any]) => {
        if (Array.isArray(data) && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          
          // Ajuster la largeur des colonnes
          const cols = Object.keys(data[0]).map(() => ({ wch: 15 }));
          ws['!cols'] = cols;
          
          XLSX.utils.book_append_sheet(wb, ws, tableName.substring(0, 31)); // Excel limite à 31 caractères
        }
      });

      // Ajouter une feuille de résumé
      const summary = [
        { "Rapport": template?.nom || "Export personnalisé" },
        { "Date de génération": format(new Date(), "dd/MM/yyyy HH:mm") },
        { "Période": `${dateDebut} - ${dateFin}` },
        { "Statut filtré": filtreStatut },
        { "Tables exportées": selectedTables.join(", ") },
        { "Nombre total de lignes": Object.values(previewData).flat().length }
      ];
      
      const wsSummary = XLSX.utils.json_to_sheet(summary, { skipHeader: true });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

      // Télécharger le fichier
      const fileName = `export_financier_${format(new Date(), "yyyyMMdd_HHmmss")}.${exportFormat}`;
      
      if (exportFormat === "xlsx") {
        XLSX.writeFile(wb, fileName);
      } else {
        // Pour CSV, exporter la première table uniquement
        const firstTable = Object.keys(previewData)[0];
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(previewData[firstTable]));
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }
      
      toast.success(`Fichier ${fileName} exporté avec succès`);
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTable = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Export de Données Financières</h2>
        <p className="text-muted-foreground">
          Exportez vos données financières avec des templates prédéfinis ou une configuration personnalisée
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates Prédéfinis</TabsTrigger>
          <TabsTrigger value="custom">Export Personnalisé</TabsTrigger>
          <TabsTrigger value="scheduled">Exports Planifiés</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates prédéfinis */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez un Template</CardTitle>
              <CardDescription>Choisissez un modèle de rapport prédéfini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        {template.nom}
                      </CardTitle>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {template.tables.map(table => (
                          <Badge key={table} variant="secondary" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration et filtres */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration de l'Export</CardTitle>
                <CardDescription>Affinez les paramètres d'export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Période */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Date de début
                    </Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFin">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Date de fin
                    </Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtres avancés */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Label className="text-base font-semibold">Filtres Avancés</Label>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="statut">Statut</Label>
                      <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                        <SelectTrigger id="statut">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Tous</SelectItem>
                          <SelectItem value="paye">Payé</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="en_retard">En retard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cooperative">Coopérative</Label>
                      <Select value={filtreCooperative} onValueChange={setFiltreCooperative}>
                        <SelectTrigger id="cooperative">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="toutes">Toutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="montantMin">Montant minimum</Label>
                      <Input
                        id="montantMin"
                        type="number"
                        placeholder="0"
                        value={filtreMontantMin}
                        onChange={(e) => setFiltreMontantMin(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="montantMax">Montant maximum</Label>
                      <Input
                        id="montantMax"
                        type="number"
                        placeholder="∞"
                        value={filtreMontantMax}
                        onChange={(e) => setFiltreMontantMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Format d'export */}
                <div className="space-y-2">
                  <Label>Format d'export</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={exportFormat === "xlsx"}
                        onCheckedChange={() => setExportFormat("xlsx")}
                      />
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Excel (.xlsx)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={exportFormat === "csv"}
                        onCheckedChange={() => setExportFormat("csv")}
                      />
                      <FileText className="h-4 w-4" />
                      <span>CSV (.csv)</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handlePreview}
                    disabled={loading}
                    variant="outline"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4" />
                        Prévisualiser
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={loading || !previewData}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prévisualisation */}
          {showPreview && previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Prévisualisation des Données</CardTitle>
                <CardDescription>
                  Aperçu des {Object.values(previewData).flat().length} premières lignes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(previewData)[0]}>
                  <TabsList>
                    {Object.keys(previewData).map(table => (
                      <TabsTrigger key={table} value={table}>
                        {table} ({previewData[table].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(previewData).map(([table, data]: [string, any]) => (
                    <TabsContent key={table} value={table}>
                      <div className="overflow-auto max-h-96 border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              {data.length > 0 && Object.keys(data[0]).map(key => (
                                <th key={key} className="p-2 text-left font-medium border-b">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.slice(0, 10).map((row: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                {Object.values(row).map((val: any, i: number) => (
                                  <td key={i} className="p-2">
                                    {val !== null && val !== undefined ? String(val) : "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {data.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          ... et {data.length - 10} autres lignes
                        </p>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Personnalisé</CardTitle>
              <CardDescription>Sélectionnez manuellement les tables à exporter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tables disponibles</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {["quittances", "licences", "pirogues", "cooperatives", "taxes_calculees", "previsions_history"].map(table => (
                    <label key={table} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={selectedTables.includes(table)}
                        onCheckedChange={() => handleToggleTable(table)}
                      />
                      <span className="font-medium">{table}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                💡 Astuce: Utilisez les templates prédéfinis pour des exports optimisés avec les bonnes colonnes sélectionnées.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledExportsManagement 
            financialData={{}}
          />
        </TabsContent>
      </Tabs>

      <ExportPreviewDialog 
        open={showPreview}
        onOpenChange={setShowPreview}
        data={previewData}
        templateName={templates.find(t => t.id === selectedTemplate)?.nom}
      />
    </div>
  );
};
