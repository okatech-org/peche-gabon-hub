import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, DollarSign, BarChart3 } from "lucide-react";
import { MembresCooperative } from "@/components/cooperative/MembresCooperative";
import { TaxesCooperative } from "@/components/cooperative/TaxesCooperative";
import { PaiementsCooperative } from "@/components/cooperative/PaiementsCooperative";
import { StatistiquesCooperative } from "@/components/cooperative/StatistiquesCooperative";

export default function CooperativeDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion de Coopérative</h1>
        <p className="text-muted-foreground">
          Gérez les membres, taxes et paiements collectifs de votre coopérative
        </p>
      </div>

      <Tabs defaultValue="taxes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Taxes des Membres
          </TabsTrigger>
          <TabsTrigger value="paiements" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Paiements Groupés
          </TabsTrigger>
          <TabsTrigger value="membres" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membres
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxes" className="space-y-6 mt-6">
          <TaxesCooperative />
        </TabsContent>

        <TabsContent value="paiements" className="space-y-6 mt-6">
          <PaiementsCooperative />
        </TabsContent>

        <TabsContent value="membres" className="space-y-6 mt-6">
          <MembresCooperative />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6 mt-6">
          <StatistiquesCooperative />
        </TabsContent>
      </Tabs>
    </div>
  );
}
