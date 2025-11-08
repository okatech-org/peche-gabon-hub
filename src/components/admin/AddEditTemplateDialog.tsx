import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const institutions = [
  { value: "dgpa", label: "DGPA" },
  { value: "anpa", label: "ANPA" },
  { value: "agasa", label: "AGASA" },
  { value: "dgmm", label: "DGMM" },
  { value: "oprag", label: "OPRAG" },
  { value: "dgddi", label: "DGDDI" },
  { value: "anpn", label: "ANPN" },
  { value: "corep", label: "COREP" },
];

const typeWorkflows = [
  { value: "validation", label: "Validation" },
  { value: "demande", label: "Demande" },
  { value: "controle", label: "Contrôle" },
  { value: "consultation", label: "Consultation" },
  { value: "notification", label: "Notification" },
];

const categories = [
  { value: "peche_artisanale", label: "Pêche Artisanale" },
  { value: "peche_industrielle", label: "Pêche Industrielle" },
  { value: "surveillance", label: "Surveillance" },
  { value: "statistiques", label: "Statistiques" },
  { value: "administratif", label: "Administratif" },
];

interface AddEditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
}

export function AddEditTemplateDialog({ open, onOpenChange, template }: AddEditTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEmetteurs, setSelectedEmetteurs] = useState<string[]>([]);
  const [selectedDestinataires, setSelectedDestinataires] = useState<string[]>([]);
  
  const form = useForm({
    defaultValues: {
      nom: "",
      description: "",
      categorie: "",
      type_workflow: "",
      type_donnees: "json",
      objet_template: "",
      description_template: "",
      documents_requis: "",
      delai_traitement_jours: 5,
      priorite_defaut: "moyenne",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        nom: template.nom || "",
        description: template.description || "",
        categorie: template.categorie || "",
        type_workflow: template.type_workflow || "",
        type_donnees: template.type_donnees || "json",
        objet_template: template.objet_template || "",
        description_template: template.description_template || "",
        documents_requis: template.documents_requis?.join(", ") || "",
        delai_traitement_jours: template.delai_traitement_jours || 5,
        priorite_defaut: template.priorite_defaut || "moyenne",
      });
      setSelectedEmetteurs(template.institution_emettrice_defaut || []);
      setSelectedDestinataires(template.institution_destinataire_defaut || []);
    } else {
      form.reset({
        nom: "",
        description: "",
        categorie: "",
        type_workflow: "",
        type_donnees: "json",
        objet_template: "",
        description_template: "",
        documents_requis: "",
        delai_traitement_jours: 5,
        priorite_defaut: "moyenne",
      });
      setSelectedEmetteurs([]);
      setSelectedDestinataires([]);
    }
  }, [template, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const documentsArray = values.documents_requis
        ? values.documents_requis.split(",").map((d: string) => d.trim()).filter(Boolean)
        : [];

      const payload = {
        nom: values.nom,
        description: values.description,
        categorie: values.categorie,
        type_workflow: values.type_workflow,
        type_donnees: values.type_donnees,
        objet_template: values.objet_template,
        description_template: values.description_template,
        documents_requis: documentsArray,
        delai_traitement_jours: values.delai_traitement_jours,
        priorite_defaut: values.priorite_defaut,
        institution_emettrice_defaut: selectedEmetteurs,
        institution_destinataire_defaut: selectedDestinataires,
        actif: true,
      };

      if (template?.id) {
        const { error } = await supabase
          .from("workflow_templates")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workflow_templates")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast.success(template ? "Template modifié avec succès" : "Template créé avec succès");
      onOpenChange(false);
      form.reset();
      setSelectedEmetteurs([]);
      setSelectedDestinataires([]);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    },
  });

  const onSubmit = (values: any) => {
    if (selectedEmetteurs.length === 0 || selectedDestinataires.length === 0) {
      toast.error("Veuillez sélectionner au moins une institution émettrice et destinataire");
      return;
    }
    saveMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Modifier le Template" : "Nouveau Template"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Modifiez les informations du template de workflow"
              : "Créez un nouveau template de workflow pour les institutions"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du Template *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Demande de Validation de Licence" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description du template" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_workflow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de Workflow *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeWorkflows.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Institutions Émettrices *</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {institutions.map((inst) => (
                  <div key={inst.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedEmetteurs.includes(inst.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmetteurs([...selectedEmetteurs, inst.value]);
                        } else {
                          setSelectedEmetteurs(selectedEmetteurs.filter((v) => v !== inst.value));
                        }
                      }}
                    />
                    <label className="text-sm">{inst.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Institutions Destinataires *</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {institutions.map((inst) => (
                  <div key={inst.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedDestinataires.includes(inst.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDestinataires([...selectedDestinataires, inst.value]);
                        } else {
                          setSelectedDestinataires(selectedDestinataires.filter((v) => v !== inst.value));
                        }
                      }}
                    />
                    <label className="text-sm">{inst.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="objet_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objet du Template *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Demande de validation de licence pêche artisanale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Détaillée</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description détaillée du workflow" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documents_requis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documents Requis</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Séparez les documents par des virgules. Ex: Certificat sanitaire, Rapport d'inspection" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Entrez les noms des documents requis séparés par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="delai_traitement_jours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Délai (jours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priorite_defaut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité par défaut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basse">Basse</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Enregistrement..." : template ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
