import { useState, useMemo } from "react";
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
import { FileText, Clock, CheckCircle, Archive, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

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

const roleLabels: Record<string, string> = {
  ministre: "Ministère",
  direction_centrale: "Direction Centrale",
  direction_provinciale: "Direction Provinciale",
  dgpa: "Gestion portuaire",
  anpa: "Contrôle quotas",
  agasa: "Standards & Qualité",
  dgmm: "Affaires maritimes",
  oprag: "Recherche halieutique",
  anpn: "Conservation",
  corep: "Promotion développement",
  dgddi: "DGDDI - Douanes",
  partenaire_international: "Partenaire International",
  pecheur: "Pêcheur Artisanal",
  cooperative: "Coopérative",
  armateur_pi: "Armement Industriel",
  agent_collecte: "Agent de Collecte",
  inspecteur: "Inspecteur",
  observateur_pi: "Observateur PI",
  analyste: "Analyste",
  admin: "Administrateur",
};

const COLORS = {
  role: "#3b82f6",
  mission: "#10b981",
  besoin: "#f59e0b",
  amelioration: "#8b5cf6",
  ministre: "#9333ea",
  dgpa: "#0ea5e9",
  pecheur: "#06b6d4",
  cooperative: "#6366f1",
  armateur_pi: "#475569",
  inspecteur: "#ef4444",
  admin: "#1f2937",
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

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!feedbacks) return null;

    const total = feedbacks.length;
    const byStatus = {
      nouveau: feedbacks.filter((f) => f.statut === "nouveau").length,
      en_cours: feedbacks.filter((f) => f.statut === "en_cours").length,
      traite: feedbacks.filter((f) => f.statut === "traite").length,
      archive: feedbacks.filter((f) => f.statut === "archive").length,
    };

    // Distribution par type
    const byType = Object.keys(typeLabels).map((type) => ({
      name: typeLabels[type as keyof typeof typeLabels],
      value: feedbacks.filter((f) => f.type_feedback === type).length,
      fill: COLORS[type as keyof typeof COLORS] || "#6366f1",
    }));

    // Distribution par rôle
    const roleCount: Record<string, number> = {};
    feedbacks.forEach((f) => {
      roleCount[f.role_demo] = (roleCount[f.role_demo] || 0) + 1;
    });
    
    const byRole = Object.entries(roleCount)
      .map(([role, count]) => ({
        name: roleLabels[role] || role,
        value: count,
        fill: COLORS[role as keyof typeof COLORS] || "#6366f1",
      }))
      .sort((a, b) => b.value - a.value);

    return { total, byStatus, byType, byRole };
  }, [feedbacks]);

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

      {/* Statistiques générales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Remontées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nouveaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.byStatus.nouveau}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats.byStatus.en_cours}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Traités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.byStatus.traite}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Archivés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-500">{stats.byStatus.archive}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="ministre">Ministère de la Mer</SelectItem>
            <SelectItem value="direction_centrale">Direction Centrale</SelectItem>
            <SelectItem value="direction_provinciale">Direction Provinciale</SelectItem>
            <SelectItem value="dgpa">Gestion portuaire</SelectItem>
            <SelectItem value="anpa">Contrôle quotas</SelectItem>
            <SelectItem value="agasa">Standards & Qualité</SelectItem>
            <SelectItem value="dgmm">Affaires maritimes</SelectItem>
            <SelectItem value="oprag">Recherche halieutique</SelectItem>
            <SelectItem value="anpn">Conservation</SelectItem>
            <SelectItem value="corep">Promotion développement</SelectItem>
            <SelectItem value="dgddi">DGDDI - Douanes</SelectItem>
            <SelectItem value="partenaire_international">Partenaire International</SelectItem>
            <SelectItem value="pecheur">Pêcheur Artisanal</SelectItem>
            <SelectItem value="cooperative">Coopérative</SelectItem>
            <SelectItem value="armateur_pi">Armement Industriel</SelectItem>
            <SelectItem value="agent_collecte">Agent de Collecte</SelectItem>
            <SelectItem value="inspecteur">Inspecteur</SelectItem>
            <SelectItem value="observateur_pi">Observateur PI</SelectItem>
            <SelectItem value="analyste">Analyste</SelectItem>
            <SelectItem value="admin">Administrateur</SelectItem>
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

      <Tabs defaultValue="statistiques" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statistiques" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
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
        
        <TabsContent value="statistiques">
          {stats && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution par Type</CardTitle>
                  <CardDescription>
                    Répartition des remontées selon leur type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={stats.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution par Rôle</CardTitle>
                  <CardDescription>
                    Nombre de remontées par rôle démonstration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.byRole}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {stats.byRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Répartition par Statut</CardTitle>
                  <CardDescription>
                    État d'avancement des remontées d'information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: "Nouveau", value: stats.byStatus.nouveau, fill: "#3b82f6" },
                        { name: "En cours", value: stats.byStatus.en_cours, fill: "#eab308" },
                        { name: "Traité", value: stats.byStatus.traite, fill: "#10b981" },
                        { name: "Archivé", value: stats.byStatus.archive, fill: "#6b7280" },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {[
                          { fill: "#3b82f6" },
                          { fill: "#eab308" },
                          { fill: "#10b981" },
                          { fill: "#6b7280" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

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
