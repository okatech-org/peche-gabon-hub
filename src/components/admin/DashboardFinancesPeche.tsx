import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Ship,
  Anchor,
  Calendar,
  Download,
  Eye,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FinanceStats {
  totalTaxesArtisanales: number;
  totalRedevancesIndustrielles: number;
  totalGeneral: number;
  evolutionMensuelle: Array<{
    mois: string;
    artisanal: number;
    industriel: number;
    total: number;
  }>;
  repartitionParType: Array<{
    type: string;
    montant: number;
  }>;
  topContributeurs: Array<{
    nom: string;
    montant: number;
    type: string;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function DashboardFinancesPeche() {
  const [stats, setStats] = useState<FinanceStats>({
    totalTaxesArtisanales: 0,
    totalRedevancesIndustrielles: 0,
    totalGeneral: 0,
    evolutionMensuelle: [],
    repartitionParType: [],
    topContributeurs: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadFinanceData();
  }, [selectedYear]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);

      // Charger taxes artisanales
      const { data: taxesArtisanales, error: errorPA } = await supabase
        .from("taxes_artisanales")
        .select("*")
        .eq("annee", selectedYear);

      if (errorPA) throw errorPA;

      // Charger redevances industrielles
      const { data: taxesIndustrielles, error: errorPI } = await supabase
        .from("taxes_industrielles")
        .select("*, navires_industriels(nom)")
        .eq("annee", selectedYear);

      if (errorPI) throw errorPI;

      // Calculer totaux
      const totalPA = taxesArtisanales?.reduce(
        (sum, t) => sum + (Number(t.montant_fcfa) || 0),
        0
      ) || 0;

      const totalPI =
        taxesIndustrielles?.reduce(
          (sum, t) => sum + (Number(t.montant_euros) || 0) * 656, // Conversion EUR -> FCFA
          0
        ) || 0;

      // Calculer évolution mensuelle
      const evolutionMap = new Map<
        number,
        { artisanal: number; industriel: number }
      >();

      taxesArtisanales?.forEach((t) => {
        const current = evolutionMap.get(t.mois) || {
          artisanal: 0,
          industriel: 0,
        };
        current.artisanal += Number(t.montant_fcfa) || 0;
        evolutionMap.set(t.mois, current);
      });

      // Pour industriel, répartir sur l'année
      const montantMensuelPI = totalPI / 12;
      for (let i = 1; i <= 12; i++) {
        const current = evolutionMap.get(i) || {
          artisanal: 0,
          industriel: 0,
        };
        current.industriel = montantMensuelPI;
        evolutionMap.set(i, current);
      }

      const moisNoms = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jun",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      const evolutionMensuelle = Array.from({ length: 12 }, (_, i) => {
        const data = evolutionMap.get(i + 1) || {
          artisanal: 0,
          industriel: 0,
        };
        return {
          mois: moisNoms[i],
          artisanal: Math.round(data.artisanal / 1000000), // En millions FCFA
          industriel: Math.round(data.industriel / 1000000),
          total: Math.round((data.artisanal + data.industriel) / 1000000),
        };
      });

      // Répartition par type
      const repartitionParType = [
        { type: "Pêche Artisanale", montant: totalPA },
        { type: "Pêche Industrielle", montant: totalPI },
      ];

      // Top contributeurs industriels
      const topContributeurs = (taxesIndustrielles || [])
        .map((t) => ({
          nom: t.navires_industriels?.nom || "N/A",
          montant: (Number(t.montant_euros) || 0) * 656,
          type: "Industriel",
        }))
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 10);

      setStats({
        totalTaxesArtisanales: totalPA,
        totalRedevancesIndustrielles: totalPI,
        totalGeneral: totalPA + totalPI,
        evolutionMensuelle,
        repartitionParType,
        topContributeurs,
      });
    } catch (error: any) {
      console.error("Error loading finance data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const calculateTrend = () => {
    const currentYear = stats.totalGeneral;
    // Simuler année précédente (à remplacer par vraies données)
    const previousYear = currentYear * 0.85;
    const trend = ((currentYear - previousYear) / previousYear) * 100;
    return {
      value: trend,
      isPositive: trend > 0,
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Chargement des données financières...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur d'année */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Finances de la Pêche</h2>
          <p className="text-muted-foreground">
            Taxes artisanales et redevances industrielles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Général
              </p>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatMontant(stats.totalGeneral)}
              </p>
              <div className="flex items-center gap-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs {selectedYear - 1}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Taxes Artisanales
              </p>
              <Anchor className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatMontant(stats.totalTaxesArtisanales)}
              </p>
              <p className="text-xs text-muted-foreground">
                {(
                  (stats.totalTaxesArtisanales / stats.totalGeneral) *
                  100
                ).toFixed(1)}
                % du total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Redevances Industrielles
              </p>
              <Ship className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatMontant(stats.totalRedevancesIndustrielles)}
              </p>
              <p className="text-xs text-muted-foreground">
                {(
                  (stats.totalRedevancesIndustrielles / stats.totalGeneral) *
                  100
                ).toFixed(1)}
                % du total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour différentes vues */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="artisanal">Pêche Artisanale</TabsTrigger>
          <TabsTrigger value="industriel">Pêche Industrielle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Évolution mensuelle */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Recettes {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={stats.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis
                    label={{
                      value: "Montant (Millions FCFA)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed(2)} M FCFA`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="artisanal"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Pêche Artisanale"
                  />
                  <Line
                    type="monotone"
                    dataKey="industriel"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Pêche Industrielle"
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Répartition par type */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Type de Pêche</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.repartitionParType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) =>
                        `${type}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="montant"
                    >
                      {stats.repartitionParType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatMontant(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top contributeurs */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Contributeurs Industriels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topContributeurs.slice(0, 5).map((contrib, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{contrib.nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {contrib.type}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatMontant(contrib.montant)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="artisanal" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Taxes Artisanales Mensuelles {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis
                    label={{
                      value: "Montant (Millions FCFA)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed(2)} M FCFA`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="artisanal"
                    fill="#3b82f6"
                    name="Taxes Artisanales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industriel" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Redevances Industrielles Réparties {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis
                    label={{
                      value: "Montant (Millions FCFA)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed(2)} M FCFA`
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="industriel"
                    fill="#8b5cf6"
                    name="Redevances Industrielles"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
