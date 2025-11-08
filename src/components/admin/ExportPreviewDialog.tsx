import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, DollarSign, Calendar, FileText, BarChart3, PieChartIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  templateName?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ExportPreviewDialog = ({ open, onOpenChange, data, templateName }: ExportPreviewDialogProps) => {
  if (!data) return null;

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    const chartData: any = {
      monthly: [],
      byStatus: [],
      byTable: [],
      trends: []
    };

    // Données mensuelles (quittances)
    if (data.quittances && Array.isArray(data.quittances)) {
      const monthlyGroups = data.quittances.reduce((acc: any, item: any) => {
        const key = `${item.mois || 'N/A'}-${item.annee || 'N/A'}`;
        if (!acc[key]) {
          acc[key] = { mois: key, montant: 0, count: 0 };
        }
        acc[key].montant += parseFloat(item.montant || 0);
        acc[key].count += 1;
        return acc;
      }, {});
      chartData.monthly = Object.values(monthlyGroups);
    }

    // Données par statut
    if (data.quittances && Array.isArray(data.quittances)) {
      const statusGroups = data.quittances.reduce((acc: any, item: any) => {
        const status = item.statut || 'Non défini';
        if (!acc[status]) {
          acc[status] = { name: status, value: 0, count: 0 };
        }
        acc[status].value += parseFloat(item.montant || 0);
        acc[status].count += 1;
        return acc;
      }, {});
      chartData.byStatus = Object.values(statusGroups);
    }

    // Données par table
    Object.entries(data).forEach(([tableName, tableData]: [string, any]) => {
      if (Array.isArray(tableData)) {
        const totalAmount = tableData.reduce((sum, item) => {
          const amount = parseFloat(item.montant || item.montant_total || item.montant_taxe || 0);
          return sum + amount;
        }, 0);
        chartData.byTable.push({
          name: tableName,
          value: totalAmount,
          count: tableData.length
        });
      }
    });

    // Tendances temporelles (licences)
    if (data.licences && Array.isArray(data.licences)) {
      const yearGroups = data.licences.reduce((acc: any, item: any) => {
        const year = item.annee || 'N/A';
        if (!acc[year]) {
          acc[year] = { annee: year, montant: 0, count: 0 };
        }
        acc[year].montant += parseFloat(item.montant_total || 0);
        acc[year].count += 1;
        return acc;
      }, {});
      chartData.trends = Object.values(yearGroups).sort((a: any, b: any) => a.annee - b.annee);
    }

    return chartData;
  };

  const chartData = prepareChartData();

  // Calculer les statistiques globales
  const calculateStats = () => {
    let totalAmount = 0;
    let totalRecords = 0;
    let tables = 0;

    Object.entries(data).forEach(([_, tableData]: [string, any]) => {
      if (Array.isArray(tableData)) {
        tables++;
        totalRecords += tableData.length;
        tableData.forEach(item => {
          const amount = parseFloat(item.montant || item.montant_total || item.montant_taxe || 0);
          totalAmount += amount;
        });
      }
    });

    return { totalAmount, totalRecords, tables };
  };

  const stats = calculateStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Prévisualisation des Données - {templateName || "Export"}
          </DialogTitle>
          <DialogDescription>
            Visualisez vos données sous forme de graphiques avant l'export
          </DialogDescription>
        </DialogHeader>

        {/* Statistiques globales */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.totalRecords} enregistrements
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enregistrements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">
                Dans {stats.tables} tables
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date d'export</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(), 'dd MMM', { locale: fr })}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'yyyy', { locale: fr })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts">Graphiques</TabsTrigger>
            <TabsTrigger value="data">Données</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            {/* Graphique des montants mensuels */}
            {chartData.monthly.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Évolution Mensuelle des Montants
                  </CardTitle>
                  <CardDescription>Montants et nombre de transactions par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mois" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'montant') return [formatCurrency(value), 'Montant'];
                          return [value, 'Nombre'];
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="montant" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="montant" />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} name="count" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Répartition par statut */}
              {chartData.byStatus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      Répartition par Statut
                    </CardTitle>
                    <CardDescription>Distribution des montants selon le statut</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={chartData.byStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {chartData.byStatus.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Montants par table */}
              {chartData.byTable.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Montants par Source
                    </CardTitle>
                    <CardDescription>Total des montants par table de données</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData.byTable}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                        <YAxis stroke="hsl(var(--foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tendances annuelles */}
            {chartData.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tendances Annuelles
                  </CardTitle>
                  <CardDescription>Évolution des licences par année</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="annee" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'montant') return [formatCurrency(value), 'Montant'];
                          return [value, 'Nombre'];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="montant" stroke="hsl(var(--primary))" strokeWidth={2} name="montant" />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} name="count" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            {Object.entries(data).map(([tableName, tableData]: [string, any]) => {
              if (!Array.isArray(tableData) || tableData.length === 0) return null;

              const columns = Object.keys(tableData[0]);
              const previewRows = tableData.slice(0, 10);

              return (
                <Card key={tableName}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tableName}</span>
                      <Badge variant="secondary">{tableData.length} lignes</Badge>
                    </CardTitle>
                    <CardDescription>
                      Aperçu des 10 premières lignes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map(col => (
                              <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row: any, idx: number) => (
                            <TableRow key={idx}>
                              {columns.map(col => (
                                <TableCell key={col} className="whitespace-nowrap">
                                  {row[col]?.toString() || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
