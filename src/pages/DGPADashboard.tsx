import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, AlertCircle, CheckCircle, Clock, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { CreateWorkflowDialog } from "@/components/workflows/CreateWorkflowDialog";
import { WorkflowsList } from "@/components/workflows/WorkflowsList";

export default function DGPADashboard() {
  const [stats, setStats] = useState({
    licencesActives: 0,
    licencesEnAttente: 0,
    licencesExpirées: 0,
    licencesAnnee: 0,
    tauxConformite: 0,
  });
  const [loading, setLoading] = useState(true);
  const [workflowRefresh, setWorkflowRefresh] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const anneeActuelle = new Date().getFullYear();
      
      const { data: licences } = await supabase
        .from('licences')
        .select('statut, annee');

      if (licences) {
        setStats({
          licencesActives: licences.filter(l => l.statut === 'active').length,
          licencesEnAttente: licences.filter(l => l.statut === 'en_attente').length,
          licencesExpirées: licences.filter(l => l.statut === 'expiree').length,
          licencesAnnee: licences.filter(l => l.annee === anneeActuelle).length,
          tauxConformite: licences.length > 0 
            ? Math.round((licences.filter(l => l.statut === 'active').length / licences.length) * 100)
            : 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Actives', value: stats.licencesActives, color: '#22c55e' },
    { name: 'En attente', value: stats.licencesEnAttente, color: '#f59e0b' },
    { name: 'Expirées', value: stats.licencesExpirées, color: '#ef4444' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">DGPA Dashboard</h1>
          <p className="text-muted-foreground">
            Direction générale des Pêches et de l'Aquaculture
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Licences Actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.licencesActives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                En Attente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.licencesEnAttente}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Expirées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.licencesExpirées}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Licences {new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.licencesAnnee}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Taux Conformité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.tauxConformite}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="licences">Gestion Licences</TabsTrigger>
            <TabsTrigger value="workflows">Workflows Inter-institutionnels</TabsTrigger>
            <TabsTrigger value="conformite">Conformité</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Licences</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missions Principales</CardTitle>
                  <CardDescription>Responsabilités DGPA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Délivrance des Licences</h4>
                      <p className="text-sm text-muted-foreground">
                        Gestion et attribution des licences de pêche artisanale et industrielle
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Application du Code des Pêches</h4>
                      <p className="text-sm text-muted-foreground">
                        Veille à l'application de la Loi n°015/2005
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Suivi de la Filière</h4>
                      <p className="text-sm text-muted-foreground">
                        Supervision technique du secteur halieutique national
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="licences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Licences de Pêche</CardTitle>
                <CardDescription>Suivi des demandes et renouvellements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de gestion détaillée des licences en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Échanges Inter-institutionnels
                    </CardTitle>
                    <CardDescription>
                      Coordination et traçabilité avec AGASA, ANPA, OPRAG, etc.
                    </CardDescription>
                  </div>
                  <CreateWorkflowDialog
                    institutionEmettrice="dgpa"
                    onWorkflowCreated={() => setWorkflowRefresh(prev => prev + 1)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <WorkflowsList 
                  institutionCode="dgpa"
                  refreshTrigger={workflowRefresh}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conformite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conformité Réglementaire</CardTitle>
                <CardDescription>Application du Code des Pêches</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de suivi de conformité en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
