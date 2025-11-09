import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, DollarSign, FileCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { InstitutionWorkflowsPanel } from "@/components/workflows/InstitutionWorkflowsPanel";

export default function DGDDIDashboard() {
  const [stats] = useState({
    declarationsEnCours: 34,
    controlesMois: 67,
    recettesJour: 2450000,
    tauxConformite: 94,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DGDDI Dashboard</h1>
          <p className="text-muted-foreground">
            Direction Générale des Douanes et Droits Indirects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-amber-600" />
                Déclarations en Cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.declarationsEnCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Contrôles ce Mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.controlesMois}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Recettes du Jour (FCFA)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.recettesJour.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Taux Conformité (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.tauxConformite}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="douanes">Douanes Pêche</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Missions Principales</CardTitle>
                <CardDescription>Contrôle douanier et fiscalité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Contrôle des Importations/Exportations</h4>
                    <p className="text-sm text-muted-foreground">
                      Surveillance des flux de produits halieutiques
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Perception Droits et Taxes</h4>
                    <p className="text-sm text-muted-foreground">
                      Recouvrement des droits de douane sur le secteur pêche
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Lutte Contrebande & Fraude</h4>
                    <p className="text-sm text-muted-foreground">
                      Prévention du trafic illégal de produits de la mer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="douanes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Secteur Pêche</CardTitle>
                  <CardDescription>Contrôle douanier spécifique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-1">Importations Produits Pêche</h4>
                    <p className="text-sm text-muted-foreground">
                      Vérification conformité sanitaire et origine
                    </p>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-1">Exportations Thon</h4>
                    <p className="text-sm text-muted-foreground">
                      Contrôle qualité et traçabilité export
                    </p>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-1">Droits Spécifiques</h4>
                    <p className="text-sm text-muted-foreground">
                      Taxation adaptée aux produits halieutiques
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coordination Inter-Services</CardTitle>
                  <CardDescription>Partenariats opérationnels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-cyan-600" />
                    <span className="text-sm">DGPA - Réglementations pêche</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="text-sm">AGASA - Contrôles sanitaires</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-sm">DGMM - Certificats navires</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-teal-600" />
                    <span className="text-sm">OPRAG - Débarquements ports</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <InstitutionWorkflowsPanel
              institutionCode="dgddi"
              institutionName="DGDDI"
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
