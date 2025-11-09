import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Clock, CheckCircle, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  nouveau: "bg-blue-500",
  en_cours: "bg-yellow-500",
  traite: "bg-green-500",
  archive: "bg-gray-500",
};

const statusLabels = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  traite: "Traité",
  archive: "Archivé",
};

const typeLabels = {
  role: "Rôle",
  mission: "Mission",
  besoin: "Besoin",
  amelioration: "Amélioration",
};

export const DeveloppementPanel = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["demo-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: string;
    }) => {
      const { error } = await supabase
        .from("demo_feedbacks")
        .update({ statut })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-feedbacks"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const filteredFeedbacks = feedbacks?.filter((feedback) => {
    if (selectedRole !== "all" && feedback.role_demo !== selectedRole) {
      return false;
    }
    if (selectedType !== "all" && feedback.type_feedback !== selectedType) {
      return false;
    }
    return true;
  });

  const groupByStatus = (status: string) =>
    filteredFeedbacks?.filter((f) => f.statut === status) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Développement</h2>
        <p className="text-muted-foreground">
          Base de connaissance et cahier des charges des métiers de la pêche
        </p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="ministre">Ministère de la Mer</SelectItem>
            <SelectItem value="dgpa">Gestion portuaire</SelectItem>
            <SelectItem value="pecheur">Pêcheur Artisanal</SelectItem>
            <SelectItem value="cooperative">Coopérative</SelectItem>
            <SelectItem value="armateur">Armement Industriel</SelectItem>
            <SelectItem value="inspecteur">Inspecteur</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="role">Rôle</SelectItem>
            <SelectItem value="mission">Mission</SelectItem>
            <SelectItem value="besoin">Besoin</SelectItem>
            <SelectItem value="amelioration">Amélioration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="nouveau" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nouveau" className="gap-2">
            <Clock className="h-4 w-4" />
            Nouveaux ({groupByStatus("nouveau").length})
          </TabsTrigger>
          <TabsTrigger value="en_cours" className="gap-2">
            <FileText className="h-4 w-4" />
            En cours ({groupByStatus("en_cours").length})
          </TabsTrigger>
          <TabsTrigger value="traite" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Traités ({groupByStatus("traite").length})
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Archive className="h-4 w-4" />
            Archivés ({groupByStatus("archive").length})
          </TabsTrigger>
        </TabsList>

        {["nouveau", "en_cours", "traite", "archive"].map((status) => (
          <TabsContent key={status} value={status}>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {groupByStatus(status).map((feedback) => (
                  <Card key={feedback.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{feedback.titre}</CardTitle>
                          <CardDescription>
                            <Badge variant="outline" className="mr-2">
                              {feedback.role_demo}
                            </Badge>
                            <Badge variant="secondary">
                              {typeLabels[feedback.type_feedback as keyof typeof typeLabels]}
                            </Badge>
                          </CardDescription>
                        </div>
                        <Select
                          value={feedback.statut}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              id: feedback.id,
                              statut: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nouveau">Nouveau</SelectItem>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="traite">Traité</SelectItem>
                            <SelectItem value="archive">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {feedback.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {groupByStatus(status).length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Aucune remontée dans cette catégorie
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
