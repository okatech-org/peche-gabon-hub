import { useEffect, useState } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function InspecteurOverview() {
  const { user } = useAuth();
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
    },
    {
      title: "En cours",
      value: stats.inspections_en_cours,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Infractions",
      value: stats.infractions_detectees,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Conformes",
      value: stats.conformites,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Inspecteur
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de vos activités d'inspection
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button className="w-full justify-start h-auto py-4" variant="outline">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Nouvelle inspection</p>
                <p className="text-xs text-muted-foreground">Démarrer une inspection</p>
              </div>
            </div>
          </Button>

          <Button className="w-full justify-start h-auto py-4" variant="outline">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Signaler une infraction</p>
                <p className="text-xs text-muted-foreground">Enregistrer une infraction</p>
              </div>
            </div>
          </Button>

          <Button className="w-full justify-start h-auto py-4" variant="outline">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Localisation</p>
                <p className="text-xs text-muted-foreground">Voir les zones d'inspection</p>
              </div>
            </div>
          </Button>

          <Button className="w-full justify-start h-auto py-4" variant="outline">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Vérifier licence</p>
                <p className="text-xs text-muted-foreground">Consulter les licences</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Inspections récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Inspections récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Inspection PA-{1000 + i}</p>
                  <p className="text-xs text-muted-foreground">
                    Site de débarquement - {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {i === 1 ? "En cours" : "Terminée"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
