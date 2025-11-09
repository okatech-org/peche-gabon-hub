import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCSVData } from "@/hooks/useCSVData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, Ship, Anchor, Users, FileText } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CSVDataExplorer = () => {
  const { data: autorisationsData, loading: loadingAuto } = useCSVData('/data/analytics/artisanal_autorisations_montants_fcfa.csv');
  const { data: quittancesData, loading: loadingQuitt } = useCSVData('/data/analytics/artisanal_quittances_taxe_production_long.csv');
  const { data: armateursData, loading: loadingArm } = useCSVData('/data/analytics/industriel_top_armateurs_licences_fcfa.csv');
  const { data: naviresData, loading: loadingNav } = useCSVData('/data/analytics/industriel_top_navires_licences_fcfa.csv');

  const loading = loadingAuto || loadingQuitt || loadingArm || loadingNav;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Analyser les autorisations artisanales
  const montantsRepartition = autorisationsData.reduce((acc, row) => {
    const montant = Number(row['Montant']) || 0;
    if (montant > 0) {
      acc[montant] = (Number(acc[montant]) || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const montantsData = Object.entries(montantsRepartition)
    .map(([montant, count]) => ({
      montant: `${Number(montant).toLocaleString()} FCFA`,
      count: Number(count),
      montantNum: Number(montant),
      total: Number(montant) * Number(count),
    }))
    .sort((a, b) => b.count - a.count);

  // Analyser les coopératives
  const cooperativesCount = autorisationsData.reduce((acc, row) => {
    const coop = String(row['Coopérative'] || '').trim();
    if (coop && coop !== '') {
      acc[coop] = (Number(acc[coop]) || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const cooperativesData = Object.entries(cooperativesCount)
    .map(([nom, count]) => ({ nom, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sites de débarquement
  const sitesCount = autorisationsData.reduce((acc, row) => {
    const site = String(row['Site_attache'] || '').trim();
    if (site && site !== '') {
      acc[site] = (Number(acc[site]) || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sitesData = Object.entries(sitesCount)
    .map(([nom, count]) => ({ nom, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Nationalités des propriétaires
  const nationalitesCount = autorisationsData.reduce((acc, row) => {
    const nat = String(row['Nationalité'] || '').trim();
    if (nat && nat !== '') {
      acc[nat] = (Number(acc[nat]) || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const nationalitesData = Object.entries(nationalitesCount)
    .map(([nom, count]) => ({ nom, count: Number(count) }))
    .sort((a, b) => b.count - a.count);

  // Statistiques générales
  const totalAutorisations = autorisationsData.length;
  const totalMontant = montantsData.reduce((sum, item) => sum + Number(item.total), 0);
  const totalCooperatives = Object.keys(cooperativesCount).length;
  const totalSites = Object.keys(sitesCount).length;

  return (
    <div className="space-y-6">
      {/* KPIs Généraux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Autorisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAutorisations}</div>
            <p className="text-xs text-muted-foreground">Pirogues enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalMontant / 1000000).toFixed(1)}M FCFA</div>
            <p className="text-xs text-muted-foreground">Licences artisanales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Coopératives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCooperatives}</div>
            <p className="text-xs text-muted-foreground">Organisations actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Anchor className="h-4 w-4" />
              Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSites}</div>
            <p className="text-xs text-muted-foreground">Points de débarquement</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="montants" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="montants">Répartition Licences</TabsTrigger>
          <TabsTrigger value="cooperatives">Coopératives</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="industriel">Pêche Industrielle</TabsTrigger>
        </TabsList>

        {/* Répartition des montants de licences */}
        <TabsContent value="montants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Licences par Montant</CardTitle>
              <CardDescription>{totalAutorisations} autorisations • {montantsData.length} tarifs différents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={montantsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="montant" className="text-xs" angle={-15} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Nombre" />
                  </BarChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={montantsData}
                      dataKey="count"
                      nameKey="montant"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {montantsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Montant</TableHead>
                      <TableHead className="text-right">Nombre</TableHead>
                      <TableHead className="text-right">% du total</TableHead>
                      <TableHead className="text-right">Recettes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {montantsData.map((item) => (
                      <TableRow key={item.montantNum}>
                        <TableCell className="font-medium">{item.montant}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right">{((Number(item.count) / totalAutorisations) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-bold">{(item.total / 1000000).toFixed(2)}M FCFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coopératives */}
        <TabsContent value="cooperatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Coopératives</CardTitle>
              <CardDescription>Classement par nombre de membres</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cooperativesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="nom" type="category" width={120} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="#00C49F" name="Membres" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques Nationalités</CardTitle>
              <CardDescription>Répartition des propriétaires par nationalité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nationalitesData.map((item) => (
                  <div key={item.nom} className="flex items-center justify-between">
                    <Badge variant="outline">{item.nom}</Badge>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{item.count} pirogues</span>
                      <span className="text-xs text-muted-foreground">
                        {((Number(item.count) / totalAutorisations) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sites */}
        <TabsContent value="sites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Sites de Débarquement</CardTitle>
              <CardDescription>Répartition des pirogues par site d'attache</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sitesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nom" className="text-xs" angle={-25} textAnchor="end" height={100} />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="#FFBB28" name="Pirogues" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pêche Industrielle */}
        <TabsContent value="industriel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Armateurs</CardTitle>
                <CardDescription>Licences par armateur (EUR + FCFA)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Armateur</TableHead>
                      <TableHead className="text-right">EUR</TableHead>
                      <TableHead className="text-right">FCFA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {armateursData.filter(row => Number(row['Montant_EUR']) > 0).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{String(row['Armateur'])}</TableCell>
                        <TableCell className="text-right">{Number(row['Montant_EUR']).toLocaleString()} €</TableCell>
                        <TableCell className="text-right font-bold">
                          {(Number(row['Montant_FCFA_estime']) / 1000000).toFixed(1)}M FCFA
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Navires</CardTitle>
                <CardDescription>Licences par navire</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navire</TableHead>
                      <TableHead className="text-right">EUR</TableHead>
                      <TableHead className="text-right">FCFA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {naviresData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-xs">{String(row['Navire'])}</TableCell>
                        <TableCell className="text-right">{Number(row['Montant_EUR']).toLocaleString()} €</TableCell>
                        <TableCell className="text-right font-bold">
                          {(Number(row['Montant_FCFA_estime']) / 1000000).toFixed(1)}M
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSVDataExplorer;