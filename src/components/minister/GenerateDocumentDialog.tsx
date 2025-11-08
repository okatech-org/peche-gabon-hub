import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const typesDocuments = [
  { 
    value: "arrete", 
    label: "Arrêté Ministériel", 
    description: "Acte réglementaire ou individuel", 
    editable: true,
    icon: "⚖️"
  },
  { 
    value: "circulaire", 
    label: "Circulaire", 
    description: "Instructions d'interprétation", 
    editable: true,
    icon: "📋"
  },
  { 
    value: "instruction", 
    label: "Instruction Ministérielle", 
    description: "Directives aux services", 
    editable: true,
    icon: "📝"
  },
  { 
    value: "note_service", 
    label: "Note de Service", 
    description: "Communication interne", 
    editable: true,
    icon: "📄"
  },
  { 
    value: "decision", 
    label: "Décision", 
    description: "Acte administratif individuel", 
    editable: true,
    icon: "⚖️"
  },
  { 
    value: "rapport", 
    label: "Rapport", 
    description: "Rapport au Président ou Premier ministre", 
    editable: true,
    icon: "📊"
  },
  { 
    value: "communique", 
    label: "Communiqué de Presse", 
    description: "Information au public", 
    editable: true,
    icon: "📢"
  },
  { 
    value: "reponse", 
    label: "Réponse Ministérielle", 
    description: "Réponse aux parlementaires", 
    editable: true,
    icon: "💬"
  },
  { 
    value: "projet_loi", 
    label: "Projet de Loi", 
    description: "Proposition législative", 
    editable: false,
    icon: "📜"
  },
  { 
    value: "projet_ordonnance", 
    label: "Projet d'Ordonnance", 
    description: "Proposition d'ordonnance", 
    editable: false,
    icon: "📋"
  },
  { 
    value: "projet_decret", 
    label: "Projet de Décret", 
    description: "Proposition de décret", 
    editable: false,
    icon: "📄"
  }
];

export const GenerateDocumentDialog = ({ open, onOpenChange, onSuccess }: GenerateDocumentDialogProps) => {
  const [generating, setGenerating] = useState(false);
  const [typeDocument, setTypeDocument] = useState("");
  const [titre, setTitre] = useState("");
  const [objet, setObjet] = useState("");
  const [contexte, setContexte] = useState("");
  const [destinataires, setDestinataires] = useState("");

  const selectedType = typesDocuments.find(t => t.value === typeDocument);

  const handleGenerate = async () => {
    if (!typeDocument || !titre || !objet) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ministerial-document", {
        body: {
          type_document: typeDocument,
          titre,
          objet,
          contexte: contexte || undefined,
          destinataires: destinataires ? destinataires.split(',').map(d => d.trim()) : undefined
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Limite de requêtes")) {
          toast.error("Trop de requêtes. Veuillez patienter quelques instants.");
        } else if (data.error.includes("Crédits insuffisants")) {
          toast.error("Crédits Lovable AI insuffisants. Veuillez recharger votre espace.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success("Document généré avec succès !");
      
      // Réinitialiser le formulaire
      setTypeDocument("");
      setTitre("");
      setObjet("");
      setContexte("");
      setDestinataires("");
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast.error("Erreur lors de la génération du document");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un Document Ministériel
          </DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour générer automatiquement des documents basés sur les données du secteur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type de document */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type de Document <span className="text-destructive">*</span>
            </Label>
            <Select value={typeDocument} onValueChange={setTypeDocument}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionnez le type de document" />
              </SelectTrigger>
              <SelectContent>
                {typesDocuments.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                      {!type.editable && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Proposition
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && !selectedType.editable && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ce type de document ne peut être qu'une proposition. Seul le Gouvernement peut adopter le document final.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titre"
              placeholder="Ex: Arrêté portant réglementation de la pêche artisanale"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet">
              Objet <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="objet"
              placeholder="Décrivez l'objet principal du document..."
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              rows={3}
            />
          </div>

          {/* Contexte additionnel */}
          <div className="space-y-2">
            <Label htmlFor="contexte">
              Contexte Additionnel (optionnel)
            </Label>
            <Textarea
              id="contexte"
              placeholder="Ajoutez des informations supplémentaires pour personnaliser le document..."
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              💡 Le document sera automatiquement enrichi avec les statistiques, alertes et données du secteur
            </p>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <Label htmlFor="destinataires">
              Destinataires (optionnel)
            </Label>
            <Input
              id="destinataires"
              placeholder="Séparez les destinataires par des virgules"
              value={destinataires}
              onChange={(e) => setDestinataires(e.target.value)}
            />
          </div>

          {/* Info box */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Le document sera généré en tenant compte des dernières statistiques de pêche, alertes actives, rapports de zones et données financières du secteur.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !typeDocument || !titre || !objet}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Générer le Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
