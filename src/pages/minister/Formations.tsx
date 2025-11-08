import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommandationsFormation } from "@/components/minister/RecommandationsFormation";
import { SuiviFormations } from "@/components/minister/SuiviFormations";
import { BudgetFormations } from "@/components/minister/BudgetFormations";
import { ComparaisonRegionaleFormations } from "@/components/minister/ComparaisonRegionaleFormations";
import { GestionFormateurs } from "@/components/minister/GestionFormateurs";
import { RecommandationFormateurs } from "@/components/minister/RecommandationFormateurs";
import { SimpleCalendrierFormations } from "@/components/minister/SimpleCalendrierFormations";
import { GanttFormateurs } from "@/components/minister/GanttFormateurs";
import { AnalyticsFormations } from "@/components/minister/AnalyticsFormations";
import { PredictionsFormations } from "@/components/minister/PredictionsFormations";
import { ValidationFormations } from "@/components/minister/ValidationFormations";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  CheckSquare,
  Brain
} from "lucide-react";

export default function Formations() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des Formations</h2>
        <p className="text-sm text-muted-foreground">Planification, suivi et évaluation des formations</p>
      </div>
      
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="predictions" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Prédictions IA</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Validation</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Planification</span>
          </TabsTrigger>
          <TabsTrigger value="suivi" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Suivi</span>
          </TabsTrigger>
          <TabsTrigger value="formateurs" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Formateurs</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytiques</span>
          </TabsTrigger>
          <TabsTrigger value="recommandations" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Recommandations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionsFormations />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <ValidationFormations />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <SimpleCalendrierFormations />
          <GanttFormateurs />
        </TabsContent>

        <TabsContent value="suivi" className="space-y-4">
          <SuiviFormations />
          <ComparaisonRegionaleFormations />
        </TabsContent>

        <TabsContent value="formateurs" className="space-y-4">
          <GestionFormateurs />
          <RecommandationFormateurs />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetFormations />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsFormations />
        </TabsContent>

        <TabsContent value="recommandations" className="space-y-4">
          <RecommandationsFormation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
