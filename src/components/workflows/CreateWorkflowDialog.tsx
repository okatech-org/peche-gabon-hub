import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TemplateSelector } from "./TemplateSelector";

interface CreateWorkflowDialogProps {
  institutionEmettrice: string;
  onWorkflowCreated?: () => void;
}

const INSTITUTIONS = [
  { value: "dgpa", label: "DGPA - Direction générale des Pêches" },
  { value: "anpa", label: "ANPA - Agence nationale des pêches" },
  { value: "agasa", label: "AGASA - Agence sécurité alimentaire" },
  { value: "dgmm", label: "DGMM - Direction de la marine marchande" },
  { value: "oprag", label: "OPRAG - Observatoire des ressources" },
  { value: "dgddi", label: "DGDDI - Direction des douanes" },
  { value: "anpn", label: "ANPN - Agence parcs nationaux" },
  { value: "corep", label: "COREP - Conseil de la République" },
];

const TYPE_WORKFLOW = [
  { value: "demande_licence", label: "Demande de Licence" },
  { value: "controle_sanitaire", label: "Contrôle Sanitaire" },
  { value: "infraction", label: "Signalement d'Infraction" },
  { value: "statistiques", label: "Échange de Statistiques" },
  { value: "validation", label: "Demande de Validation" },
  { value: "coordination", label: "Coordination Inter-services" },
  { value: "autre", label: "Autre" },
];

const TYPE_DONNEES = [
  { value: "licence", label: "Licence" },
  { value: "capture", label: "Données de Capture" },
  { value: "inspection", label: "Rapport d'Inspection" },
  { value: "statistiques", label: "Statistiques" },
  { value: "rapport", label: "Rapport" },
  { value: "certificat", label: "Certificat" },
  { value: "autre", label: "Autre" },
];

const PRIORITES = [
  { value: "basse", label: "Basse" },
  { value: "normale", label: "Normale" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

export function CreateWorkflowDialog({ institutionEmettrice, onWorkflowCreated }: CreateWorkflowDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("templates");
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    institution_destinataire: "",
    type_workflow: "",
    type_donnees: "",
    objet: "",
    description: "",
    priorite: "normale",
    date_echeance: "",
  });

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    
    // Pré-remplir le formulaire avec les données du template
    setFormData({
      institution_destinataire: template.institution_destinataire_defaut?.[0] || "",
      type_workflow: template.type_workflow,
      type_donnees: template.type_donnees,
      objet: template.objet_template,
      description: template.description_template || "",
      priorite: template.priorite_defaut,
      date_echeance: template.delai_traitement_jours 
        ? new Date(Date.now() + template.delai_traitement_jours * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : "",
    });
    
    // Basculer vers l'onglet du formulaire
    setActiveTab("custom");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setLoading(true);

    try {
      const workflowData: any = {
        institution_emettrice: institutionEmettrice,
        institution_destinataire: formData.institution_destinataire,
        emetteur_user_id: user.id,
        type_workflow: formData.type_workflow,
        type_donnees: formData.type_donnees,
        objet: formData.objet,
        description: formData.description,
        priorite: formData.priorite,
        date_echeance: formData.date_echeance || null,
        statut: "en_attente",
      };

      // Si créé depuis un template, ajouter l'ID du template dans les métadonnées
      if (selectedTemplate) {
        workflowData.donnees_json = {
          template_id: selectedTemplate.id,
          template_nom: selectedTemplate.nom,
        };
      }

      const { error } = await supabase
        .from("workflows_inter_institutionnels")
        .insert(workflowData);

      if (error) throw error;

      toast.success("Demande de workflow créée avec succès");
      setOpen(false);
      setFormData({
        institution_destinataire: "",
        type_workflow: "",
        type_donnees: "",
        objet: "",
        description: "",
        priorite: "normale",
        date_echeance: "",
      });
      
      if (onWorkflowCreated) {
        onWorkflowCreated();
      }
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      toast.error(error.message || "Erreur lors de la création du workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Demande Inter-institutionnelle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une Demande Inter-institutionnelle</DialogTitle>
          <DialogDescription>
            Utilisez un template prédéfini ou créez une demande personnalisée
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Templates Prédéfinis
            </TabsTrigger>
            <TabsTrigger value="custom">
              Demande Personnalisée {selectedTemplate && "✓"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <TemplateSelector
              institutionCode={institutionEmettrice}
              onSelectTemplate={handleSelectTemplate}
            />
          </TabsContent>

          <TabsContent value="custom">
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Template: {selectedTemplate.nom}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vous pouvez modifier les champs pré-remplis avant de soumettre
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution_destinataire">Institution Destinataire *</Label>
              <Select
                value={formData.institution_destinataire}
                onValueChange={(value) =>
                  setFormData({ ...formData, institution_destinataire: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTIONS.filter((i) => i.value !== institutionEmettrice).map((inst) => (
                    <SelectItem key={inst.value} value={inst.value}>
                      {inst.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_workflow">Type de Demande *</Label>
              <Select
                value={formData.type_workflow}
                onValueChange={(value) => setFormData({ ...formData, type_workflow: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_WORKFLOW.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_donnees">Type de Données *</Label>
              <Select
                value={formData.type_donnees}
                onValueChange={(value) => setFormData({ ...formData, type_donnees: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_DONNEES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité *</Label>
              <Select
                value={formData.priorite}
                onValueChange={(value) => setFormData({ ...formData, priorite: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objet">Objet de la Demande *</Label>
            <Input
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              placeholder="Ex: Demande de validation de licence n°..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description Détaillée</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails de la demande..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_echeance">Date d'Échéance (optionnel)</Label>
            <Input
              id="date_echeance"
              type="date"
              value={formData.date_echeance}
              onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
            />
          </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer la Demande"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}