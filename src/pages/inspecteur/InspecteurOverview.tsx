import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  FileCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function InspecteurOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inspections_total: 0,
    inspections_en_cours: 0,
    infractions_detectees: 0,
    conformites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Simuler des statistiques pour l'instant
      // TODO: Remplacer par de vraies requêtes vers les tables d'inspection
      setStats({
        inspections_total: 42,
        inspections_en_cours: 7,
        infractions_detectees: 3,
        conformites: 35,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Inspections totales",
      value: stats.inspections_total,
      icon: ClipboardList,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradient: "bg-blue-500/5",
    },
    {
      title: "En cours",
      value: stats.inspections_en_cours,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      gradient: "bg-orange-500/5",
    },
    {
      title: "Infractions",
      value: stats.infractions_detectees,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      gradient: "bg-red-500/5",
    },
    {
      title: "Conformes",
      value: stats.conformites,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      gradient: "bg-green-500/5",
    },
  ];

  const quickActions = [
    {
      title: "Nouvelle inspection",
      description: "Démarrer une inspection",
      icon: ClipboardList,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      onClick: () => navigate("/inspecteur-dashboard/inspections"),
    },
    {
      title: "Signaler une infraction",
      description: "Enregistrer une infraction",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      onClick: () => navigate("/inspecteur-dashboard/infractions"),
    },
    {
      title: "Carte des inspections",
      description: "Voir les zones d'inspection",
      icon: MapPin,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      onClick: () => navigate("/inspecteur-dashboard/carte"),
    },
    {
      title: "Vérifier licence",
      description: "Consulter les licences",
      icon: FileCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      onClick: () => navigate("/inspecteur-dashboard/licences"),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
              Tableau de bord
            </h1>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              Inspecteur
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Vue d'ensemble de vos activités d'inspection
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => loadStats()}
          className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
        >
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="relative overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-card/95 hover:-translate-y-1 transition-all duration-300 group animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.gradient} rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-100 opacity-70 transition-opacity`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                <p className="text-3xl font-bold">{loading ? "..." : stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions rapides */}
      <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/95">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button 
              key={action.title}
              className="w-full justify-start h-auto py-4 hover:bg-accent/50" 
              variant="outline"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Inspections récentes */}
      <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/95">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inspections récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 1, status: "en_cours", statusLabel: "En cours", statusColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
              { id: 2, status: "terminee", statusLabel: "Terminée", statusColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
              { id: 3, status: "conforme", statusLabel: "Conforme", statusColor: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
            ].map((inspection) => (
              <div
                key={inspection.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-all cursor-pointer group"
                onClick={() => navigate("/inspecteur-dashboard/inspections")}
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Inspection PA-{1000 + inspection.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Site de débarquement - {new Date().toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs ${inspection.statusColor}`}>
                  {inspection.statusLabel}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
