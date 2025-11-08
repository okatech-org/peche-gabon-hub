import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, DollarSign, TrendingUp, Download, PieChart, BarChart3, LineChart as LineChartIcon, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";

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

interface ComparaisonAnnuelle {
  annee: number;
  montant_total: number;
  montant_paye: number;
  montant_planifie: number;
  nb_remontees: number;
}

interface TendanceInstitution {
  institution: string;
  donnees: Array<{
    annee: number;
    montant: number;
  }>;
}

interface PrevisionMensuelle {
  mois: number;
  montant_prevu: number;
  montant_min: number;
  montant_max: number;
  confiance_pct: number;
  par_institution: Array<{
    institution: string;
    montant_prevu: number;
  }>;
}

interface Previsions {
  annee_prevue: number;
  previsions_mensuelles: PrevisionMensuelle[];
  analyse: {
    tendance_generale: string;
    croissance_prevue_pct: number;
    facteurs_cles: string[];
    niveau_confiance_global: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const MOIS_NOMS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function RemonteesInstitutionnellesDashboard() {
  const [stats, setStats] = useState<RemonteeStats[]>([]);
  const [remontees, setRemontees] = useState<RemonteeDetail[]>([]);
  const [evolution, setEvolution] = useState<EvolutionMensuelle[]>([]);
  const [comparaisonAnnuelle, setComparaisonAnnuelle] = useState<ComparaisonAnnuelle[]>([]);
  const [tendancesInstitutions, setTendancesInstitutions] = useState<TendanceInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalRemontees, setTotalRemontees] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [yearsRange, setYearsRange] = useState<number[]>([]);
  const [previsions, setPrevisions] = useState<Previsions | null>(null);
  const [loadingPrevisions, setLoadingPrevisions] = useState(false);

  useEffect(() => {
    loadData();
    loadComparaisonAnnuelle();
  }, [selectedYear]);

  useEffect(() => {
    loadTendancesInstitutions();
  }, []);

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

  const loadComparaisonAnnuelle = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
      setYearsRange(years);

      const comparaisons: ComparaisonAnnuelle[] = [];

      for (const year of years) {
        const { data, error } = await supabase
          .from("remontees_effectives")
          .select("*")
          .eq("periode_annee", year);

        if (error) throw error;

        const montantTotal = (data || []).reduce(
          (sum, r) => sum + parseFloat(r.montant_remonte.toString()),
          0
        );
        const montantPaye = (data || [])
          .filter((r) => r.statut_virement === "effectue")
          .reduce((sum, r) => sum + parseFloat(r.montant_remonte.toString()), 0);
        const montantPlanifie = (data || [])
          .filter((r) => r.statut_virement === "planifie")
          .reduce((sum, r) => sum + parseFloat(r.montant_remonte.toString()), 0);

        comparaisons.push({
          annee: year,
          montant_total: montantTotal,
          montant_paye: montantPaye,
          montant_planifie: montantPlanifie,
          nb_remontees: data?.length || 0,
        });
      }

      setComparaisonAnnuelle(comparaisons);
    } catch (error) {
      console.error("Erreur lors du chargement de la comparaison annuelle:", error);
    }
  };

  const loadTendancesInstitutions = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

      // Charger les institutions
      const { data: institutions, error: instError } = await supabase
        .from("repartition_institutionnelle")
        .select("*")
        .eq("actif", true);

      if (instError) throw instError;

      const tendances: TendanceInstitution[] = [];

      for (const institution of institutions || []) {
        const donnees = [];

        for (const year of years) {
          const { data, error } = await supabase
            .from("remontees_effectives")
            .select("montant_remonte")
            .eq("institution_id", institution.id)
            .eq("periode_annee", year);

          if (error) throw error;

          const montantTotal = (data || []).reduce(
            (sum, r) => sum + parseFloat(r.montant_remonte.toString()),
            0
          );

          donnees.push({
            annee: year,
            montant: montantTotal,
          });
        }

        // Inverser pour avoir l'ordre chronologique
        donnees.reverse();

        tendances.push({
          institution: institution.nom_institution,
          donnees,
        });
      }

      setTendancesInstitutions(tendances);
    } catch (error) {
      console.error("Erreur lors du chargement des tendances:", error);
    }
  };

  const genererPrevisions = async () => {
    try {
      setLoadingPrevisions(true);

      // Charger la répartition institutionnelle
      const { data: institutions, error: instError } = await supabase
        .from("repartition_institutionnelle")
        .select("*")
        .eq("actif", true);

      if (instError) throw instError;

      const { data, error } = await supabase.functions.invoke("prevoir-remontees", {
        body: {
          donneesHistoriques: comparaisonAnnuelle,
          institutions: institutions?.map((i) => ({
            nom: i.nom_institution,
            pourcentage: i.pourcentage_taxes,
          })),
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Trop de requêtes, veuillez réessayer dans quelques instants");
        } else if (error.message?.includes("402")) {
          toast.error("Crédits insuffisants, veuillez recharger votre compte");
        } else {
          toast.error("Erreur lors de la génération des prévisions");
        }
        throw error;
      }

      setPrevisions(data);
      toast.success("Prévisions générées avec succès");
    } catch (error) {
      console.error("Erreur prévisions:", error);
    } finally {
      setLoadingPrevisions(false);
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="repartition">
                <PieChart className="h-4 w-4 mr-2" />
                Répartition
              </TabsTrigger>
              <TabsTrigger value="evolution">
                <BarChart3 className="h-4 w-4 mr-2" />
                Mensuel
              </TabsTrigger>
              <TabsTrigger value="comparaison">
                <Calendar className="h-4 w-4 mr-2" />
                Multi-années
              </TabsTrigger>
              <TabsTrigger value="tendances">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Tendances
              </TabsTrigger>
              <TabsTrigger value="previsions">
                <TrendingUp className="h-4 w-4 mr-2" />
                Prévisions
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

            <TabsContent value="comparaison" className="space-y-4">
              <div className="space-y-6">
                <div className="h-96">
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    Comparaison des Remontées sur 5 ans
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...comparaisonAnnuelle].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="annee" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                      />
                      <Legend />
                      <Bar dataKey="montant_total" fill="#0088FE" name="Total" />
                      <Bar dataKey="montant_paye" fill="#00C49F" name="Payé" />
                      <Bar dataKey="montant_planifie" fill="#FFBB28" name="Planifié" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Statistiques de croissance */}
                <div className="grid md:grid-cols-3 gap-4">
                  {comparaisonAnnuelle.length >= 2 && (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Croissance Annuelle</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const derniere = comparaisonAnnuelle[0];
                            const precedente = comparaisonAnnuelle[1];
                            const croissance = precedente.montant_total > 0
                              ? ((derniere.montant_total - precedente.montant_total) / precedente.montant_total) * 100
                              : 0;
                            return (
                              <>
                                <div className={`text-2xl font-bold ${croissance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {croissance >= 0 ? '+' : ''}{croissance.toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {derniere.annee} vs {precedente.annee}
                                </p>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Meilleure Année</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const meilleure = [...comparaisonAnnuelle].sort(
                              (a, b) => b.montant_total - a.montant_total
                            )[0];
                            return (
                              <>
                                <div className="text-2xl font-bold">{meilleure.annee}</div>
                                <p className="text-xs text-muted-foreground">
                                  {meilleure.montant_total.toLocaleString()} FCFA
                                </p>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Moyenne 5 ans</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const moyenne = comparaisonAnnuelle.reduce(
                              (sum, c) => sum + c.montant_total,
                              0
                            ) / comparaisonAnnuelle.length;
                            return (
                              <>
                                <div className="text-2xl font-bold">
                                  {moyenne.toLocaleString()} FCFA
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {comparaisonAnnuelle[0].annee - 4} - {comparaisonAnnuelle[0].annee}
                                </p>
                              </>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tendances" className="space-y-4">
              <div className="h-96">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Évolution par Institution sur 5 ans
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      // Transformer les données pour avoir un format compatible
                      const years = [...new Set(
                        tendancesInstitutions.flatMap((t) => t.donnees.map((d) => d.annee))
                      )].sort();

                      return years.map((annee) => {
                        const point: any = { annee };
                        tendancesInstitutions.forEach((inst) => {
                          const donnee = inst.donnees.find((d) => d.annee === annee);
                          point[inst.institution] = donnee?.montant || 0;
                        });
                        return point;
                      });
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                    />
                    <Legend />
                    {tendancesInstitutions.map((inst, idx) => (
                      <Line
                        key={inst.institution}
                        type="monotone"
                        dataKey={inst.institution}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tableau de croissance par institution */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead className="text-right">Croissance</TableHead>
                      <TableHead className="text-right">Montant {comparaisonAnnuelle[0]?.annee}</TableHead>
                      <TableHead className="text-right">Montant {comparaisonAnnuelle[1]?.annee}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tendancesInstitutions.map((inst) => {
                      const dernier = inst.donnees[inst.donnees.length - 1]?.montant || 0;
                      const precedent = inst.donnees[inst.donnees.length - 2]?.montant || 0;
                      const croissance = precedent > 0
                        ? ((dernier - precedent) / precedent) * 100
                        : 0;

                      return (
                        <TableRow key={inst.institution}>
                          <TableCell className="font-medium">{inst.institution}</TableCell>
                          <TableCell className={`text-right font-semibold ${croissance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {croissance >= 0 ? '+' : ''}{croissance.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {dernier.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            {precedent.toLocaleString()} FCFA
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="previsions" className="space-y-4">
              <div className="space-y-6">
                {!previsions ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                      <TrendingUp className="h-16 w-16 text-muted-foreground" />
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">Générer des Prévisions IA</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Utilisez l'intelligence artificielle pour prédire les remontées de l'année prochaine
                          basées sur les tendances historiques avec intervalle de confiance.
                        </p>
                      </div>
                      <Button
                        onClick={genererPrevisions}
                        disabled={loadingPrevisions || comparaisonAnnuelle.length < 3}
                        size="lg"
                      >
                        {loadingPrevisions ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Générer les Prévisions
                          </>
                        )}
                      </Button>
                      {comparaisonAnnuelle.length < 3 && (
                        <p className="text-xs text-muted-foreground">
                          Au moins 3 années de données historiques sont requises
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Analyse globale */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Année Prévue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{previsions.annee_prevue}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Croissance Prévue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div
                            className={`text-2xl font-bold ${
                              previsions.analyse.croissance_prevue_pct >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {previsions.analyse.croissance_prevue_pct >= 0 ? "+" : ""}
                            {previsions.analyse.croissance_prevue_pct.toFixed(1)}%
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Tendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold capitalize">
                            {previsions.analyse.tendance_generale}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Confiance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold capitalize">
                            {previsions.analyse.niveau_confiance_global}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphique des prévisions avec intervalle */}
                    <div className="h-96">
                      <h3 className="text-lg font-semibold mb-4 text-center">
                        Prévisions Mensuelles {previsions.annee_prevue} avec Intervalle de Confiance
                      </h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={previsions.previsions_mensuelles.map((p) => ({
                            mois: MOIS_NOMS[p.mois - 1],
                            prevu: p.montant_prevu,
                            min: p.montant_min,
                            max: p.montant_max,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="max"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.2}
                            name="Maximum"
                          />
                          <Area
                            type="monotone"
                            dataKey="prevu"
                            stroke="#0088FE"
                            fill="#0088FE"
                            fillOpacity={0.6}
                            name="Prévu"
                          />
                          <Area
                            type="monotone"
                            dataKey="min"
                            stroke="#ffc658"
                            fill="#ffc658"
                            fillOpacity={0.2}
                            name="Minimum"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Facteurs clés */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Facteurs Clés Influençant les Prévisions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {previsions.analyse.facteurs_cles.map((facteur, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span className="text-sm">{facteur}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Tableau détaillé */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mois</TableHead>
                            <TableHead className="text-right">Montant Prévu</TableHead>
                            <TableHead className="text-right">Intervalle Min-Max</TableHead>
                            <TableHead className="text-right">Confiance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previsions.previsions_mensuelles.map((prev) => (
                            <TableRow key={prev.mois}>
                              <TableCell className="font-medium">
                                {MOIS_NOMS[prev.mois - 1]} {previsions.annee_prevue}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {prev.montant_prevu.toLocaleString()} FCFA
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {prev.montant_min.toLocaleString()} -{" "}
                                {prev.montant_max.toLocaleString()} FCFA
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  className={
                                    prev.confiance_pct >= 80
                                      ? "bg-green-500/20 text-green-700"
                                      : prev.confiance_pct >= 60
                                      ? "bg-blue-500/20 text-blue-700"
                                      : "bg-orange-500/20 text-orange-700"
                                  }
                                >
                                  {prev.confiance_pct}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-center">
                      <Button variant="outline" onClick={() => setPrevisions(null)}>
                        Régénérer les Prévisions
                      </Button>
                    </div>
                  </>
                )}
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
