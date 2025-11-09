import EconomicStats from "@/components/minister/EconomicStats";
import FiscalStatsMinister from "@/components/minister/FiscalStatsMinister";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Economy() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Économie & Finances de la Pêche</h2>
        <p className="text-sm text-muted-foreground">Statistiques économiques, fiscales et exportations</p>
      </div>
      
      <Tabs defaultValue="fiscal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fiscal">Statistiques Fiscales</TabsTrigger>
          <TabsTrigger value="economy">Économie & Exportations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fiscal" className="mt-6">
          <FiscalStatsMinister />
        </TabsContent>
        
        <TabsContent value="economy" className="mt-6">
          <EconomicStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}