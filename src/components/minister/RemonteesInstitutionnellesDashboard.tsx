import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, DollarSign, TrendingUp, Download, PieChart, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface RemonteeStats {
  institution: string;
  type_institution: string;
  pourcentage: number;
  montant_total: number;
  montant_paye: number;
  montant_planifie: number;
}

interface RemonteeDetail {
  id: string;
  montant_remonte: number;
  pourcentage_applique: number;
  periode_mois: number;
  periode_annee: number;
  statut_virement: string;
  date_virement: string | null;
  repartition_institutionnelle?: {
    nom_institution: string;
    type_institution: string;
  };
}

interface EvolutionMensuelle {
  mois: string;
  montant: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const MOIS_NOMS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function RemonteesInstitutionnellesDashboard() {
  const [stats, setStats] = useState<RemonteeStats[]>([]);
  const [remontees, setRemontees] = useState<RemonteeDetail[]>([]);
  const [evolution, setEvolution] = useState<EvolutionMensuelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalRemontees, setTotalRemontees] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les remontées de l'année sélectionnée
      const { data: remonteesData, error: remonteesError } = await supabase
        .from("remontees_effectives")
        .select(`
          *,
          repartition_institutionnelle(nom_institution, type_institution)
        `)
        .eq("periode_annee", selectedYear)
        .order("periode_mois", { ascending: false });

      if (remonteesError) throw remonteesError;

      setRemontees(remonteesData || []);

      // Charger la répartition institutionnelle
      const { data: repartitionData, error: repartitionError } = await supabase
        .from("repartition_institutionnelle")
        .select("*")
        .eq("actif", true);

      if (repartitionError) throw repartitionError;

      // Calculer les statistiques par institution
      const statsMap = new Map<string, RemonteeStats>();
      let total = 0;

      (repartitionData || []).forEach((rep) => {
        statsMap.set(rep.id, {
          institution: rep.nom_institution,
          type_institution: rep.type_institution,
          pourcentage: rep.pourcentage_taxes,
          montant_total: 0,
          montant_paye: 0,
          montant_planifie: 0,
        });
      });

      (remonteesData || []).forEach((remontee) => {
        const institutionId = remontee.institution_id;
        if (statsMap.has(institutionId)) {
          const stat = statsMap.get(institutionId)!;
          const montant = parseFloat(remontee.montant_remonte.toString());
          stat.montant_total += montant;
          total += montant;

          if (remontee.statut_virement === "effectue") {
            stat.montant_paye += montant;
          } else if (remontee.statut_virement === "planifie") {
            stat.montant_planifie += montant;
          }
        }
      });

      setStats(Array.from(statsMap.values()));
      setTotalRemontees(total);

      // Calculer l'évolution mensuelle
      const evolutionMap = new Map<number, number>();
      for (let i = 1; i <= 12; i++) {
        evolutionMap.set(i, 0);
      }

      (remonteesData || []).forEach((remontee) => {
        const mois = remontee.periode_mois;
        const montant = parseFloat(remontee.montant_remonte.toString());
        evolutionMap.set(mois, (evolutionMap.get(mois) || 0) + montant);
      });

      const evolutionArray = Array.from(evolutionMap.entries()).map(([mois, montant]) => ({
        mois: MOIS_NOMS[mois - 1],
        montant,
      }));

