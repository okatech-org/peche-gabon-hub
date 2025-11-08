import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuiviObjectif {
  id: string;
  mois: number;
  annee: number;
  poids_realise_kg: number;
  poids_objectif_kg: number;
  taux_realisation_pct: number;
  nb_sorties: number;
  objectifs_peche?: {
    objectif_kg_annuel: number;
    pirogues?: {
      nom: string;
      immatriculation: string;
    };
  };
}

const MOIS_NOMS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function SuiviObjectifsDashboard() {
  const [suivis, setSuivis] = useState<SuiviObjectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadSuivis();
  }, [selectedYear]);

  const loadSuivis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("suivi_objectifs")
        .select(`
          *,
          objectifs_peche(
            objectif_kg_annuel,
            pirogues(nom, immatriculation)
          )
        `)
        .eq("annee", selectedYear)
        .order("mois", { ascending: false });

      if (error) throw error;
      setSuivis(data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getTauxColor = (taux: number) => {
    if (taux >= 100) return "text-green-600 dark:text-green-400";
    if (taux >= 80) return "text-blue-600 dark:text-blue-400";
    if (taux >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTauxIcon = (taux: number) => {
    if (taux >= 100) return <TrendingUp className="h-4 w-4" />;
    if (taux >= 80) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getTauxBadge = (taux: number) => {
    if (taux >= 100) return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (taux >= 80) return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    if (taux >= 50) return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
    return "bg-red-500/20 text-red-700 dark:text-red-300";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Suivi des Objectifs de Pêche
        </CardTitle>
        <CardDescription>
          Performance mensuelle des pirogues par rapport aux objectifs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suivis.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucun suivi disponible pour {selectedYear}
          </div>
        ) : (
          <div className="space-y-6">
            {suivis.map((suivi) => {
              const taux = parseFloat(suivi.taux_realisation_pct.toString());
              return (
                <Card key={suivi.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {suivi.objectifs_peche?.pirogues?.nom || "Pirogue inconnue"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {suivi.objectifs_peche?.pirogues?.immatriculation}
                          </p>
                          <p className="text-sm font-medium">
                            {MOIS_NOMS[suivi.mois - 1]} {suivi.annee}
                          </p>
                        </div>
                        <Badge className={getTauxBadge(taux)}>
                          <span className="flex items-center gap-1">
                            {getTauxIcon(taux)}
                            {taux.toFixed(1)}%
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progression</span>
                          <span className={getTauxColor(taux)} >
                            {suivi.poids_realise_kg.toLocaleString()} /{" "}
                            {suivi.poids_objectif_kg.toLocaleString()} kg
                          </span>
                        </div>
                        <Progress value={Math.min(taux, 100)} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Nombre de sorties</p>
                          <p className="text-lg font-semibold">{suivi.nb_sorties}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Objectif annuel</p>
                          <p className="text-lg font-semibold">
                            {suivi.objectifs_peche?.objectif_kg_annuel.toLocaleString() || 0} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
