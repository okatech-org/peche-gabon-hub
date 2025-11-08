import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download, Calendar, Filter, Home } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const TYPE_DOCUMENTS = [
  { value: "arrete", label: "Arrêté ministériel" },
  { value: "circulaire", label: "Circulaire" },
  { value: "instruction", label: "Instruction" },
  { value: "note_service", label: "Note de service" },
  { value: "decision", label: "Décision" },
  { value: "rapport", label: "Rapport" },
  { value: "communique", label: "Communiqué de presse" },
  { value: "reponse", label: "Réponse ministérielle" },
  { value: "projet_loi", label: "Projet de loi" },
  { value: "projet_ordonnance", label: "Projet d'ordonnance" },
  { value: "projet_decret", label: "Projet de décret" },
];

interface Document {
  id: string;
  type_document: string;
  numero_reference: string;
  titre: string;
  objet: string;
  contenu_genere: string;
  date_publication: string;
  metadata: any;
  signataires: any;
  destinataires: string[] | null;
}

export default function PublicDocumentsRegistry() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);

  useEffect(() => {
    fetchPublicDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, filterType]);

  const fetchPublicDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents_ministeriels")
        .select("*")
        .eq("statut", "publie")
        .order("date_publication", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filtre par type
    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.type_document === filterType);
    }

    // Recherche full-text
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.titre.toLowerCase().includes(search) ||
          doc.objet.toLowerCase().includes(search) ||
          doc.numero_reference.toLowerCase().includes(search) ||
          doc.contenu_genere.toLowerCase().includes(search)
      );
    }

    setFilteredDocuments(filtered);
  };

  const downloadDocument = (doc: Document) => {
    const content = `
${doc.titre}
${doc.numero_reference}
Date de publication: ${format(new Date(doc.date_publication), "dd MMMM yyyy", { locale: fr })}

Objet: ${doc.objet}

${doc.contenu_genere}

${doc.signataires && doc.signataires.length > 0 ? `\nSignataires:\n${doc.signataires.map((s: any) => `- ${s.nom} (${s.fonction})`).join('\n')}` : ''}
${doc.destinataires && doc.destinataires.length > 0 ? `\nDestinataires:\n${doc.destinataires.join(', ')}` : ''}
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.numero_reference.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Document téléchargé");
  };

  const getDocumentTypeBadgeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      arrete: "destructive",
      circulaire: "default",
      instruction: "secondary",
      rapport: "outline",
    };
    return variants[type] || "default";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Bouton retour */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Registre Public des Documents Ministériels
          </h1>
          <p className="text-muted-foreground text-lg">
            Transparence Administrative - Ministère de la Pêche et de l'Aquaculature
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher des documents
            </CardTitle>
            <CardDescription>
              Recherchez parmi {documents.length} document(s) publié(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher par titre, objet, référence ou contenu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {TYPE_DOCUMENTS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredDocuments.length} document(s) trouvé(s)
            </div>
          </CardContent>
        </Card>

        {/* Liste des documents */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all"
                ? "Aucun document ne correspond à votre recherche"
                : "Aucun document publié pour le moment"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getDocumentTypeBadgeVariant(doc.type_document)}>
                          {TYPE_DOCUMENTS.find((t) => t.value === doc.type_document)?.label ||
                            doc.type_document}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {doc.numero_reference}
                        </span>
                      </div>
                      <CardTitle className="text-xl mb-2">{doc.titre}</CardTitle>
                      <CardDescription className="text-base">{doc.objet}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                      className="shrink-0"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Extrait du contenu */}
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {doc.contenu_genere}
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Publié le{" "}
                          {format(new Date(doc.date_publication), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      {doc.signataires && doc.signataires.length > 0 && (
                        <div>
                          <span className="font-medium">Signataires:</span>{" "}
                          {doc.signataires.map((s: any) => s.nom).join(", ")}
                        </div>
                      )}
                      {doc.destinataires && doc.destinataires.length > 0 && (
                        <div>
                          <span className="font-medium">Destinataires:</span>{" "}
                          {doc.destinataires.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
