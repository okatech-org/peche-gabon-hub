import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react";
import { useState } from "react";

export default function AGASADashboard() {
  const [stats] = useState({
    inspectionsJour: 12,
    conformes: 89,
    nonConformes: 3,
    tauxConformite: 96.7,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AGASA Dashboard</h1>
            <p className="text-muted-foreground">
              Agence gabonaise de sécurité alimentaire
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Inspections Aujourd'hui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.inspectionsJour}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Produits Conformes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.conformes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Non Conformes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.nonConformes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Taux Conformité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.tauxConformite}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="controles">Contrôles</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missions Principales</CardTitle>
                  <CardDescription>Contrôle sanitaire des produits halieutiques</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Contrôle Sanitaire</h4>
                      <p className="text-sm text-muted-foreground">
                        Inspection et certification sanitaire des produits de la mer
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Agréments et Certificats</h4>
                      <p className="text-sm text-muted-foreground">
                        Délivrance des agréments sanitaires et certificats d'exportation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Chaîne du Froid</h4>
                      <p className="text-sm text-muted-foreground">
                        Suivi et contrôle de la chaîne du froid (débarquement → consommateur)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zones d'Intervention</CardTitle>
                  <CardDescription>Périmètre de contrôle AGASA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-1">Ports de Débarquement</h4>
                    <p className="text-sm text-muted-foreground">
                      Contrôle sanitaire au débarquement (Port-Gentil, Libreville, etc.)
                    </p>
                  </div>

                  <div className="p-3 bg-purple-500/10 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-1">Marchés et Distribution</h4>
                    <p className="text-sm text-muted-foreground">
                      Inspection des marchés aux poissons et points de vente
                    </p>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-1">Unités de Transformation</h4>
                    <p className="text-sm text-muted-foreground">
                      Agrément et suivi des usines de transformation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="controles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contrôles Sanitaires</CardTitle>
                <CardDescription>Inspections et analyses en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de gestion des contrôles sanitaires en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agréments et Certifications</CardTitle>
                <CardDescription>Gestion des certificats sanitaires</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de certification en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
