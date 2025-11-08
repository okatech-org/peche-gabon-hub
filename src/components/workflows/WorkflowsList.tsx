import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Send,
  Inbox
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { WorkflowDetailDialog } from "./WorkflowDetailDialog";

interface Workflow {
  id: string;
  numero_reference: string;
  institution_emettrice: string;
  institution_destinataire: string;
  type_workflow: string;
  objet: string;
  statut: string;
  priorite: string;
  date_creation: string;
  date_echeance: string | null;
}

interface WorkflowsListProps {
  institutionCode: string;
  refreshTrigger?: number;
}

const STATUT_COLORS = {
  en_attente: "bg-amber-500",
  en_cours: "bg-blue-500",
  valide: "bg-green-500",
  refuse: "bg-red-500",
  archive: "bg-gray-500",
};

const STATUT_LABELS = {
  en_attente: "En Attente",
  en_cours: "En Cours",
  valide: "Validé",
  refuse: "Refusé",
  archive: "Archivé",
};

const PRIORITE_COLORS = {
  basse: "border-gray-300",
  normale: "border-blue-300",
  haute: "border-orange-300",
  urgente: "border-red-500",
};

const INSTITUTION_LABELS: Record<string, string> = {
  dgpa: "DGPA",
  anpa: "ANPA",
  agasa: "AGASA",
  dgmm: "DGMM",
  oprag: "OPRAG",
  dgddi: "DGDDI",
  anpn: "ANPN",
  corep: "COREP",
};

export function WorkflowsList({ institutionCode, refreshTrigger }: WorkflowsListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, [institutionCode, refreshTrigger]);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from("workflows_inter_institutionnels")
        .select("*")
        .or(`institution_emettrice.eq.${institutionCode},institution_destinataire.eq.${institutionCode}`)
        .order("date_creation", { ascending: false }) as any;

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const emis = workflows.filter((w) => w.institution_emettrice === institutionCode);
  const recus = workflows.filter((w) => w.institution_destinataire === institutionCode);

  const WorkflowCard = ({ workflow }: { workflow: Workflow }) => (
    <Card 
      className={`border-l-4 ${PRIORITE_COLORS[workflow.priorite as keyof typeof PRIORITE_COLORS]} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => setSelectedWorkflow(workflow.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{workflow.numero_reference}</CardTitle>
              <Badge className={STATUT_COLORS[workflow.statut as keyof typeof STATUT_COLORS]}>
                {STATUT_LABELS[workflow.statut as keyof typeof STATUT_LABELS]}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <span className="font-medium">
                {INSTITUTION_LABELS[workflow.institution_emettrice]}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium">
                {INSTITUTION_LABELS[workflow.institution_destinataire]}
              </span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{workflow.objet}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(workflow.date_creation), { 
              addSuffix: true,
              locale: fr 
            })}
          </div>
          {workflow.date_echeance && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Échéance: {new Date(workflow.date_echeance).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <Tabs defaultValue="tous" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tous" className="flex items-center gap-2">
            Tous ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="emis" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Émis ({emis.length})
          </TabsTrigger>
          <TabsTrigger value="recus" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Reçus ({recus.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tous" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun workflow pour le moment
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </TabsContent>

        <TabsContent value="emis" className="space-y-4">
          {emis.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune demande émise
              </CardContent>
            </Card>
          ) : (
            emis.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </TabsContent>

        <TabsContent value="recus" className="space-y-4">
          {recus.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune demande reçue
              </CardContent>
            </Card>
          ) : (
            recus.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedWorkflow && (
        <WorkflowDetailDialog
          workflowId={selectedWorkflow}
          open={!!selectedWorkflow}
          onOpenChange={(open) => !open && setSelectedWorkflow(null)}
          onWorkflowUpdated={loadWorkflows}
        />
      )}
    </>
  );
}