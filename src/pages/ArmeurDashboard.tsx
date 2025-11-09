import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Activity, BarChart3, Receipt } from "lucide-react";
import { FlotteArmeur } from "@/components/armeur/FlotteArmeur";
import { MareesArmeur } from "@/components/armeur/MareesArmeur";
import { StatistiquesArmeur } from "@/components/armeur/StatistiquesArmeur";
import { TaxesArmeur } from "@/components/armeur/TaxesArmeur";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function ArmeurDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Espace Armateur</h1>
          <p className="text-muted-foreground">
            Gérez votre flotte, déclarez vos marées et suivez vos statistiques
          </p>
        </div>

        <Tabs defaultValue="flotte" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flotte" className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Ma Flotte
            </TabsTrigger>
            <TabsTrigger value="marees" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Marées
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Taxes & Impôts
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flotte" className="space-y-6 mt-6">
            <FlotteArmeur />
          </TabsContent>

          <TabsContent value="marees" className="space-y-6 mt-6">
            <MareesArmeur />
          </TabsContent>

          <TabsContent value="taxes" className="space-y-6 mt-6">
            <TaxesArmeur />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <StatistiquesArmeur />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
