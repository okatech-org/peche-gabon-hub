import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitRemonteeDialog } from "@/components/minister/SubmitRemonteeDialog";
import { RemonteeMap } from "@/components/RemonteeMap";
import { AttachmentsList } from "@/components/remontees/AttachmentsList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare, Clock, CheckCircle, AlertCircle, FileText, Map } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeLabels: Record<string, string> = {
  reclamation: "Réclamation",
  suggestion: "Suggestion",
  denonciation: "Dénonciation",
  article_presse: "Article de Presse",
  commentaire_reseaux: "Commentaire Réseaux",
  avis_reseaux: "Avis Réseaux"
};

const typeIcons: Record<string, any> = {
  reclamation: AlertCircle,
  suggestion: MessageSquare,
  denonciation: AlertCircle,
  article_presse: FileText,
  commentaire_reseaux: MessageSquare,
  avis_reseaux: MessageSquare
};

const statusColors: Record<string, string> = {
  nouveau: "bg-blue-500",
  en_cours: "bg-yellow-500",
  traite: "bg-green-500",
  rejete: "bg-red-500"
};

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  rejete: "Rejeté"
};

const priorityColors: Record<string, string> = {
  bas: "bg-gray-500",
  moyen: "bg-blue-500",
  haut: "bg-orange-500",
  critique: "bg-red-500"
};

export default function PecheurRemontees() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: remontees, isLoading, refetch } = useQuery({
    queryKey: ["pecheur-remontees", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("remontees_terrain")
        .select("*")
        .eq("soumis_par", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const filteredRemontees = selectedType === "all" 
    ? remontees 
    : remontees?.filter(r => r.type_remontee === selectedType);

  const stats = {
    total: remontees?.length || 0,
    nouveau: remontees?.filter(r => r.statut === "nouveau").length || 0,
    en_cours: remontees?.filter(r => r.statut === "en_cours").length || 0,
    traite: remontees?.filter(r => r.statut === "traite").length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mes Remontées</h1>
        <p className="text-muted-foreground">
          Soumettez vos réclamations, suggestions et dénonciations
        </p>
      </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.nouveau}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.en_cours}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Traitées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.traite}</div>
            </CardContent>
          </Card>
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="reclamation">Réclamations</TabsTrigger>
                <TabsTrigger value="suggestion">Suggestions</TabsTrigger>
                <TabsTrigger value="denonciation">Dénonciations</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Liste
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
              >
                <Map className="h-4 w-4 mr-2" />
                Carte
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Nouvelle Remontée
              </Button>
            </div>
        </div>
      </div>

      {viewMode === "map" ? (
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              {filteredRemontees && filteredRemontees.length > 0 ? (
                <RemonteeMap 
                  remontees={filteredRemontees.map(r => ({
                    id: r.id,
                    titre: r.titre,
                    type_remontee: r.type_remontee,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    statut: r.statut,
                    numero_reference: r.numero_reference,
                  }))}
                  height="600px"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucune remontée avec localisation GPS
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRemontees?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucune remontée pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRemontees?.map((remontee) => {
              const Icon = typeIcons[remontee.type_remontee] || MessageSquare;
              return (
                <Card key={remontee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-5 w-5 mt-1 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{remontee.numero_reference}</Badge>
                            <Badge className={statusColors[remontee.statut]}>
                              {statusLabels[remontee.statut]}
                            </Badge>
                            {remontee.niveau_priorite && (
                              <Badge className={priorityColors[remontee.niveau_priorite]} variant="outline">
                                {remontee.niveau_priorite}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mb-1">{remontee.titre}</CardTitle>
                          <CardDescription>
                            <span className="font-medium">{typeLabels[remontee.type_remontee]}</span>
                            {remontee.localisation && ` • ${remontee.localisation}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(remontee.created_at), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {remontee.description}
                    </p>

                    <AttachmentsList remonteeId={remontee.id} />
                    
                    {remontee.commentaire_validation && remontee.statut === "traite" && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">Commentaire de validation</span>
                        </div>
                        <p className="text-sm">{remontee.commentaire_validation}</p>
                        {remontee.date_validation && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(remontee.date_validation), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <SubmitRemonteeDialog
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
