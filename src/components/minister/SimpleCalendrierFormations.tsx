import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Formation {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  formateur_id: string | null;
  lieu: string | null;
  nb_participants_inscrits: number | null;
  formateurs?: {
    nom: string;
    prenom: string;
  };
}

export function SimpleCalendrierFormations() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadFormations();
    setupRealtimeSubscription();
  }, [selectedDate]);

  const loadFormations = async () => {
    try {
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const { data, error } = await supabase
        .from("formations_planifiees")
        .select(`
          *,
          formateurs(nom, prenom)
        `)
        .gte("date_debut", startDate.toISOString())
        .lte("date_debut", endDate.toISOString())
        .order("date_debut", { ascending: true });

      if (error) throw error;
      setFormations(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des formations:", error);
      toast.error("Erreur lors du chargement des formations");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("formations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "formations_planifiees",
        },
        () => {
          loadFormations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getFormationsForDate = (date: Date) => {
    return formations.filter((formation) => {
      const formationDate = parseISO(formation.date_debut);
      return isSameDay(formationDate, date);
    });
  };

  const getFormationsForSelectedDate = () => {
    return getFormationsForDate(selectedDate);
  };

  const detectConflicts = (formation: Formation) => {
    if (!formation.formateur_id) return false;
    
    return formations.some((f) => {
      if (f.id === formation.id || f.formateur_id !== formation.formateur_id) return false;
      
      const fStart = parseISO(f.date_debut);
      const fEnd = parseISO(f.date_fin);
      const formationStart = parseISO(formation.date_debut);
      const formationEnd = parseISO(formation.date_fin);
      
      return (
        (formationStart >= fStart && formationStart < fEnd) ||
        (formationEnd > fStart && formationEnd <= fEnd) ||
        (formationStart <= fStart && formationEnd >= fEnd)
      );
    });
  };

  const getDatesWithFormations = () => {
    const dates = new Set<string>();
    formations.forEach((formation) => {
      const date = parseISO(formation.date_debut);
      dates.add(format(date, "yyyy-MM-dd"));
    });
    return dates;
  };

  const datesWithFormations = getDatesWithFormations();

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "planifiee":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "en_cours":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "terminee":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
      case "annulee":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier des Formations
          </CardTitle>
          <CardDescription>
            Consultez et gérez les formations planifiées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendrier */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={fr}
                modifiers={{
                  hasFormation: (date) => datesWithFormations.has(format(date, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasFormation: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="rounded-md border"
              />
            </div>

            {/* Liste des formations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Formations du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </h3>

              {getFormationsForSelectedDate().length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Aucune formation prévue pour cette date.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {getFormationsForSelectedDate().map((formation) => {
                    const hasConflict = detectConflicts(formation);
                    return (
                      <Card
                        key={formation.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedFormation(formation);
                          setDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{formation.titre}</h4>
                                {hasConflict && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {formation.formateurs && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>
                                      {formation.formateurs.prenom} {formation.formateurs.nom}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(parseISO(formation.date_debut), "HH:mm")} -{" "}
                                    {format(parseISO(formation.date_fin), "HH:mm")}
                                  </span>
                                </div>
                                
                                {formation.lieu && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{formation.lieu}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <Badge className={getStatutColor(formation.statut)}>
                              {formation.statut.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog détails formation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFormation?.titre}</DialogTitle>
            <DialogDescription>
              Détails de la formation
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge className={getStatutColor(selectedFormation.statut)}>
                    {selectedFormation.statut.replace("_", " ")}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm">
                    {format(parseISO(selectedFormation.date_debut), "d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horaires</p>
                  <p className="text-sm">
                    {format(parseISO(selectedFormation.date_debut), "HH:mm")} -{" "}
                    {format(parseISO(selectedFormation.date_fin), "HH:mm")}
                  </p>
                </div>
                
                {selectedFormation.formateurs && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Formateur</p>
                    <p className="text-sm">
                      {selectedFormation.formateurs.prenom} {selectedFormation.formateurs.nom}
                    </p>
                  </div>
                )}
                
                {selectedFormation.lieu && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                    <p className="text-sm">{selectedFormation.lieu}</p>
                  </div>
                )}
                
                {selectedFormation.nb_participants_inscrits && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Participants</p>
                    <p className="text-sm">{selectedFormation.nb_participants_inscrits}</p>
                  </div>
                )}
              </div>
              
              {detectConflicts(selectedFormation) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Conflit détecté : le formateur a une autre formation au même moment.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
