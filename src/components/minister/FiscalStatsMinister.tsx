import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Ship, Anchor, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

interface StatsFiscales {
  id: string;
  categorie: string;
  type_taxe: string;
  periode: string;
  montant_fcfa: number;
  montant_eur?: number;
  nombre_contribuables?: number;
  details?: any;
}

const FiscalStatsMinister = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsFiscales[]>([]);
  const [kpis, setKpis] = useState({
    totalArtisanal: 0,
    totalIndustriel: 0,
    totalGeneral: 0,
    contributablesTotal: 0,
  });

  useEffect(() => {
    loadFiscalStats();
  }, []);

  const loadFiscalStats = async () => {
    try {
      const { data, error } = await supabase
        .from("statistiques_fiscales")
        .select("*")
        .order("periode", { ascending: true });

      if (error) throw error;

      setStats(data || []);

      // Calculer KPIs
      const artisanalTotal = data
        ?.filter((s: StatsFiscales) => s.categorie === 'Pêche Artisanale')
        .reduce((sum, s) => sum + Number(s.montant_fcfa), 0) || 0;

      const industrielTotal = data
        ?.filter((s: StatsFiscales) => s.categorie === 'Pêche Industrielle' && !s.type_taxe.includes(' - '))
        .reduce((sum, s) => sum + Number(s.montant_fcfa), 0) || 0;

      const contributablesTotal = data
        ?.filter((s: StatsFiscales) => s.nombre_contribuables)
        .reduce((sum, s) => sum + (s.nombre_contribuables || 0), 0) || 0;

      setKpis({
        totalArtisanal: artisanalTotal,
        totalIndustriel: industrielTotal,
        totalGeneral: artisanalTotal + industrielTotal,
        contributablesTotal,
      });
    } catch (error) {
      console.error("Erreur chargement stats fiscales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer données pour graphiques
  const getLicencesPiroguesData = () => {
    const licences = stats.find(s => 
      s.categorie === 'Pêche Artisanale' && 
      s.type_taxe === 'Licence Pirogue' && 
      s.periode === '2024'
    );
    
    if (!licences?.details?.montants) return [];
    
    return Object.entries(licences.details.montants).map(([montant, count]) => ({
      montant: `${Number(montant).toLocaleString()} FCFA`,
      count: count as number,
      montantNum: Number(montant),
    })).sort((a, b) => b.montantNum - a.montantNum);
  };

  const getTaxesProductionData = () => {
    return stats
      .filter(s => 
        s.categorie === 'Pêche Artisanale' && 
        s.type_taxe === 'Taxe Production'
      )
      .map(s => ({
        mois: s.periode.replace(' 2024', ''),
        montant: Number(s.montant_fcfa),
      }));
  };

  const getArmateursData = () => {
    return stats
      .filter(s => 
        s.categorie === 'Pêche Industrielle' && 
        s.type_taxe.startsWith('Licence Navire -') &&
        !s.type_taxe.includes('MONTE') && // Exclure les navires individuels
        !s.type_taxe.includes('EGALA') &&
        !s.type_taxe.includes('ALBAC') &&
        !s.type_taxe.includes('GUEO') &&
        !s.type_taxe.includes('STER') &&
        !s.type_taxe.includes('PLAYA') &&
        !s.type_taxe.includes('MONT') &&
        !s.type_taxe.includes('GUER') &&
        !s.type_taxe.includes('ZUBE') &&
        !s.type_taxe.includes('CAP')
      )
      .map(s => ({
        armateur: s.type_taxe.replace('Licence Navire - ', ''),
        montant_fcfa: Number(s.montant_fcfa),
        montant_eur: s.montant_eur || 0,
        navires: s.details?.navires || [],
      }))
      .sort((a, b) => b.montant_fcfa - a.montant_fcfa);
  };

  const getTopNaviresData = () => {
    return stats
      .filter(s => 
        s.categorie === 'Pêche Industrielle' && 
        (s.type_taxe.includes('MONTECELO') || s.type_taxe.includes('EGALABUR'))
      )
      .map(s => ({
        navire: s.type_taxe.replace('Licence Navire - ', ''),
        montant_fcfa: Number(s.montant_fcfa),
        montant_eur: s.montant_eur || 0,
        armateur: s.details?.armateur || '',
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const licencesPiroguesData = getLicencesPiroguesData();
  const taxesProductionData = getTaxesProductionData();
  const armateursData = getArmateursData();
  const topNaviresData = getTopNaviresData();

  return (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Recettes Fiscales
            </CardTitle>
            <CardDescription>Toutes catégories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.totalGeneral / 1000000).toFixed(1)}M FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">{kpis.contributablesTotal} contribuables</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Anchor className="h-4 w-4" />
              Pêche Artisanale
            </CardTitle>
            <CardDescription>Licences + Taxes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.totalArtisanal / 1000000).toFixed(1)}M FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">906 licences actives</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Pêche Industrielle
            </CardTitle>
            <CardDescription>Licences navires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.totalIndustriel / 1000000).toFixed(1)}M FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">10 navires • ~804k €</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Coopératives
            </CardTitle>
            <CardDescription>Structures formalisées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">Pas de taxe directe détectée</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Pêche Artisanale */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pêche Artisanale</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Répartition des licences pirogues */}
          <Card>
            <CardHeader>
              <CardTitle>Licences Pirogues par Montant</CardTitle>
              <CardDescription>Répartition des 906 autorisations (2024)</CardDescription>
            </CardHeader>
            <CardContent>
              {licencesPiroguesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={licencesPiroguesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="montant" className="text-xs" angle={-15} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Évolution taxes à la production */}
          <Card>
            <CardHeader>
              <CardTitle>Taxes à la Production Mensuelles</CardTitle>
              <CardDescription>Janvier - Mars 2024</CardDescription>
            </CardHeader>
            <CardContent>
              {taxesProductionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={taxesProductionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mois" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="montant" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Pêche Industrielle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pêche Industrielle</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Armateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Licences par Armateur</CardTitle>
              <CardDescription>Classement par contribution (FCFA)</CardDescription>
            </CardHeader>
            <CardContent>
              {armateursData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={armateursData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="armateur" type="category" width={100} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [
                        `${(value / 1000000).toFixed(1)}M FCFA`,
                        'Montant'
                      ]}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="montant_fcfa" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Top 2 Navires */}
          <Card>
            <CardHeader>
              <CardTitle>Top Navires - Licences</CardTitle>
              <CardDescription>Plus grandes contributions individuelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topNaviresData.map((navire, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{navire.navire}</p>
                      <p className="text-xs text-muted-foreground">{navire.armateur}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{(navire.montant_fcfa / 1000000).toFixed(1)}M FCFA</p>
                      <p className="text-xs text-muted-foreground">≈ {navire.montant_eur.toLocaleString()} EUR</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Synthèse */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse Fiscale 2024</CardTitle>
          <CardDescription>Récapitulatif des recettes par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Licences Pirogues (PA)</p>
              <p className="text-3xl font-bold">115.5M FCFA</p>
              <p className="text-xs text-muted-foreground">906 autorisations • Moyenne: 127k FCFA</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Taxes Production (PA)</p>
              <p className="text-3xl font-bold">29.2k FCFA</p>
              <p className="text-xs text-muted-foreground">Jan-Mars • Croissance: +1706%</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Licences Navires (PI)</p>
              <p className="text-3xl font-bold">527.4M FCFA</p>
              <p className="text-xs text-muted-foreground">10 navires • ≈804k EUR</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiscalStatsMinister;