import { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Area, AreaChart 
} from "recharts";
import { 
  GripVertical, Settings, Save, RotateCcw, Plus, 
  TrendingUp, DollarSign, Calendar, FileText, 
  BarChart3, PieChartIcon, Eye, EyeOff, Maximize2, Minimize2
} from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4'
];

interface ChartConfig {
  id: string;
  type: 'monthly' | 'status' | 'table' | 'trends' | 'stats';
  title: string;
  description: string;
  icon: any;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
}

interface DashboardLayout {
  userId?: string;
  charts: ChartConfig[];
  gridCols: number;
}

const defaultCharts: ChartConfig[] = [
  {
    id: 'stats',
    type: 'stats',
    title: 'Statistiques Globales',
    description: 'Vue d\'ensemble des métriques clés',
    icon: DollarSign,
    visible: true,
    order: 0,
    size: 'full'
  },
  {
    id: 'monthly',
    type: 'monthly',
    title: 'Évolution Mensuelle',
    description: 'Montants et transactions par mois',
    icon: TrendingUp,
    visible: true,
    order: 1,
    size: 'large'
  },
  {
    id: 'status',
    type: 'status',
    title: 'Répartition par Statut',
    description: 'Distribution des montants',
    icon: PieChartIcon,
    visible: true,
    order: 2,
    size: 'medium'
  },
  {
    id: 'table',
    type: 'table',
    title: 'Montants par Source',
    description: 'Total par table de données',
    icon: BarChart3,
    visible: true,
    order: 3,
    size: 'medium'
  },
  {
    id: 'trends',
    type: 'trends',
    title: 'Tendances Annuelles',
    description: 'Évolution sur plusieurs années',
    icon: Calendar,
    visible: true,
    order: 4,
    size: 'large'
  }
];

interface DraggableChartProps {
  chart: ChartConfig;
  index: number;
  moveChart: (dragIndex: number, hoverIndex: number) => void;
  onSizeChange: (chartId: string, size: ChartConfig['size']) => void;
  children: React.ReactNode;
}

const DraggableChart = ({ chart, index, moveChart, onSizeChange, children }: DraggableChartProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'CHART',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CHART',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveChart(item.index, index);
        item.index = index;
      }
    },
  });

  const sizeOptions: Array<{ value: ChartConfig['size']; label: string; icon: any }> = [
    { value: 'small', label: 'Petit', icon: Minimize2 },
    { value: 'medium', label: 'Moyen', icon: BarChart3 },
    { value: 'large', label: 'Grand', icon: Maximize2 },
    { value: 'full', label: 'Pleine largeur', icon: Maximize2 }
  ];

  const getSizeClass = (size: ChartConfig['size']) => {
    switch (size) {
      case 'small':
        return 'md:col-span-1';
      case 'medium':
        return 'md:col-span-1';
      case 'large':
        return 'md:col-span-2';
      case 'full':
        return 'col-span-full';
      default:
        return 'md:col-span-1';
    }
  };

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'} ${getSizeClass(chart.size)}`}
    >
      <Card className="relative group h-full">
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex items-center gap-1 bg-background/95 border rounded-md p-1 shadow-sm">
            {sizeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={chart.size === option.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onSizeChange(chart.id, option.value)}
                  title={option.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              );
            })}
          </div>
          <div
            ref={drag}
            className="cursor-move bg-background/95 border rounded-md p-1.5 shadow-sm"
            title="Déplacer"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {children}
      </Card>
    </div>
  );
};

interface CustomizableFinancialDashboardProps {
  data: any;
}

