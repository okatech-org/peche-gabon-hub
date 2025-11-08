import MinisterHistory from "@/components/minister/MinisterHistory";
import AlertesRapportsPanel from "@/components/minister/AlertesRapportsPanel";
import { SeuilsAlertesManagement } from "@/components/minister/SeuilsAlertesManagement";
import { AnalysePredictiveActions } from "@/components/minister/AnalysePredictiveActions";
import { RecommandationsFormation } from "@/components/minister/RecommandationsFormation";
import { SuiviFormations } from "@/components/minister/SuiviFormations";
import { BudgetFormations } from "@/components/minister/BudgetFormations";
import { ComparaisonRegionaleFormations } from "@/components/minister/ComparaisonRegionaleFormations";
import { GestionFormateurs } from "@/components/minister/GestionFormateurs";
import { RecommandationFormateurs } from "@/components/minister/RecommandationFormateurs";
import { HistoriqueRecommandations } from "@/components/minister/HistoriqueRecommandations";
import { SimpleCalendrierFormations } from "@/components/minister/SimpleCalendrierFormations";
import { GanttFormateurs } from "@/components/minister/GanttFormateurs";
import { AnalyticsFormations } from "@/components/minister/AnalyticsFormations";
import { PredictionsFormations } from "@/components/minister/PredictionsFormations";
import { ValidationFormations } from "@/components/minister/ValidationFormations";

export default function History() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historique & Archives</h2>
        <p className="text-sm text-muted-foreground">Réglementations, notifications et audit</p>
      </div>
      
      <div className="grid gap-6">
        <AlertesRapportsPanel />
        <SeuilsAlertesManagement />
        <AnalysePredictiveActions />
        <RecommandationsFormation />
        <SimpleCalendrierFormations />
        <SuiviFormations />
        <BudgetFormations />
        <ComparaisonRegionaleFormations />
        <GestionFormateurs />
        <RecommandationFormateurs />
        <HistoriqueRecommandations />
        <PredictionsFormations />
        <ValidationFormations />
        <AnalyticsFormations />
        <GanttFormateurs />
        <MinisterHistory />
      </div>
    </div>
  );
}