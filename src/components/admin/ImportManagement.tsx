import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string }>;
}

const tableOptions = [
  { 
    value: 'especes', 
    label: 'Espèces',
    columns: ['nom', 'nom_scientifique', 'code', 'categorie', 'description'],
  },
  { 
    value: 'engins', 
    label: 'Engins de Pêche',
    columns: ['nom', 'type', 'description'],
  },
  { 
    value: 'strates', 
    label: 'Strates',
    columns: ['nom', 'code', 'description'],
  },
  { 
    value: 'sites', 
    label: 'Sites',
    columns: ['nom', 'province', 'description', 'latitude', 'longitude'],
  },
  { 
    value: 'cooperatives', 
    label: 'Coopératives',
    columns: ['nom', 'responsable', 'telephone', 'email', 'adresse', 'statut'],
  },
  { 
    value: 'proprietaires', 
    label: 'Propriétaires',
    columns: ['nom', 'prenom', 'nationalite', 'sexe', 'piece_id', 'telephone', 'email', 'domicile'],
  },
  { 
    value: 'armements', 
    label: 'Armements PI',
    columns: ['nom', 'responsable', 'email', 'telephone', 'adresse', 'statut'],
  },
];

export const ImportManagement = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      setFile(uploadedFile);
      
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      
      setSheets(workbook.SheetNames);
      toast.success("Fichier chargé avec succès");
      setStep(2);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error("Erreur lors de la lecture du fichier");
    }
  };

  const handleSheetSelect = (sheetName: string) => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          toast.error("La feuille est vide");
          return;
        }

        const headers = jsonData[0].map(h => String(h || ''));
        const rows = jsonData.slice(1, 11); // Prendre 10 premières lignes pour prévisualisation
        
        setSheetData({
          sheetName,
          headers,
          rows,
          totalRows: jsonData.length - 1,
        });
        setSelectedSheet(sheetName);
        setStep(3);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error processing sheet:', error);
      toast.error("Erreur lors du traitement de la feuille");
    }
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    const tableConfig = tableOptions.find(t => t.value === table);
    if (tableConfig && sheetData) {
      // Auto-mapping basé sur les noms de colonnes
      const mappings: ColumnMapping[] = tableConfig.columns.map(dbCol => {
        const matchingHeader = sheetData.headers.find(h => 
          h.toLowerCase().includes(dbCol.toLowerCase()) ||
          dbCol.toLowerCase().includes(h.toLowerCase())
        );
        return {
          excelColumn: matchingHeader || '',
          dbColumn: dbCol,
        };
      });
      setColumnMappings(mappings);
    }
    setStep(4);
  };

  const updateMapping = (dbColumn: string, excelColumn: string) => {
    setColumnMappings(prev => 
      prev.map(m => m.dbColumn === dbColumn ? { ...m, excelColumn } : m)
    );
  };

  const handleImport = async () => {
    if (!file || !selectedSheet || !selectedTable) return;

    setImporting(true);
    const results: ImportResult = { success: 0, errors: [] };

    try {
      // Lire toutes les données de la feuille
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[selectedSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const headers = jsonData[0].map(h => String(h || ''));
        const dataRows = jsonData.slice(1);

        // Traiter chaque ligne
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowData: any = {};

          // Mapper les colonnes
          columnMappings.forEach(mapping => {
            if (mapping.excelColumn) {
              const colIndex = headers.indexOf(mapping.excelColumn);
              if (colIndex !== -1) {
                const value = row[colIndex];
                rowData[mapping.dbColumn] = value !== undefined && value !== null && value !== '' 
                  ? value 
                  : null;
              }
            }
          });

          // Vérifier que les champs obligatoires sont présents
          if (!rowData.nom) {
            results.errors.push({ row: i + 2, error: "Nom manquant" });
            continue;
          }

          // Insérer dans la base de données
          const { error } = await supabase
            .from(selectedTable as any)
            .insert([rowData as any]);

          if (error) {
            results.errors.push({ row: i + 2, error: error.message });
          } else {
            results.success++;
          }
        }

        setImportResult(results);
        setImporting(false);
        setStep(5);

        if (results.errors.length === 0) {
          toast.success(`${results.success} enregistrements importés avec succès`);
        } else {
          toast.warning(`${results.success} réussis, ${results.errors.length} erreurs`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error("Erreur lors de l'import");
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setSheets([]);
    setSelectedSheet("");
    setSheetData(null);
    setSelectedTable("");
    setColumnMappings([]);
    setImportResult(null);
  };

  const exportErrorsCSV = () => {
    if (!importResult || importResult.errors.length === 0) return;

    const csv = [
      ['Ligne', 'Erreur'].join(','),
      ...importResult.errors.map(e => `${e.row},"${e.error}"`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erreurs_import.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import de Données Excel
              </CardTitle>
              <CardDescription>
                Assistant guidé pour importer des données depuis Excel vers la base de données
              </CardDescription>
            </div>
            {step > 1 && step < 5 && (
              <Button variant="outline" onClick={resetImport}>
                Recommencer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                1. Fichier
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                2. Feuille
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                3. Table
              </span>
              <span className={`text-sm font-medium ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                4. Mapping
              </span>
              <span className={`text-sm font-medium ${step >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
                5. Résultat
              </span>
            </div>
            <Progress value={(step / 5) * 100} className="h-2" />
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertTitle>Formats supportés</AlertTitle>
                <AlertDescription>
                  Fichiers Excel (.xlsx, .xls) - Maximum 20 MB
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="mb-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary font-medium">Cliquez pour sélectionner</span>
                    {' '}ou glissez-déposez un fichier
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Fichier Excel du classeur peche_gabon.xlsm
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Select Sheet */}
          {step === 2 && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertTitle>Fichier chargé: {file?.name}</AlertTitle>
                <AlertDescription>
                  {sheets.length} feuille{sheets.length > 1 ? 's' : ''} trouvée{sheets.length > 1 ? 's' : ''}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sheets.map((sheet) => (
                  <Card 
                    key={sheet}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleSheetSelect(sheet)}
                  >
                    <CardContent className="p-6 text-center">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium">{sheet}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Table */}
          {step === 3 && sheetData && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertTitle>Feuille: {selectedSheet}</AlertTitle>
                <AlertDescription>
                  {sheetData.totalRows} lignes de données trouvées
                </AlertDescription>
              </Alert>

              <div>
                <Label>Aperçu des données (10 premières lignes)</Label>
                <div className="mt-2 overflow-x-auto rounded-md border max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sheetData.headers.map((header, i) => (
                          <TableHead key={i}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetData.rows.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <Label>Sélectionner la table de destination</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {tableOptions.map((table) => (
                    <Card 
                      key={table.value}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => handleTableSelect(table.value)}
                    >
                      <CardContent className="p-6 text-center">
                        <p className="font-medium">{table.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {table.columns.length} colonnes
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Column Mapping */}
          {step === 4 && sheetData && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Mapping des colonnes</AlertTitle>
                <AlertDescription>
                  Associez les colonnes Excel aux champs de la table {tableOptions.find(t => t.value === selectedTable)?.label}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {columnMappings.map((mapping) => (
                  <div key={mapping.dbColumn} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <Label className="text-sm font-medium">
                        {mapping.dbColumn}
                        {mapping.dbColumn === 'nom' && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    <Select 
                      value={mapping.excelColumn} 
                      onValueChange={(value) => updateMapping(mapping.dbColumn, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une colonne..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Ignorer --</SelectItem>
                        {sheetData.headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Les champs marqués * sont obligatoires
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Importer {sheetData.totalRows} lignes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{importResult.success}</p>
                        <p className="text-sm text-muted-foreground">Réussis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-destructive" />
                      <div>
                        <p className="text-2xl font-bold">{importResult.errors.length}</p>
                        <p className="text-sm text-muted-foreground">Erreurs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Erreurs d'import</CardTitle>
                      <Button variant="outline" size="sm" onClick={exportErrorsCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ligne</TableHead>
                            <TableHead>Erreur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.errors.slice(0, 50).map((error, i) => (
                            <TableRow key={i}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell className="text-destructive">{error.error}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {importResult.errors.length > 50 && (
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          ... et {importResult.errors.length - 50} autres erreurs
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={resetImport}>
                  Nouvel import
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'import</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="format">
            <TabsList>
              <TabsTrigger value="format">Format des données</TabsTrigger>
              <TabsTrigger value="tables">Tables disponibles</TabsTrigger>
              <TabsTrigger value="tips">Conseils</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Première ligne doit contenir les en-têtes de colonnes<br/>
                • Les lignes vides sont ignorées<br/>
                • Les valeurs vides deviennent NULL dans la base<br/>
                • Format de date recommandé: YYYY-MM-DD
              </p>
            </TabsContent>

            <TabsContent value="tables" className="space-y-2">
              {tableOptions.map((table) => (
                <div key={table.value} className="border rounded p-3">
                  <p className="font-medium">{table.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Colonnes: {table.columns.join(', ')}
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="tips" className="space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  • Vérifiez vos données avant l'import<br/>
                  • Commencez par un petit échantillon pour tester<br/>
                  • Le champ "nom" est obligatoire pour toutes les tables<br/>
                  • En cas d'erreur, un rapport détaillé est généré<br/>
                  • Les imports sont logs dans l'audit trail
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
