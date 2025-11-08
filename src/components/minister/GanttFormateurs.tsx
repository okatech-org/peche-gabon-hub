import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Calendar, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachDayOfInterval, differenceInDays, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Formation {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  nb_participants_inscrits: number;
}

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  specialites: string[];
  formations: Formation[];
  charge_jours: number;
  taux_occupation: number;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

export function GanttFormateurs() {
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customMonth, setCustomMonth] = useState(0); // 0 = ce mois, 1 = mois prochain, etc.
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [conflicts, setConflicts] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    updatePeriod();
  }, [periodType, customMonth]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const updatePeriod = () => {
    const now = new Date();
    const targetDate = addMonths(now, customMonth);

    switch (periodType) {
      case 'month':
        setStartDate(startOfMonth(targetDate));
        setEndDate(endOfMonth(targetDate));
        break;
      case 'quarter':
        setStartDate(startOfQuarter(targetDate));
        setEndDate(endOfQuarter(targetDate));
        break;
      case 'year':
        setStartDate(startOfYear(targetDate));
        setEndDate(endOfYear(targetDate));
        break;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Récupérer tous les formateurs
      const { data: formateursData, error: formateursError } = await supabase
        .from("formateurs")
        .select("*")
        .eq("statut", "actif")
        .order("nom");

      if (formateursError) throw formateursError;

      // Récupérer toutes les formations dans la période
      const { data: formationsData, error: formationsError } = await supabase
        .from("formations_planifiees")
        .select("*")
        .gte("date_fin", format(startDate, "yyyy-MM-dd"))
        .lte("date_debut", format(endDate, "yyyy-MM-dd"))
        .order("date_debut");

      if (formationsError) throw formationsError;

      // Organiser par formateur
      const formateurMap = new Map<string, Formateur>();
      const conflictMap = new Map<string, boolean>();

      formateursData?.forEach((formateur) => {
        formateurMap.set(formateur.id, {
          ...formateur,
          formations: [],
          charge_jours: 0,
          taux_occupation: 0,
        });
      });

      // Assigner formations aux formateurs et détecter conflits
      formationsData?.forEach((formation) => {
        if (formation.formateur_id && formateurMap.has(formation.formateur_id)) {
          const formateur = formateurMap.get(formation.formateur_id)!;
          
          // Vérifier conflits
          const hasConflict = formateur.formations.some((existingFormation) => {
            const start1 = new Date(formation.date_debut);
            const end1 = new Date(formation.date_fin);
            const start2 = new Date(existingFormation.date_debut);
            const end2 = new Date(existingFormation.date_fin);
            return start1 <= end2 && start2 <= end1;
          });

          if (hasConflict) {
            conflictMap.set(formation.formateur_id, true);
          }

          formateur.formations.push(formation);

          // Calculer charge
          const formationStart = new Date(Math.max(new Date(formation.date_debut).getTime(), startDate.getTime()));
          const formationEnd = new Date(Math.min(new Date(formation.date_fin).getTime(), endDate.getTime()));
          const jours = differenceInDays(formationEnd, formationStart) + 1;
          formateur.charge_jours += jours;
        }
      });

      // Calculer taux occupation
      const periodDays = differenceInDays(endDate, startDate) + 1;
      formateurMap.forEach((formateur) => {
        formateur.taux_occupation = (formateur.charge_jours / periodDays) * 100;
      });

      setFormateurs(Array.from(formateurMap.values()));
      setConflicts(conflictMap);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getPositionAndWidth = (formation: Formation) => {
    const periodDays = differenceInDays(endDate, startDate);
    const formationStart = new Date(Math.max(new Date(formation.date_debut).getTime(), startDate.getTime()));
    const formationEnd = new Date(Math.min(new Date(formation.date_fin).getTime(), endDate.getTime()));

    const startOffset = differenceInDays(formationStart, startDate);
    const duration = differenceInDays(formationEnd, formationStart) + 1;

    const left = (startOffset / periodDays) * 100;
    const width = (duration / periodDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const getFormationColor = (statut: string) => {
    switch (statut) {
      case 'planifiee':
        return 'bg-blue-500';
      case 'en_cours':
        return 'bg-orange-500';
      case 'terminee':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTauxColor = (taux: number) => {
    if (taux > 80) return 'text-red-500';
    if (taux > 60) return 'text-orange-500';
    return 'text-green-500';
  };

  const renderTimelineGrid = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const gridLines = [];

    // Afficher une ligne tous les 7 jours pour ne pas surcharger
    for (let i = 0; i < days.length; i += 7) {
      const day = days[i];
      const position = (i / days.length) * 100;
      gridLines.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-border/30"
          style={{ left: `${position}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 text-xs text-muted-foreground">
            {format(day, "d MMM", { locale: fr })}
          </span>
        </div>
      );
    }

    return gridLines;
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
      {/* Contrôles de période */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Période:</span>
            </div>
            <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>

            {periodType === 'month' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomMonth(customMonth - 1)}
                >
                  ←
                </Button>
                <Badge variant="secondary" className="px-4">
                  {format(addMonths(new Date(), customMonth), "MMMM yyyy", { locale: fr })}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomMonth(customMonth + 1)}
                >
                  →
                </Button>
              </div>
            )}

            <Button size="sm" variant="outline" onClick={() => setCustomMonth(0)}>
              Aujourd'hui
            </Button>

            <div className="ml-auto text-sm text-muted-foreground">
              {format(startDate, "dd MMM yyyy", { locale: fr })} - {format(endDate, "dd MMM yyyy", { locale: fr })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formateurs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formations planifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formateurs.reduce((sum, f) => sum + f.formations.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux occupation moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formateurs.length > 0
                ? Math.round(formateurs.reduce((sum, f) => sum + f.taux_occupation, 0) / formateurs.length)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conflits détectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{conflicts.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte conflits */}
      {conflicts.size > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.size} formateur(s) ont des formations en conflit (surbrillance rouge dans le Gantt)
          </AlertDescription>
        </Alert>
      )}

      {/* Vue Gantt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Diagramme de Gantt - Charge de travail des formateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formateurs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun formateur actif
              </div>
            ) : (
              formateurs.map((formateur) => (
                <div key={formateur.id} className="space-y-2">
                  {/* En-tête formateur */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-[250px]">
                      <div className="font-medium">
                        {formateur.prenom} {formateur.nom}
                      </div>
                      {conflicts.has(formateur.id) && (
                        <Badge variant="destructive" className="text-xs">
                          Conflit
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {formateur.formations.length} formation(s)
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {formateur.charge_jours} jours
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className={`font-medium ${getTauxColor(formateur.taux_occupation)}`}>
                        {Math.round(formateur.taux_occupation)}%
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative h-12 bg-muted/30 rounded-md border">
                    {/* Grille temporelle */}
                    {renderTimelineGrid()}

                    {/* Formations */}
                    <div className="absolute inset-0 px-1 py-1">
                      {formateur.formations.map((formation) => {
                        const { left, width } = getPositionAndWidth(formation);
                        const hasConflict = conflicts.has(formateur.id);

                        return (
                          <div
                            key={formation.id}
                            className={`absolute top-1 bottom-1 ${getFormationColor(formation.statut)} ${
                              hasConflict ? 'ring-2 ring-red-500 animate-pulse' : ''
                            } rounded text-white text-xs px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                            style={{ left, width }}
                            title={`${formation.titre}\n${format(new Date(formation.date_debut), "dd MMM", { locale: fr })} - ${format(new Date(formation.date_fin), "dd MMM", { locale: fr })}\n${formation.nb_participants_inscrits} participants`}
                          >
                            <div className="truncate font-medium">{formation.titre}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Détails des spécialités */}
                  {formateur.specialites.length > 0 && (
                    <div className="flex gap-1 pl-4">
                      {formateur.specialites.slice(0, 3).map((specialite, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialite}
                        </Badge>
                      ))}
                      {formateur.specialites.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{formateur.specialites.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium">Légende:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Planifiée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Terminée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500 ring-2 ring-red-500"></div>
              <span className="text-sm">Conflit détecté</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
