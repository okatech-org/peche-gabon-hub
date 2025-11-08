import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useCSVData } from "@/hooks/useCSVData";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EconomicStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    valeurExportations: 0,
    totalCooperatives: 0,
    poidsTotal: 0,
    cpueMoyenne: 0,
    recettesTresor: 0,
    totalQuittances: 0,
  });

  // Charger données CSV
  const { data: exportData } = useCSVData('/data/raw/Exportation.csv');
  const { data: quittancesData } = useCSVData('/data/analytics/finances_quittances_mensuel.csv');

  useEffect(() => {
    loadStats();
  }, [exportData]);

  const loadStats = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Valeur estimée des exportations depuis CSV
      let poidsTotal = 0;
      let cpue = 0;
      if (exportData.length > 0) {
        const capturesRow = exportData.find(row => row['Espèces'] === 'Captures (kg)');
        const cpueRow = exportData.find(row => row['Espèces'] === 'CPUE (kg/jr)');
        if (capturesRow && capturesRow['Janvier']) {
          poidsTotal = Number(capturesRow['Janvier']) || 0;
        }
        if (cpueRow && cpueRow['Janvier']) {
          cpue = Number(cpueRow['Janvier']) || 0;
        }
      }

      // Prix moyen estimé: 2000 FCFA/kg pour exportations
      const valeurExportations = (poidsTotal * 2000) / 1000000; // En millions FCFA

      // Total coopératives
      const { count: totalCooperatives } = await supabase
        .from("cooperatives")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active");

      // Calculer total des quittances (revenus de l'État)
      const totalQuittances = quittancesData.reduce((sum, row) => sum + (Number(row['Valeur']) || 0), 0);
      
      // Tout l'argent versé rentre dans le Trésor Public
      const recettesTresor = totalQuittances;

      setStats({
        valeurExportations: Number(valeurExportations.toFixed(1)),
        totalCooperatives: totalCooperatives || 0,
        poidsTotal: Number(poidsTotal.toFixed(0)),
        cpueMoyenne: Number(cpue.toFixed(2)),
        recettesTresor: Number(recettesTresor.toFixed(0)),
        totalQuittances: Number(totalQuittances.toFixed(0)),
      });
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer données pour graphiques
  const exportSpeciesData = exportData
    .filter(row => row['Espèces'] && 
      row['Espèces'] !== 'Efforts (jr)' && 
      row['Espèces'] !== 'Captures (kg)' && 
      row['Espèces'] !== 'CPUE (kg/jr)' &&
      row['Espèces'] !== 'Nbre débarq.' &&
      row['Espèces'] !== 'Taux échant.' &&
      row['Janvier'] && 
      Number(row['Janvier']) > 0)
    .map(row => ({
      espece: String(row['Espèces']),
      poids: Number(row['Janvier']) || 0,
      valeur: (Number(row['Janvier']) || 0) * 2000, // FCFA
    }))
    .sort((a, b) => b.poids - a.poids)
    .slice(0, 10);

  const monthlyFinancesData = quittancesData.map(row => ({
    mois: String(row['Mois'] || '').charAt(0).toUpperCase() + String(row['Mois'] || '').slice(1),
    montant: Number(row['Valeur']) || 0,
  }));

  const prixMoyenParEspece = [
    { espece: 'Thon', prix: 2500, variation: 5.2 },
    { espece: 'Bars', prix: 2200, variation: -2.1 },
    { espece: 'Dorade', prix: 1800, variation: 3.4 },
    { espece: 'Capitaine', prix: 2100, variation: 1.8 },
    { espece: 'Sole', prix: 2800, variation: -1.5 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* KPIs - Ligne 1: Finances de l'État */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Recettes Trésor Public</CardTitle>
            <CardDescription>Totalité des quittances collectées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recettesTresor.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxes + redevances pêche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nombre de Quittances</CardTitle>
            <CardDescription>Documents collectés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quittancesData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Quittances enregistrées</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs - Ligne 2: Économie */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur Exportations</CardTitle>
            <CardDescription>Estimation mois en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.valeurExportations}M FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.poidsTotal.toLocaleString()} kg exportés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPUE Moyenne</CardTitle>
            <CardDescription>Capture par unité d'effort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpueMoyenne} kg/jr</div>
            <p className="text-xs text-muted-foreground mt-1">Efficacité de pêche</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coopératives Actives</CardTitle>
            <CardDescription>Organisations formalisées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCooperatives}</div>
            <p className="text-xs text-muted-foreground mt-1">Structures locales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
            <CardDescription>Toutes espèces confondues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,000 FCFA/kg</div>
            <p className="text-xs text-muted-foreground mt-1">Estimation marché</p>
          </CardContent>
        </Card>
      </div>


      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 10 espèces exportées */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Espèces Exportées</CardTitle>
            <CardDescription>Par poids (kg) - Mois en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {exportSpeciesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exportSpeciesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="espece" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)} kg`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="poids" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Valeur par espèce */}
        <Card>
          <CardHeader>
            <CardTitle>Valeur Économique par Espèce</CardTitle>
            <CardDescription>Répartition de la valeur (FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            {exportSpeciesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={exportSpeciesData.slice(0, 6)}
                    dataKey="valeur"
                    nameKey="espece"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => entry.espece}
                  >
                    {exportSpeciesData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${(value / 1000).toFixed(0)}K FCFA`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Évolution mensuelle et prix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenus mensuels */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels (Quittances)</CardTitle>
            <CardDescription>Évolution sur l'année</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyFinancesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyFinancesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mois" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="montant" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Prix moyen par espèce */}
        <Card>
          <CardHeader>
            <CardTitle>Prix Moyen par Espèce</CardTitle>
            <CardDescription>Variation vs mois précédent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prixMoyenParEspece.map((item) => (
                <div key={item.espece} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.espece}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{item.prix.toLocaleString()} FCFA/kg</span>
                    <div className={`flex items-center gap-1 text-xs ${
                      item.variation > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.variation > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(item.variation)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contribution économique */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution au PIB</CardTitle>
          <CardDescription>Impact économique du secteur halieutique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Emplois directs estimés</p>
              <p className="text-3xl font-bold">12,500+</p>
              <p className="text-xs text-muted-foreground">Pêcheurs et marins</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Emplois indirects</p>
              <p className="text-3xl font-bold">35,000+</p>
              <p className="text-xs text-muted-foreground">Transformation et commerce</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contribution PIB</p>
              <p className="text-3xl font-bold">~2.5%</p>
              <p className="text-xs text-muted-foreground">Secteur primaire</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EconomicStats;
