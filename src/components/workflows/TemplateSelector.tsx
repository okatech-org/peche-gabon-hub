import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Shield, 
  AlertCircle, 
  BarChart3, 
  Users,
  Clock,
  TrendingUp
} from "lucide-react";

interface WorkflowTemplate {
  id: string;
  nom: string;
  description: string;
  type_workflow: string;
  type_donnees: string;
  priorite_defaut: string;
  objet_template: string;
  description_template: string;
  institution_emettrice_defaut: string[];
  institution_destinataire_defaut: string[];
  delai_traitement_jours: number;
  documents_requis: string[];
  categorie: string;
  utilisation_count: number;
}

interface TemplateSelectorProps {
  institutionCode: string;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  licences: FileText,
  controles: Shield,
  infractions: AlertCircle,
  statistiques: BarChart3,
  coordination: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  licences: "Licences",
  controles: "Contrôles Sanitaires",
  infractions: "Infractions",
  statistiques: "Statistiques",
  coordination: "Coordination",
  general: "Général",
};

const PRIORITE_COLORS: Record<string, string> = {
  basse: "bg-gray-500",
  normale: "bg-blue-500",
  haute: "bg-orange-500",
  urgente: "bg-red-500",
};

export function TemplateSelector({ institutionCode, onSelectTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [institutionCode]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('actif', true)
        .order('utilisation_count', { ascending: false }) as any;

      if (error) throw error;

      // Filtrer les templates pertinents pour cette institution
      const filtered = (data || []).filter((t: WorkflowTemplate) => 
        t.institution_emettrice_defaut?.includes(institutionCode)
      );

      setTemplates(filtered);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    const cat = template.categorie || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, WorkflowTemplate[]>);

  const TemplateCard = ({ template }: { template: WorkflowTemplate }) => {
    const IconComponent = CATEGORY_ICONS[template.categorie] || FileText;

    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onSelectTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{template.nom}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {template.description}
                </CardDescription>
              </div>
            </div>
            <Badge className={PRIORITE_COLORS[template.priorite_defaut]}>
              {template.priorite_defaut}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {template.delai_traitement_jours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {template.delai_traitement_jours}j
              </div>
            )}
            {template.utilisation_count > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Utilisé {template.utilisation_count}x
              </div>
            )}
          </div>
          
          {template.documents_requis && template.documents_requis.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium mb-1">Documents requis:</p>
              <div className="flex flex-wrap gap-1">
                {template.documents_requis.map((doc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Button className="w-full mt-2" size="sm">
            Utiliser ce template
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun template disponible pour votre institution
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={Object.keys(groupedTemplates)[0]} className="space-y-4">
      <TabsList className="flex flex-wrap h-auto">
        {Object.keys(groupedTemplates).map((category) => {
          const IconComponent = CATEGORY_ICONS[category] || FileText;
          return (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" />
              {CATEGORY_LABELS[category]} ({groupedTemplates[category].length})
            </TabsTrigger>
          );
        })}
      </TabsList>

      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <TabsContent key={category} value={category} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}