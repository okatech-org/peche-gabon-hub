import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, TrendingUp, AlertTriangle, Users, BarChart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: string;
  nom: string;
  description: string;
  type_workflow: string;
  categorie: string;
  priorite_defaut: string;
  delai_traitement_jours: number | null;
  documents_requis: string[];
  utilisation_count: number;
  institution_emettrice_defaut: string[];
}

interface TemplateSelectorProps {
  institutionCode: string;
  onSelectTemplate: (template: Template) => void;
}

const CATEGORIE_LABELS: Record<string, string> = {
  licences: "Licences",
  controles: "Contrôles Sanitaires",
  infractions: "Infractions",
  statistiques: "Statistiques",
  coordination: "Coordination",
  general: "Général",
};

const CATEGORIE_ICONS: Record<string, any> = {
  licences: FileText,
  controles: AlertTriangle,
  infractions: AlertTriangle,
  statistiques: BarChart,
  coordination: Users,
  general: FileText,
};

const PRIORITE_COLORS: Record<string, string> = {
  basse: "bg-gray-500",
  normale: "bg-blue-500",
  haute: "bg-orange-500",
  urgente: "bg-red-500",
};

export function TemplateSelector({ institutionCode, onSelectTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("tous");

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
      const relevantTemplates = (data || []).filter((t: Template) => 
        !t.institution_emettrice_defaut || 
        t.institution_emettrice_defaut.length === 0 ||
        t.institution_emettrice_defaut.includes(institutionCode)
      );

      setTemplates(relevantTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(templates.map(t => t.categorie))];
  const filteredTemplates = selectedCategory === "tous"
    ? templates
    : templates.filter(t => t.categorie === selectedCategory);

  const TemplateCard = ({ template }: { template: Template }) => {
    const IconComponent = CATEGORIE_ICONS[template.categorie] || FileText;

    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
        onClick={() => onSelectTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base line-clamp-2">{template.nom}</CardTitle>
                {template.description && (
                  <CardDescription className="text-sm mt-1 line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge className={`${PRIORITE_COLORS[template.priorite_defaut]} text-white flex-shrink-0`}>
              {template.priorite_defaut}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {template.delai_traitement_jours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{template.delai_traitement_jours} jours</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{template.utilisation_count} utilisations</span>
            </div>
          </div>
          
          {template.documents_requis && template.documents_requis.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-muted-foreground">Documents requis:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.documents_requis.slice(0, 2).map((doc, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
                {template.documents_requis.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.documents_requis.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun template disponible pour votre institution</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Sélectionnez un template pour accélérer la création de votre demande.</p>
        <p className="mt-1">Les champs seront pré-remplis et modifiables.</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length + 1, 6)}, 1fr)` }}>
          <TabsTrigger value="tous">
            Tous <span className="ml-1 text-xs opacity-70">({templates.length})</span>
          </TabsTrigger>
          {categories.slice(0, 5).map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORIE_LABELS[cat]}{" "}
              <span className="ml-1 text-xs opacity-70">
                ({templates.filter(t => t.categorie === cat).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-[450px] pr-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Aucun template dans cette catégorie
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}