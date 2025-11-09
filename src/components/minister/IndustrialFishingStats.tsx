import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Activity, FileText } from "lucide-react";
import { IndustrialFleetOverview } from "./IndustrialFleetOverview";
import { IndustrialFishingActivity } from "./IndustrialFishingActivity";

const IndustrialFishingStats = () => {
  return (
    <Tabs defaultValue="fleet" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fleet" className="flex items-center gap-2">
          <Ship className="h-4 w-4" />
          Flotte & Armements
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activité & Captures
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fleet" className="space-y-6 mt-6">
        <IndustrialFleetOverview />
      </TabsContent>

      <TabsContent value="activity" className="space-y-6 mt-6">
        <IndustrialFishingActivity />
      </TabsContent>
    </Tabs>
  );
};

export default IndustrialFishingStats;
