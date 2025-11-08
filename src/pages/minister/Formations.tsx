import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Brain,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Formations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("predictions");

  const searchableContent = {
    predictions: ["prédictions", "ia", "intelligence artificielle", "besoins", "automatique"],
    validation: ["validation", "approuver", "rejeter", "vérifier", "confirmer"],
    planning: ["calendrier", "planification", "dates", "programme", "gantt", "timeline"],
    suivi: ["suivi", "progression", "tracking", "évolution", "comparaison", "régionale"],
    formateurs: ["formateurs", "instructeurs", "enseignants", "professeurs", "évaluations"],
    budget: ["budget", "coût", "financement", "dépenses", "montant"],
    analytics: ["analytiques", "statistiques", "données", "graphiques", "métriques"],
    recommandations: ["recommandations", "suggestions", "conseils", "préconisations"]
  };

  const filteredTabs = Object.entries(searchableContent).filter(([tab, keywords]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return keywords.some(keyword => keyword.includes(query)) || 
           tab.toLowerCase().includes(query);
  });

  const handleClearSearch = () => {
    setSearchQuery("");
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Formations</h2>
          <p className="text-sm text-muted-foreground">Planification, suivi et évaluation des formations</p>
        </div>
      </div>

      {/* Barre de recherche globale */}
      <Card className="p-4 bg-muted/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans les formations (formateurs, budget, planning, prédictions...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && filteredTabs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Résultats dans:</span>
            {filteredTabs.map(([tab]) => (
              <Button
                key={tab}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveTab(tab);
                }}
                className="h-7 text-xs animate-scale-in"
              >
                {tab === "predictions" && "Prédictions IA"}
                {tab === "validation" && "Validation"}
                {tab === "planning" && "Planification"}
                {tab === "suivi" && "Suivi"}
                {tab === "formateurs" && "Formateurs"}
                {tab === "budget" && "Budget"}
                {tab === "analytics" && "Analytiques"}
                {tab === "recommandations" && "Recommandations"}
              </Button>
            ))}
          </div>
        )}
        {searchQuery && filteredTabs.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Aucun résultat trouvé pour "{searchQuery}"</p>
        )}
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
