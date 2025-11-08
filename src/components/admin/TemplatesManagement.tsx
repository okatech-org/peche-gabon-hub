import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { AddEditTemplateDialog } from "./AddEditTemplateDialog";

export function TemplatesManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_templates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase
        .from("workflow_templates")
        .update({ actif: !actif })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast.success("Statut du template mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleToggleActive = (template: any) => {
    toggleActiveMutation.mutate({ id: template.id, actif: template.actif });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Templates</h1>
          <p className="text-muted-foreground">
            Créer et gérer les templates de workflows inter-institutionnels
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates de Workflows</CardTitle>
          <CardDescription>
            Liste de tous les templates disponibles pour les institutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : !templates?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun template disponible
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Émetteurs</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Utilisations</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.nom}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.institution_emettrice_defaut?.map((inst: string) => (
                          <Badge key={inst} variant="outline" className="text-xs">
                            {inst.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.institution_destinataire_defaut?.map((inst: string) => (
                          <Badge key={inst} variant="outline" className="text-xs">
                            {inst.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{template.type_workflow}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{template.utilisation_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={template.actif ? "default" : "secondary"}>
                        {template.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template)}
                        >
                          {template.actif ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddEditTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
