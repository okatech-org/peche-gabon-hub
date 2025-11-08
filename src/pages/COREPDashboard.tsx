import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Briefcase, TrendingUp } from "lucide-react";
import { useState } from "react";
import { InstitutionWorkflowsPanel } from "@/components/workflows/InstitutionWorkflowsPanel";

export default function COREPDashboard() {
  const [stats] = useState({
    membresActifs: 156,
    employesTotal: 3200,
    entreprises: 42,
    tauxCroissance: 8.5,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">COREP Dashboard</h1>
            <p className="text-muted-foreground">
              Confédération des opérateurs économiques de la pêche
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Membres Actifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.membresActifs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Employés Secteur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.employesTotal.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Entreprises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.entreprises}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Croissance (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">+{stats.tauxCroissance}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="secteurs">Secteurs</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Missions Principales</CardTitle>
                <CardDescription>Représentation du secteur privé</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Représentation Professionnelle</h4>
                    <p className="text-sm text-muted-foreground">
                      Défense des intérêts des opérateurs économiques du secteur pêche
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Dialogue Public-Privé</h4>
                    <p className="text-sm text-muted-foreground">
                      Interface entre le secteur privé et les autorités
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Développement du Secteur</h4>
                    <p className="text-sm text-muted-foreground">
                      Promotion de la croissance et de la compétitivité
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="secteurs" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Branches d'Activité</CardTitle>
                  <CardDescription>Secteurs représentés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-200 rounded-lg">
                    <h4 className="font-semibold text-cyan-900 mb-1">Pêche Artisanale</h4>
                    <p className="text-sm text-muted-foreground">
                      Pêcheurs, coopératives, mareyeurs
                    </p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-1">Pêche Industrielle</h4>
                    <p className="text-sm text-muted-foreground">
                      Armateurs, sociétés thonières, conserveries
                    </p>
                  </div>

                  <div className="p-3 bg-purple-500/10 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-1">Aquaculture</h4>
                    <p className="text-sm text-muted-foreground">
                      Producteurs, transformateurs, distributeurs
                    </p>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-1">Services Annexes</h4>
                    <p className="text-sm text-muted-foreground">
                      Équipementiers, fournisseurs, logistique
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Partenariats Institutionnels</CardTitle>
                  <CardDescription>Collaboration avec les institutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-cyan-600" />
                    <span className="text-sm">DGPA - Politiques sectorielles</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-cyan-500" />
                    <span className="text-sm">ANPA - Développement PA</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="text-sm">AGASA - Normes sanitaires</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-sm">DGMM - Sécurité navires</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-amber-600" />
                    <span className="text-sm">DGDDI - Aspects douaniers</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="h-2 w-2 rounded-full bg-teal-600" />
                    <span className="text-sm">OPRAG - Infrastructure portuaire</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <InstitutionWorkflowsPanel
              institutionCode="corep"
              institutionName="COREP"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
