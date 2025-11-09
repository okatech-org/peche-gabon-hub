import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Calendar, Waves } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Maree {
  id: string;
  date_depart: string;
  date_retour: string;
  duree_mer_jours: number;
  jours_peche: number;
  capture_totale_kg: number;
  cpue_moyenne: number;
  zone_peche: string;
  navire?: {
    nom: string;
  };
}

interface CaptureDetail {
  espece_id: string;
  poids_kg: number;
  espece?: {
    nom: string;
    categorie: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export function IndustrialFishingActivity() {
  const [loading, setLoading] = useState(true);
  const [marees, setMarees] = useState<Maree[]>([]);
  const [capturesParEspece, setCapturesParEspece] = useState<any[]>([]);
  const [evolutionMensuelle, setEvolutionMensuelle] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalMarees: 0,
    totalCaptures: 0,
    cpueMoyen: 0,
    joursEnMer: 0,
    joursPecheTotal: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les marées
      const { data: mareesData, error: mareesError } = await supabase
        .from("marees_industrielles")
        .select("*")
        .gte("date_depart", `${selectedYear}-01-01`)
        .lte("date_depart", `${selectedYear}-12-31`)
        .order("date_depart", { ascending: false });

      if (mareesError) throw mareesError;

      // Charger les navires séparément
      const { data: naviresData, error: naviresError } = await supabase
        .from("navires")
        .select("id, nom");

      if (naviresError) throw naviresError;

      // Créer un map des navires
      const naviresMap = new Map(
        (naviresData || []).map(n => [n.id, n])
      );

      // Joindre manuellement les données
      const mareesAvecNavires = (mareesData || []).map(maree => ({
        ...maree,
        navire: maree.navire_id ? naviresMap.get(maree.navire_id) : undefined
      }));

      setMarees(mareesAvecNavires as any);

      // Calculer les statistiques
      const totalCaptures = (mareesData || []).reduce((sum, m) => sum + (m.capture_totale_kg || 0), 0);
      const joursEnMer = (mareesData || []).reduce((sum, m) => sum + (m.duree_mer_jours || 0), 0);
      const joursPecheTotal = (mareesData || []).reduce((sum, m) => sum + (m.jours_peche || 0), 0);
      const cpueMoyen = joursPecheTotal > 0 ? totalCaptures / joursPecheTotal : 0;

      setStats({
        totalMarees: (mareesData || []).length,
        totalCaptures,
        cpueMoyen,
        joursEnMer,
        joursPecheTotal,
      });

      // Évolution mensuelle
      const evolutionMap = new Map<number, { captures: number; nb_marees: number }>();
      for (let i = 0; i < 12; i++) {
        evolutionMap.set(i, { captures: 0, nb_marees: 0 });
      }

      (mareesData || []).forEach(maree => {
        const mois = new Date(maree.date_depart).getMonth();
        const current = evolutionMap.get(mois)!;
        current.captures += maree.capture_totale_kg || 0;
        current.nb_marees += 1;
        evolutionMap.set(mois, current);
      });

      const evolution = Array.from(evolutionMap.entries()).map(([mois, data]) => ({
        mois: MOIS_NOMS[mois],
        captures: Math.round(data.captures / 1000), // En tonnes
        nb_marees: data.nb_marees,
      }));

      setEvolutionMensuelle(evolution);

      // Charger les captures par espèce
      if ((mareesData || []).length > 0) {
        const mareeIds = (mareesData || []).map(m => m.id);
        
        const { data: capturesData, error: capturesError } = await supabase
          .from("captures_industrielles_detail")
          .select(`
            poids_kg,
            espece:especes(nom, categorie)
          `)
          .in("maree_id", mareeIds);

        if (capturesError) throw capturesError;

        // Agréger par espèce
        const especeMap = new Map<string, number>();
        (capturesData || []).forEach((capture: any) => {
          const nom = capture.espece?.nom || "Autre";
          especeMap.set(nom, (especeMap.get(nom) || 0) + (capture.poids_kg || 0));
        });

        const topEspeces = Array.from(especeMap.entries())
          .map(([nom, poids]) => ({ nom, poids: Math.round(poids / 1000) })) // En tonnes
          .sort((a, b) => b.poids - a.poids)
          .slice(0, 10);

        setCapturesParEspece(topEspeces);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur d'année */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Activité et Captures</h3>
          <p className="text-sm text-muted-foreground">Journal des marées et effort de pêche</p>
        </div>
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
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Marées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarees}</div>
            <p className="text-xs text-muted-foreground">Campagnes {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Captures Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalCaptures / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} T
            </div>
            <p className="text-xs text-muted-foreground">Kilogrammes capturés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CPUE Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cpueMoyen.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg
            </div>
            <p className="text-xs text-muted-foreground">Par jour de pêche</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Waves className="h-4 w-4" />
              Jours en Mer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.joursEnMer}</div>
            <p className="text-xs text-muted-foreground">Durée totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jours de Pêche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.joursPecheTotal}</div>
            <p className="text-xs text-muted-foreground">Effort de pêche</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution Mensuelle des Captures</CardTitle>
            <CardDescription>Volume capturé par mois en {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} T`} />
                <Legend />
                <Bar dataKey="captures" fill="hsl(var(--chart-1))" name="Captures (T)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Espèces Capturées</CardTitle>
            <CardDescription>Répartition par espèce (tonnes)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={capturesParEspece}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nom, percent }) => `${nom} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="poids"
                >
                  {capturesParEspece.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} T`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Journal des marées */}
      <Card>
        <CardHeader>
          <CardTitle>Journal des Marées</CardTitle>
          <CardDescription>Liste détaillée des campagnes de pêche {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navire</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Retour</TableHead>
                  <TableHead className="text-right">Durée (jours)</TableHead>
                  <TableHead className="text-right">Jours Pêche</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Captures (kg)</TableHead>
                  <TableHead className="text-right">CPUE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Aucune marée enregistrée pour {selectedYear}
                    </TableCell>
                  </TableRow>
                ) : (
                  marees.map((maree) => (
                    <TableRow key={maree.id}>
                      <TableCell className="font-medium">{maree.navire?.nom || "-"}</TableCell>
                      <TableCell>
                        {new Date(maree.date_depart).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {maree.date_retour 
                          ? new Date(maree.date_retour).toLocaleDateString('fr-FR')
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">{maree.duree_mer_jours || "-"}</TableCell>
                      <TableCell className="text-right">{maree.jours_peche || "-"}</TableCell>
                      <TableCell>{maree.zone_peche || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {(maree.capture_totale_kg || 0).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {(maree.cpue_moyenne || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg/j
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
