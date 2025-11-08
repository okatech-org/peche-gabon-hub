import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Search, Download, Eye, Trash2, Edit, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { GenerateDocumentDialog } from "./GenerateDocumentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  type_document: string;
  numero_reference: string;
  titre: string;
  objet: string;
  contenu_genere: string;
  statut: string;
  created_at: string;
  date_publication: string | null;
  destinataires: string[];
}

const typesDocumentsLabels: { [key: string]: string } = {
  arrete: "Arrêté Ministériel",
  circulaire: "Circulaire",
  instruction: "Instruction",
  note_service: "Note de Service",
  decision: "Décision",
  rapport: "Rapport",
  communique: "Communiqué",
  reponse: "Réponse Ministérielle",
  projet_loi: "Projet de Loi",
  projet_ordonnance: "Projet d'Ordonnance",
  projet_decret: "Projet de Décret"
};

export const MinisterialDocumentsPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents_ministeriels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error loading documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const { error } = await supabase
        .from("documents_ministeriels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Document supprimé");
      loadDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleUpdateStatut = async (id: string, newStatut: string) => {
    try {
      const updates: any = { statut: newStatut };
      if (newStatut === "publie" && !documents.find(d => d.id === id)?.date_publication) {
        updates.date_publication = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("documents_ministeriels")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Statut mis à jour");
      loadDocuments();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleExportPDF = async (doc: Document) => {
    try {
      // Créer un blob PDF simple avec le contenu
      const content = `
${doc.numero_reference}
${doc.titre}

Objet: ${doc.objet}

${doc.contenu_genere}

---
Généré le ${format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
${doc.date_publication ? `Publié le ${format(new Date(doc.date_publication), "dd MMMM yyyy", { locale: fr })}` : ''}
      `.trim();

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.numero_reference.replace(/\//g, "-")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Document exporté");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleSendNotifications = async (documentId: string, titre: string) => {
    try {
      setSendingNotifications(documentId);
      
      const { data, error } = await supabase.functions.invoke('simulate-notifications', {
        body: { documentId }
      });

      if (error) throw error;

      toast.success(
        data.message || "Notifications simulées envoyées avec succès!",
        {
          description: `${data.notifications?.length || 0} notification(s) envoyée(s) aux abonnés`
        }
      );
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast.error("Erreur lors de l'envoi des notifications", {
        description: error.message
      });
    } finally {
      setSendingNotifications(null);
    }
  };

  const filtered = documents.filter(doc => {
    const matchesSearch = doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.numero_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.objet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "tous" || doc.type_document === filterType;
    const matchesStatut = filterStatut === "tous" || doc.statut === filterStatut;
    return matchesSearch && matchesType && matchesStatut;
  });

  const getStatutBadge = (statut: string) => {
    const variants: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      brouillon: "secondary",
      finalise: "default",
      publie: "default",
      archive: "outline"
    };
    return <Badge variant={variants[statut] || "secondary"}>{statut}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents Ministériels
              </CardTitle>
              <CardDescription>
                {documents.length} document(s) généré(s)
              </CardDescription>
            </div>
            <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Générer un Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtres */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les types</SelectItem>
                  {Object.entries(typesDocumentsLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="finalise">Finalisé</SelectItem>
                  <SelectItem value="publie">Publié</SelectItem>
                  <SelectItem value="archive">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des documents */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun document trouvé</p>
                </div>
              ) : (
                filtered.map(doc => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{doc.numero_reference}</Badge>
                            {getStatutBadge(doc.statut)}
                            <Badge variant="secondary">{typesDocumentsLabels[doc.type_document]}</Badge>
                          </div>
                          <h4 className="font-semibold">{doc.titre}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{doc.objet}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Créé le {format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}</span>
                            {doc.date_publication && (
                              <span>Publié le {format(new Date(doc.date_publication), "dd MMM yyyy", { locale: fr })}</span>
                            )}
                            {doc.destinataires?.length > 0 && (
                              <span>{doc.destinataires.length} destinataire(s)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(doc)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportPDF(doc)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.statut === "publie" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSendNotifications(doc.id, doc.titre)}
                              disabled={sendingNotifications === doc.id}
                              className="gap-2"
                            >
                              {sendingNotifications === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                              Notifier
                            </Button>
                          )}
                          {doc.statut === "brouillon" && (
                            <Select
                              value={doc.statut}
                              onValueChange={(value) => handleUpdateStatut(doc.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brouillon">Brouillon</SelectItem>
                                <SelectItem value="finalise">Finaliser</SelectItem>
                                <SelectItem value="publie">Publier</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <GenerateDocumentDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onSuccess={loadDocuments}
      />

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.numero_reference} - {selectedDocument?.titre}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            {selectedDocument && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Objet:</div>
                  <div className="font-medium">{selectedDocument.objet}</div>
                </div>
                <div className="border-t pt-4">
                  <div className="whitespace-pre-wrap font-mono text-sm">
                    {selectedDocument.contenu_genere}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
