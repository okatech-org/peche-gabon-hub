import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Anchor, TrendingUp, Users, Ship, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { InstitutionWorkflowsPanel } from "@/components/workflows/InstitutionWorkflowsPanel";

export default function ANPADashboard() {
  const [stats, setStats] = useState({
    totalCaptures: 0,
    cooperatives: 0,
    pirogues: 0,
    formations: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [capturesRes, coopsRes, piroguesRes] = await Promise.all([
        supabase.from('captures_pa').select('id', { count: 'exact', head: true }),
        supabase.from('cooperatives').select('id', { count: 'exact', head: true }),
        supabase.from('pirogues').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalCaptures: capturesRes.count || 0,
        cooperatives: coopsRes.count || 0,
        pirogues: piroguesRes.count || 0,
        formations: 0, // À implémenter
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ANPA Dashboard</h1>
          <p className="text-muted-foreground">
            Agence nationale des Pêches et de l'Aquaculture
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-600" />
                Total Captures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.totalCaptures}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Coopératives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.cooperatives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-blue-600" />
                Pirogues Enregistrées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.pirogues}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Formations Actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.formations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="operations">Opérations</TabsTrigger>
            <TabsTrigger value="gab-peche">Projet Gab Pêche</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missions Principales</CardTitle>
                  <CardDescription>Exécution opérationnelle de la politique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Anchor className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Exécution Politique Gouvernementale</h4>
                      <p className="text-sm text-muted-foreground">
                        Mise en œuvre opérationnelle des directives du secteur
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Structuration de la Filière</h4>
                      <p className="text-sm text-muted-foreground">
                        Organisation et accompagnement des acteurs (pêcheurs, marieuses, coopératives)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Développement Aquaculture</h4>
                      <p className="text-sm text-muted-foreground">
                        Promotion et développement de l'aquaculture nationale
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statut de l'Agence</CardTitle>
                  <CardDescription>Établissement public sous tutelle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-cyan-500/10 border border-cyan-200 rounded-lg">
                    <h4 className="font-semibold text-cyan-900 mb-2">Tutelle Ministérielle</h4>
                    <p className="text-sm text-muted-foreground">
                      Sous l'autorité du Ministère de la Mer, de la Pêche et de l'Économie bleue
                    </p>
                  </div>

                  <div className="p-4 bg-purple-500/10 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Autonomie Opérationnelle</h4>
                    <p className="text-sm text-muted-foreground">
                      Établissement public avec capacité de gestion autonome
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <InstitutionWorkflowsPanel
              institutionCode="anpa"
              institutionName="ANPA"
            />
          </TabsContent>

          <TabsContent value="gab-peche" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projet Gab Pêche</CardTitle>
                <CardDescription>Initiative pour la souveraineté halieutique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Objectifs du Projet</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Équipement des pêcheurs artisanaux</li>
                    <li>Formation technique et gestion</li>
                    <li>Circuits de commercialisation réservés aux marieuses</li>
                    <li>Baisse des prix du poisson</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
