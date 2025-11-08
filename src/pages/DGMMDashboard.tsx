import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Shield, Anchor, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function DGMMDashboard() {
  const [stats] = useState({
    naviresActifs: 45,
    inspectionsEnCours: 8,
    certificatsValides: 42,
    alertesSecurite: 2,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-600/10">
            <Ship className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">DGMM Dashboard</h1>
            <p className="text-muted-foreground">
              Direction générale de la Marine marchande
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-blue-600" />
                Navires Actifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.naviresActifs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Inspections en Cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.inspectionsEnCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-cyan-600" />
                Certificats Valides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{stats.certificatsValides}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Alertes Sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.alertesSecurite}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="securite">Sécurité Maritime</TabsTrigger>
            <TabsTrigger value="controle">Contrôle d'État du Port</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Missions Principales</CardTitle>
                <CardDescription>Sécurité des navires et gens de mer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Ship className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Sécurité des Navires</h4>
                    <p className="text-sm text-muted-foreground">
                      Inspection et certification de la sécurité maritime
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Protection Gens de Mer</h4>
                    <p className="text-sm text-muted-foreground">
                      Certificats de compétence et conditions de travail
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Anchor className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Contrôle d'État du Port</h4>
                    <p className="text-sm text-muted-foreground">
                      Inspections des navires étrangers dans les ports gabonais
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="securite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité Maritime</CardTitle>
                <CardDescription>Réglementation et inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de gestion de la sécurité maritime en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contrôle d'État du Port</CardTitle>
                <CardDescription>Inspections PSC (Port State Control)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module de contrôle portuaire en développement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
