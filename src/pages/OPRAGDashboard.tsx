import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Anchor, Ship, Package, TrendingUp } from "lucide-react";
import { useState } from "react";
import { InstitutionWorkflowsPanel } from "@/components/workflows/InstitutionWorkflowsPanel";

export default function OPRAGDashboard() {
  const [stats] = useState({
    naviresAccostes: 23,
    debarquementsJour: 15,
    tonnageDebarque: 145.7,
    operationsEnCours: 8,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-teal-500/10">
            <Anchor className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">OPRAG Dashboard</h1>
            <p className="text-muted-foreground">
              Office des Ports et Rades du Gabon
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-teal-600" />
                Navires Accostés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{stats.naviresAccostes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Débarquements Jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.debarquementsJour}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Tonnage Débarqué (T)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.tonnageDebarque}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-purple-600" />
                Opérations en Cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.operationsEnCours}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="debarquements">Débarquements</TabsTrigger>
            <TabsTrigger value="surete">Sûreté Portuaire</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Missions Principales</CardTitle>
                <CardDescription>Autorité portuaire du Gabon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Anchor className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Gestion Portuaire</h4>
                    <p className="text-sm text-muted-foreground">
                      Services d'accostage et opérations portuaires
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Débarquements de Pêche</h4>
                    <p className="text-sm text-muted-foreground">
                      Coordination des débarquements de produits halieutiques
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Ship className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Sûreté et Services</h4>
                    <p className="text-sm text-muted-foreground">
                      Sécurité portuaire et services aux navires
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debarquements" className="space-y-4">
            <InstitutionWorkflowsPanel
              institutionCode="oprag"
              institutionName="OPRAG"
            />
          </TabsContent>

          <TabsContent value="surete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sûreté Portuaire</CardTitle>
                <CardDescription>Code ISPS et sécurité des installations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de sûreté portuaire en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
