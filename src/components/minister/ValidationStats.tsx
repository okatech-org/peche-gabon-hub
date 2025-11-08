import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Loader2
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";

interface ValidationStats {
  total: number;
  approuvees: number;
  rejetees: number;
  enAttente: number;
  tauxApprobation: number;
  tempsRevisionMoyen: number;
  raisonsRejet: { raison: string; count: number }[];
}

export function ValidationStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ValidationStats>({
    total: 0,
    approuvees: 0,
    rejetees: 0,
    enAttente: 0,
    tauxApprobation: 0,
    tempsRevisionMoyen: 0,
    raisonsRejet: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("formations_validation")
        .select("*");

      if (error) throw error;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const total = data.length;
      const approuvees = data.filter(f => f.statut === "approuvee").length;
      const rejetees = data.filter(f => f.statut === "rejetee").length;
      const enAttente = data.filter(f => f.statut === "en_attente").length;

      const tauxApprobation = total > 0 ? (approuvees / (approuvees + rejetees)) * 100 : 0;

      // Calculer le temps de révision moyen
      const formationsRevisees = data.filter(f => 
        f.reviewed_at && f.created_at && (f.statut === "approuvee" || f.statut === "rejetee")
      );

      let tempsRevisionMoyen = 0;
      if (formationsRevisees.length > 0) {
        const totalHeures = formationsRevisees.reduce((sum, f) => {
          const heures = differenceInHours(
            new Date(f.reviewed_at!),
            new Date(f.created_at)
          );
          return sum + heures;
        }, 0);
        tempsRevisionMoyen = totalHeures / formationsRevisees.length;
      }

      // Extraire les raisons de rejet
      const formationsRejetees = data.filter(f => 
        f.statut === "rejetee" && f.notes_revision
      );

      const raisonsMap = new Map<string, number>();
      formationsRejetees.forEach(f => {
        const raison = f.notes_revision || "Non spécifié";
        raisonsMap.set(raison, (raisonsMap.get(raison) || 0) + 1);
      });

      const raisonsRejet = Array.from(raisonsMap.entries())
        .map(([raison, count]) => ({ raison, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        total,
        approuvees,
        rejetees,
        enAttente,
        tauxApprobation,
        tempsRevisionMoyen,
        raisonsRejet
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistiques de Validation
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des performances du système de validation
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Taux d'approbation</div>
                {stats.tauxApprobation >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-3xl font-bold text-primary">
                {stats.tauxApprobation.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.approuvees} approuvées / {stats.approuvees + stats.rejetees} traitées
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Temps de révision moyen
              </div>
              <div className="text-3xl font-bold">
                {stats.tempsRevisionMoyen.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">
                Par formation validée
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Formations approuvées
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats.approuvees}
              </div>
              <div className="text-xs text-muted-foreground">
                Sur {stats.total} prédictions IA
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                Formations rejetées
              </div>
              <div className="text-3xl font-bold text-red-600">
                {stats.rejetees}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.enAttente} en attente
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution des statuts */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approuvées</span>
                <span className="font-medium">{stats.approuvees}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${(stats.approuvees / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rejetées</span>
                <span className="font-medium">{stats.rejetees}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500"
                  style={{ width: `${(stats.rejetees / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En attente</span>
                <span className="font-medium">{stats.enAttente}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500"
                  style={{ width: `${(stats.enAttente / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top raisons de rejet */}
      {stats.raisonsRejet.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Principales Raisons de Rejet</CardTitle>
            <CardDescription>
              Top 5 des motifs de refus de formations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.raisonsRejet.map((raison, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {raison.count}x
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{raison.raison}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicateurs de performance */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Efficacité du système IA</div>
                <div className="text-xs text-muted-foreground">
                  Basé sur le taux d'approbation des prédictions
                </div>
              </div>
              <Badge 
                variant={stats.tauxApprobation >= 80 ? "default" : stats.tauxApprobation >= 60 ? "secondary" : "destructive"}
              >
                {stats.tauxApprobation >= 80 ? "Excellent" : stats.tauxApprobation >= 60 ? "Bon" : "À améliorer"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Rapidité de validation</div>
                <div className="text-xs text-muted-foreground">
                  Temps moyen de traitement des formations
                </div>
              </div>
              <Badge 
                variant={stats.tempsRevisionMoyen <= 24 ? "default" : stats.tempsRevisionMoyen <= 72 ? "secondary" : "destructive"}
              >
                {stats.tempsRevisionMoyen <= 24 ? "Rapide" : stats.tempsRevisionMoyen <= 72 ? "Normal" : "Lent"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Charge de validation</div>
                <div className="text-xs text-muted-foreground">
                  Formations en attente de traitement
                </div>
              </div>
              <Badge 
                variant={stats.enAttente <= 5 ? "default" : stats.enAttente <= 10 ? "secondary" : "destructive"}
              >
                {stats.enAttente} en attente
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
