import EconomicStats from "@/components/minister/EconomicStats";
import FiscalStatsMinister from "@/components/minister/FiscalStatsMinister";
import CSVDataExplorer from "@/components/admin/CSVDataExplorer";
import { RemonteesInstitutionnellesDashboard } from "@/components/minister/RemonteesInstitutionnellesDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Economy() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Économie & Finances de la Pêche</h2>
        <p className="text-sm text-muted-foreground">
          Vue complète des statistiques économiques, fiscales et répartition institutionnelle
        </p>
      </div>
      
      <Tabs defaultValue="fiscal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fiscal">Taxes Collectées</TabsTrigger>
          <TabsTrigger value="institutional">Répartition Institutionnelle</TabsTrigger>
          <TabsTrigger value="data">Données Détaillées</TabsTrigger>
          <TabsTrigger value="economy">Économie & Exportations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fiscal" className="mt-6">
          <FiscalStatsMinister />
        </TabsContent>
        
        <TabsContent value="institutional" className="mt-6">
          <RemonteesInstitutionnellesDashboard />
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <CSVDataExplorer />
        </TabsContent>
        
        <TabsContent value="economy" className="mt-6">
          <EconomicStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}