export const CustomizableFinancialDashboard = ({ data }: CustomizableFinancialDashboardProps) => {
  const [charts, setCharts] = useState<ChartConfig[]>(defaultCharts);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = () => {
    try {
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        const layout: DashboardLayout = JSON.parse(saved);
        setCharts(layout.charts);
      }
    } catch (error) {
      console.error('Error loading layout:', error);
    }
  };

  const saveLayout = () => {
    setLoading(true);
    try {
      const layout: DashboardLayout = {
        charts,
        gridCols: 2
      };

      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
      toast.success('Disposition sauvegardée');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const resetLayout = () => {
    setCharts(defaultCharts);
    toast.info('Disposition réinitialisée');
  };

  const moveChart = (dragIndex: number, hoverIndex: number) => {
    const updatedCharts = [...charts];
    const [removed] = updatedCharts.splice(dragIndex, 1);
    updatedCharts.splice(hoverIndex, 0, removed);
    
    // Mettre à jour les ordres
    updatedCharts.forEach((chart, index) => {
      chart.order = index;
    });
    
    setCharts(updatedCharts);
  };

  const toggleChartVisibility = (chartId: string) => {
    setCharts(charts.map(c => 
      c.id === chartId ? { ...c, visible: !c.visible } : c
    ));
  };

  const changeChartSize = (chartId: string, size: ChartConfig['size']) => {
    setCharts(charts.map(c => 
      c.id === chartId ? { ...c, size } : c
    ));
    toast.info(`Taille du graphique mise à jour`);
  };

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    const chartData: any = {
      monthly: [],
      byStatus: [],
      byTable: [],
      trends: []
    };

    if (!data) return chartData;

    // Données mensuelles
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

    // Tendances temporelles
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

  const calculateStats = () => {
    if (!data) return { totalAmount: 0, totalRecords: 0, tables: 0 };
    
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

  const renderChart = (chart: ChartConfig, index: number) => {
    if (!chart.visible) return null;

    const Icon = chart.icon;

    switch (chart.type) {
      case 'stats':
        return (
          <DraggableChart key={chart.id} chart={chart} index={index} moveChart={moveChart} onSizeChange={changeChartSize}>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Montant Total
                  </div>
                  <div className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                  <p className="text-xs text-muted-foreground">Sur {stats.totalRecords} enregistrements</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Enregistrements
                  </div>
                  <div className="text-3xl font-bold">{stats.totalRecords}</div>
                  <p className="text-xs text-muted-foreground">Dans {stats.tables} tables</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Date d'export
                  </div>
                  <div className="text-3xl font-bold">{new Date().getDate()}</div>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </DraggableChart>
        );

      case 'monthly':
        if (chartData.monthly.length === 0) return null;
        return (
          <DraggableChart key={chart.id} chart={chart} index={index} moveChart={moveChart} onSizeChange={changeChartSize}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {chart.title}
              </CardTitle>
              <CardDescription>{chart.description}</CardDescription>
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
                  <Area type="monotone" dataKey="montant" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </DraggableChart>
        );

      case 'status':
        if (chartData.byStatus.length === 0) return null;
        return (
          <DraggableChart key={chart.id} chart={chart} index={index} moveChart={moveChart} onSizeChange={changeChartSize}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {chart.title}
              </CardTitle>
              <CardDescription>{chart.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {chartData.byStatus.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
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
          </DraggableChart>
        );

      case 'table':
        if (chartData.byTable.length === 0) return null;
        return (
          <DraggableChart key={chart.id} chart={chart} index={index} moveChart={moveChart} onSizeChange={changeChartSize}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {chart.title}
              </CardTitle>
              <CardDescription>{chart.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
          </DraggableChart>
        );

      case 'trends':
        if (chartData.trends.length === 0) return null;
        return (
          <DraggableChart key={chart.id} chart={chart} index={index} moveChart={moveChart} onSizeChange={changeChartSize}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {chart.title}
              </CardTitle>
              <CardDescription>{chart.description}</CardDescription>
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
                  <Line type="monotone" dataKey="montant" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </DraggableChart>
        );

      default:
        return null;
    }
  };

  const visibleCharts = charts.filter(c => c.visible).sort((a, b) => a.order - b.order);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Tableau de Bord Personnalisé</h3>
            <p className="text-sm text-muted-foreground">
              Glissez-déposez les graphiques pour réorganiser votre tableau de bord
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuration du Tableau de Bord</DialogTitle>
                  <DialogDescription>
                    Sélectionnez les graphiques à afficher
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {charts.map(chart => {
                    const Icon = chart.icon;
                    return (
                      <div key={chart.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={chart.id}
                          checked={chart.visible}
                          onCheckedChange={() => toggleChartVisibility(chart.id)}
                        />
                        <Label
                          htmlFor={chart.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{chart.title}</div>
                            <div className="text-xs text-muted-foreground">{chart.description}</div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            
            <Button size="sm" onClick={saveLayout} disabled={loading}>
              {loading ? (
                <>Sauvegarde...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        {visibleCharts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun graphique sélectionné</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSettingsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des graphiques
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleCharts.map((chart, index) => renderChart(chart, index))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4" />
              <span>Déplacer</span>
            </div>
            <div className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4" />
              <span>Petit</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Moyen</span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              <span>Grand / Pleine largeur</span>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
