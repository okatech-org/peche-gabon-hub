import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { CreateWorkflowDialog } from "./CreateWorkflowDialog";
import { WorkflowDetailDialog } from "./WorkflowDetailDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InstitutionWorkflowsPanelProps {
  institutionCode: string;
  institutionName: string;
}

const statutColors = {
  brouillon: "bg-gray-500",
  en_attente: "bg-yellow-500",
  en_cours: "bg-blue-500",
  valide: "bg-green-500",
  rejete: "bg-red-500",
  cloture: "bg-gray-700",
};

const prioriteColors = {
  basse: "border-gray-300",
  moyenne: "border-yellow-300",
  haute: "border-orange-500",
  urgente: "border-red-500",
};

export function InstitutionWorkflowsPanel({ institutionCode, institutionName }: InstitutionWorkflowsPanelProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: workflowsEntrants = [], isLoading: loadingEntrants, refetch: refetchEntrants } = useQuery({
    queryKey: ["workflows-entrants", institutionCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows_inter_institutionnels")
        .select("*")
        .eq("institution_destinataire", institutionCode)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: workflowsSortants = [], isLoading: loadingSortants, refetch: refetchSortants } = useQuery({
    queryKey: ["workflows-sortants", institutionCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows_inter_institutionnels")
        .select("*")
        .eq("institution_emettrice", institutionCode)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleViewWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setDetailDialogOpen(true);
  };

  const handleWorkflowCreated = () => {
    refetchEntrants();
    refetchSortants();
  };

  const handleWorkflowUpdated = () => {
    refetchEntrants();
    refetchSortants();
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "valide":
        return <CheckCircle className="h-4 w-4" />;
      case "rejete":
        return <XCircle className="h-4 w-4" />;
      case "en_cours":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderWorkflowCard = (workflow: any, isEntrant: boolean) => (
    <div
      key={workflow.id}
      className={`p-4 border-l-4 ${prioriteColors[workflow.priorite as keyof typeof prioriteColors]} bg-card rounded-lg hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => handleViewWorkflow(workflow.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={`${statutColors[workflow.statut as keyof typeof statutColors]} text-white`}>
              {getStatutIcon(workflow.statut)}
              <span className="ml-1 capitalize">{workflow.statut.replace("_", " ")}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              {workflow.numero_reference}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {workflow.priorite}
            </Badge>
          </div>
          
          <h4 className="font-semibold text-foreground line-clamp-1">{workflow.objet}</h4>
          
          {workflow.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {workflow.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {isEntrant ? (
                <>
                  <span>De:</span>
                  <Badge variant="outline" className="text-xs">
                    {workflow.institution_emettrice.toUpperCase()}
                  </Badge>
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-xs">
                    {workflow.institution_destinataire.toUpperCase()}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(workflow.created_at), "dd MMM yyyy", { locale: fr })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Workflows Inter-Institutionnels
              </CardTitle>
              <CardDescription>
                Coordination et échanges avec les autres institutions
              </CardDescription>
            </div>
            <CreateWorkflowDialog
              institutionEmettrice={institutionCode}
              onWorkflowCreated={handleWorkflowCreated}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrants" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrants" className="gap-2">
                Workflows Entrants
                {workflowsEntrants.length > 0 && (
                  <Badge variant="secondary">{workflowsEntrants.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sortants" className="gap-2">
                Workflows Sortants
                {workflowsSortants.length > 0 && (
                  <Badge variant="secondary">{workflowsSortants.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrants" className="space-y-3">
              {loadingEntrants ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : workflowsEntrants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun workflow entrant
                </div>
              ) : (
                workflowsEntrants.map((workflow) => renderWorkflowCard(workflow, true))
              )}
            </TabsContent>

            <TabsContent value="sortants" className="space-y-3">
              {loadingSortants ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : workflowsSortants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun workflow sortant
                </div>
              ) : (
                workflowsSortants.map((workflow) => renderWorkflowCard(workflow, false))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedWorkflowId && (
        <WorkflowDetailDialog
          workflowId={selectedWorkflowId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onWorkflowUpdated={handleWorkflowUpdated}
        />
      )}
    </>
  );
}
