import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SurveillanceStats = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Missions</CardTitle>
            <CardDescription>Année en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-muted-foreground mt-2">+12% vs année précédente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Infractions Majeures</CardTitle>
            <CardDescription>Type A</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45</div>
            <p className="text-sm text-green-600 mt-2">-8% vs année précédente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de Contrôle</CardTitle>
            <CardDescription>Pirogues inspectées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">32%</div>
            <p className="text-sm text-muted-foreground mt-2">Du parc total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carte des Infractions</CardTitle>
          <CardDescription>Distribution géographique des contrôles et infractions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Carte interactive en développement</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution des Infractions</CardTitle>
          <CardDescription>Par mois et par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Graphique en développement</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveillanceStats;