      setEvolution(evolutionArray);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // En-tête
      pdf.setFontSize(20);
      pdf.text(`Remontées Institutionnelles ${selectedYear}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Statistiques globales
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("STATISTIQUES GLOBALES", 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.text(`Total des remontées: ${totalRemontees.toLocaleString()} FCFA`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Nombre d'institutions: ${stats.length}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Montant payé: ${stats.reduce((sum, s) => sum + s.montant_paye, 0).toLocaleString()} FCFA`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Montant planifié: ${stats.reduce((sum, s) => sum + s.montant_planifie, 0).toLocaleString()} FCFA`, 20, yPosition);
      yPosition += 15;

      // Tableau des institutions
      pdf.setFontSize(14);
      pdf.text("RÉPARTITION PAR INSTITUTION", 15, yPosition);
      yPosition += 10;

      // En-tête du tableau
      pdf.setFontSize(9);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPosition, pageWidth - 30, 8, "F");
      pdf.text("Institution", 18, yPosition + 5);
      pdf.text("Type", 80, yPosition + 5);
      pdf.text("%", 120, yPosition + 5);
      pdf.text("Montant", 140, yPosition + 5);
      yPosition += 10;

      // Lignes du tableau
      pdf.setFontSize(8);
      stats.forEach((stat, idx) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        const bgColor = idx % 2 === 0 ? 255 : 250;
        pdf.setFillColor(bgColor, bgColor, bgColor);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 7, "F");

        pdf.text(stat.institution, 18, yPosition);
        pdf.text(stat.type_institution.replace("_", " "), 80, yPosition);
        pdf.text(`${stat.pourcentage}%`, 120, yPosition);
        pdf.text(`${stat.montant_total.toLocaleString()} FCFA`, 140, yPosition);
        yPosition += 7;
      });

      // Sauvegarder
      pdf.save(`remontees-institutionnelles-${selectedYear}.pdf`);
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error("Erreur export PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "effectue":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "planifie":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "annule":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const pieData = stats.map((s) => ({
    name: s.institution,
    value: s.montant_total,
    percentage: s.pourcentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Remontées Institutionnelles
              </CardTitle>
              <CardDescription>
                Suivi de la répartition des taxes collectées aux institutions
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExportPDF} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Remontées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemontees.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">Année {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">Bénéficiaires actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virements Effectués</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, s) => sum + s.montant_paye, 0).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRemontees > 0
                ? ((stats.reduce((sum, s) => sum + s.montant_paye, 0) / totalRemontees) * 100).toFixed(1)
                : 0}
              % du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, s) => sum + s.montant_planifie, 0).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">À virer</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tableaux */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="repartition" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="repartition">
                <PieChart className="h-4 w-4 mr-2" />
                Répartition
              </TabsTrigger>
              <TabsTrigger value="evolution">
                <BarChart3 className="h-4 w-4 mr-2" />
                Évolution
              </TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
            </TabsList>

            <TabsContent value="repartition" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Graphique circulaire */}
                <div className="h-80">
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    Répartition par Institution
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Tableau récapitulatif */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Montants par Institution</h3>
                  <div className="space-y-4">
                    {stats.map((stat, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{stat.institution}</span>
                              <Badge>{stat.pourcentage}%</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {stat.type_institution.replace("_", " ")}
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {stat.montant_total.toLocaleString()} FCFA
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Payé: </span>
                                <span className="font-medium text-green-600">
                                  {stat.montant_paye.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Planifié: </span>
                                <span className="font-medium text-orange-600">
                                  {stat.montant_planifie.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evolution" className="space-y-4">
              <div className="h-96">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Évolution Mensuelle des Remontées {selectedYear}
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                    />
                    <Legend />
                    <Bar dataKey="montant" fill="#0088FE" name="Montant (FCFA)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Pourcentage</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date Virement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remontees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Aucune remontée enregistrée pour {selectedYear}
                        </TableCell>
                      </TableRow>
                    ) : (
                      remontees.map((remontee) => (
                        <TableRow key={remontee.id}>
                          <TableCell className="font-medium">
                            {remontee.repartition_institutionnelle?.nom_institution || "N/A"}
                          </TableCell>
                          <TableCell>
                            {remontee.repartition_institutionnelle?.type_institution?.replace("_", " ") || "N/A"}
                          </TableCell>
                          <TableCell>
                            {MOIS_NOMS[remontee.periode_mois - 1]} {remontee.periode_annee}
                          </TableCell>
                          <TableCell className="text-right">
                            {remontee.pourcentage_applique}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {parseFloat(remontee.montant_remonte.toString()).toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatutColor(remontee.statut_virement)}>
                              {remontee.statut_virement}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {remontee.date_virement
                              ? new Date(remontee.date_virement).toLocaleDateString("fr-FR")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
