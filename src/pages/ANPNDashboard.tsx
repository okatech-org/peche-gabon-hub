import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Shield, AlertTriangle, Fish } from "lucide-react";
import { useState } from "react";
import { InstitutionWorkflowsPanel } from "@/components/workflows/InstitutionWorkflowsPanel";

export default function ANPNDashboard() {
  const [stats] = useState({
    airesMarinesProtegees: 9,
    tauxCouvertureZEE: 24,
    patrouillesMois: 18,
    alertesINN: 3,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ANPN Dashboard</h1>
          <p className="text-muted-foreground">
            Agence Nationale des Parcs nationaux
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-600" />
                Aires Marines Protégées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.airesMarinesProtegees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-blue-600" />
                Couverture ZEE (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.tauxCouvertureZEE}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-600" />
                Patrouilles ce Mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.patrouillesMois}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Alertes Pêche INN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.alertesINN}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="amp">Aires Marines Protégées</TabsTrigger>
            <TabsTrigger value="lutte-inn">Lutte contre Pêche INN</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Missions Principales</CardTitle>
                <CardDescription>Conservation marine et lutte contre pêche INN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <TreePine className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Gestion Aires Marines Protégées</h4>
                    <p className="text-sm text-muted-foreground">
                      ~24% de la ZEE sous protection (réseau AMP)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Lutte contre Pêche INN</h4>
                    <p className="text-sm text-muted-foreground">
                      Partenariat avec WCS, USFWS, Global Fishing Watch
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Fish className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Plan de Gestion des Pêches</h4>
                    <p className="text-sm text-muted-foreground">
                      Contribution au plan national de gestion durable
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Réseau d'Aires Marines Protégées</CardTitle>
                <CardDescription>24% de la ZEE gabonaise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-500/10 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Couverture Exceptionnelle</h4>
                  <p className="text-sm text-muted-foreground">
                    Le Gabon possède l'un des plus vastes réseaux d'AMP d'Afrique centrale, 
                    contribuant à la conservation de la biodiversité marine et à la gestion durable des stocks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lutte-inn" className="space-y-4">
            <InstitutionWorkflowsPanel
              institutionCode="anpn"
              institutionName="ANPN"
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
