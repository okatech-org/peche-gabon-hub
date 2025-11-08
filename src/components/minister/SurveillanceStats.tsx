import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SurveillanceMap from "./SurveillanceMap";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const SurveillanceStats = () => {
  // Données simulées pour l'évolution des infractions par mois
  const infractionsData = [
    { mois: "Jan", typeA: 8, typeB: 12, typeC: 5 },
    { mois: "Fév", typeA: 6, typeB: 15, typeC: 7 },
    { mois: "Mar", typeA: 10, typeB: 10, typeC: 6 },
    { mois: "Avr", typeA: 7, typeB: 13, typeC: 8 },
    { mois: "Mai", typeA: 9, typeB: 11, typeC: 4 },
    { mois: "Juin", typeA: 5, typeB: 14, typeC: 9 },
    { mois: "Juil", typeA: 11, typeB: 9, typeC: 5 },
    { mois: "Août", typeA: 8, typeB: 12, typeC: 7 },
    { mois: "Sep", typeA: 6, typeB: 10, typeC: 6 },
    { mois: "Oct", typeA: 9, typeB: 13, typeC: 8 },
    { mois: "Nov", typeA: 7, typeB: 11, typeC: 5 },
    { mois: "Déc", typeA: 10, typeB: 14, typeC: 9 },
  ];

  const chartConfig = {
    typeA: {
      label: "Type A (Majeure)",
      color: "hsl(var(--chart-1))",
    },
    typeB: {
      label: "Type B (Moyenne)",
      color: "hsl(var(--chart-2))",
    },
    typeC: {
      label: "Type C (Mineure)",
      color: "hsl(var(--chart-3))",
    },
  };

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

      <SurveillanceMap />

      <Card>
        <CardHeader>
          <CardTitle>Évolution des Infractions</CardTitle>
          <CardDescription>Par mois et par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={infractionsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mois" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="square"
                />
                <Bar 
                  dataKey="typeA" 
                  stackId="a" 
                  fill="var(--color-typeA)" 
                  name="Type A (Majeure)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="typeB" 
                  stackId="a" 
                  fill="var(--color-typeB)" 
                  name="Type B (Moyenne)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="typeC" 
                  stackId="a" 
                  fill="var(--color-typeC)" 
                  name="Type C (Mineure)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveillanceStats;
