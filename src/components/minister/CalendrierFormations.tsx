import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, Loader2, Eye, Edit2, AlertTriangle, Wand2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/calendar.css";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

interface Formation {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut: string;
  formateur_id: string | null;
  nb_participants_inscrits: number;
}

interface Disponibilite {
  id: string;
  formateur_id: string;
  date_debut: string;
  date_fin: string;
  disponible: boolean;
  formateurs: {
    nom: string;
    prenom: string;
  };
}

interface CalendarEvent extends Event {
  id: string;
  type: 'formation' | 'disponibilite';
  resource: Formation | Disponibilite;
}

interface PresenceUser {
  user_id: string;
  user_email: string;
  user_name: string;
  status: string;
}

interface Conflict {
  formateur_id: string;
  formateur_nom: string;
  formations: {
    id: string;
    titre: string;
    date_debut: string;
    date_fin: string;
  }[];
}

interface Suggestion {
  formation_id: string;
  formation_titre: string;
  date_debut_actuelle: string;
  date_fin_actuelle: string;
  suggestions_dates: {
    date_debut: string;
    date_fin: string;
    score: number;
    raison: string;
  }[];
}

export function CalendrierFormations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictFormationIds, setConflictFormationIds] = useState<Set<string>>(new Set());
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
    trackPresence();

    return () => {
      // Cleanup
      supabase.removeAllChannels();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [formationsRes, disponibilitesRes] = await Promise.all([
        supabase
          .from("formations_planifiees")
          .select("*")
          .order("date_debut"),
        supabase
          .from("formateurs_disponibilites")
          .select(`
            *,
            formateurs (
              nom,
              prenom
            )
          `)
          .order("date_debut"),
      ]);

      if (formationsRes.error) throw formationsRes.error;
      if (disponibilitesRes.error) throw disponibilitesRes.error;

      setFormations(formationsRes.data || []);
      setDisponibilites(disponibilitesRes.data || []);
      updateEvents(formationsRes.data || [], disponibilitesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const detectConflicts = async (formationsData: Formation[]) => {
    const detectedConflicts: Conflict[] = [];
    const conflictIds = new Set<string>();

    // Grouper les formations par formateur
    const formationsByFormateur = new Map<string, Formation[]>();
    
    for (const formation of formationsData) {
      if (!formation.formateur_id) continue;
      
      if (!formationsByFormateur.has(formation.formateur_id)) {
        formationsByFormateur.set(formation.formateur_id, []);
      }
      formationsByFormateur.get(formation.formateur_id)!.push(formation);
    }

    // Détecter les chevauchements
    for (const [formateurId, formations] of formationsByFormateur.entries()) {
      const overlapping: Formation[] = [];
      
      for (let i = 0; i < formations.length; i++) {
        for (let j = i + 1; j < formations.length; j++) {
          const formation1 = formations[i];
          const formation2 = formations[j];
          
          const start1 = new Date(formation1.date_debut);
          const end1 = new Date(formation1.date_fin);
          const start2 = new Date(formation2.date_debut);
          const end2 = new Date(formation2.date_fin);
          
          // Vérifier si les dates se chevauchent
          if (start1 <= end2 && start2 <= end1) {
            if (!overlapping.some(f => f.id === formation1.id)) {
              overlapping.push(formation1);
              conflictIds.add(formation1.id);
            }
            if (!overlapping.some(f => f.id === formation2.id)) {
              overlapping.push(formation2);
              conflictIds.add(formation2.id);
            }
          }
        }
      }
      
      if (overlapping.length > 0) {
        // Récupérer le nom du formateur
        const { data: formateur } = await supabase
          .from("formateurs")
          .select("nom, prenom")
          .eq("id", formateurId)
          .single();
        
        detectedConflicts.push({
          formateur_id: formateurId,
          formateur_nom: formateur ? `${formateur.prenom} ${formateur.nom}` : "Formateur inconnu",
          formations: overlapping.map(f => ({
            id: f.id,
            titre: f.titre,
            date_debut: f.date_debut,
            date_fin: f.date_fin,
          })),
        });
      }
    }

    setConflicts(detectedConflicts);
    setConflictFormationIds(conflictIds);
    
    if (detectedConflicts.length > 0) {
      toast.warning(`${detectedConflicts.length} conflit(s) de formateur détecté(s)`);
    }
  };

  const updateEvents = (
    formationsData: Formation[],
    disponibilitesData: Disponibilite[]
  ) => {
    const formationEvents: CalendarEvent[] = formationsData.map((formation) => ({
      id: formation.id,
      title: `📚 ${formation.titre} (${formation.statut})`,
      start: new Date(formation.date_debut),
      end: new Date(formation.date_fin),
      type: 'formation' as const,
      resource: formation,
    }));

    const dispoEvents: CalendarEvent[] = disponibilitesData
      .filter((d) => d.disponible)
      .map((dispo) => ({
        id: dispo.id,
        title: `✅ ${dispo.formateurs.prenom} ${dispo.formateurs.nom}`,
        start: new Date(dispo.date_debut),
        end: new Date(dispo.date_fin),
        type: 'disponibilite' as const,
        resource: dispo,
      }));

    setEvents([...formationEvents, ...dispoEvents]);
    detectConflicts(formationsData);
  };

  const setupRealtimeSubscriptions = () => {
    // Écouter les changements sur formations_planifiees
    const formationsChannel = supabase
      .channel("formations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "formations_planifiees",
        },
        (payload) => {
          console.log("Formation changed:", payload);
          toast.info("Calendrier mis à jour en temps réel");
          loadData();
        }
      )
      .subscribe();

    // Écouter les changements sur formateurs_disponibilites
    const disponibilitesChannel = supabase
      .channel("disponibilites-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "formateurs_disponibilites",
        },
        (payload) => {
          console.log("Disponibilité changed:", payload);
          toast.info("Disponibilités mises à jour");
          loadData();
        }
      )
      .subscribe();

    // Écouter la présence des autres utilisateurs
    const presenceChannel = supabase
      .channel("calendrier-presence")
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== user?.id) {
              users.push({
                user_id: presence.user_id,
                user_email: presence.user_email,
                user_name: presence.user_name,
                status: presence.status,
              });
            }
          });
        });

        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user) {
          await presenceChannel.track({
            user_id: user.id,
            user_email: user.email || "Unknown",
            user_name: user.email?.split("@")[0] || "User",
            status: "viewing",
            online_at: new Date().toISOString(),
          });
        }
      });
  };

  const trackPresence = async () => {
    if (!user) return;

    try {
      // Mettre à jour ou créer l'entrée de présence
      const { error } = await supabase
        .from("calendrier_presence")
        .upsert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.email?.split("@")[0],
          status: "viewing",
          last_seen: new Date().toISOString(),
        });

      if (error) console.error("Erreur tracking presence:", error);
    } catch (error) {
      console.error("Erreur tracking:", error);
    }
  };

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      if (event.type !== 'formation') {
        toast.error("Seules les formations peuvent être déplacées");
        return;
      }

      try {
        const formation = event.resource as Formation;

        const { error } = await supabase
          .from("formations_planifiees")
          .update({
            date_debut: start.toISOString().split('T')[0],
            date_fin: end.toISOString().split('T')[0],
          })
          .eq("id", formation.id);

        if (error) throw error;

        toast.success("Formation déplacée avec succès");
        // La mise à jour en temps réel se chargera de rafraîchir les données
      } catch (error) {
        console.error("Erreur déplacement:", error);
        toast.error("Erreur lors du déplacement");
        loadData(); // Recharger pour annuler le changement local
      }
    },
    []
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      if (event.type !== 'formation') {
        toast.error("Seules les formations peuvent être redimensionnées");
        return;
      }

      try {
        const formation = event.resource as Formation;

        const { error } = await supabase
          .from("formations_planifiees")
          .update({
            date_debut: start.toISOString().split('T')[0],
            date_fin: end.toISOString().split('T')[0],
          })
          .eq("id", formation.id);

        if (error) throw error;

        toast.success("Durée modifiée avec succès");
      } catch (error) {
        console.error("Erreur redimensionnement:", error);
        toast.error("Erreur lors de la modification");
        loadData();
      }
    },
    []
  );

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.type === 'formation') {
      const formation = event.resource as Formation;
      const hasConflict = conflictFormationIds.has(formation.id);
      
      return {
        style: {
          backgroundColor: hasConflict ? '#ef4444' :
            formation.statut === 'planifiee' ? '#3b82f6' :
            formation.statut === 'en_cours' ? '#f59e0b' :
            formation.statut === 'terminee' ? '#10b981' :
            '#6b7280',
          borderRadius: '5px',
          opacity: 0.9,
          color: 'white',
          border: hasConflict ? '2px solid #dc2626' : '0px',
          display: 'block',
        },
      };
    } else {
      return {
        style: {
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '5px',
          opacity: 0.6,
          border: '1px dashed #10b981',
        },
      };
    }
  };

  const handleResolveConflicts = async (formateurId: string) => {
    try {
      setResolvingConflict(true);
      toast.info("Analyse des conflits en cours...");

      const { data, error } = await supabase.functions.invoke('resolve-conflicts', {
        body: { conflict_formateur_id: formateurId },
      });

      if (error) throw error;

      if (data.success && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestionsDialog(true);
        toast.success(`${data.suggestions.length} suggestion(s) générée(s)`);
      } else {
        toast.warning("Aucune solution automatique trouvée");
      }
    } catch (error) {
      console.error("Erreur résolution conflits:", error);
      toast.error("Erreur lors de la résolution des conflits");
    } finally {
      setResolvingConflict(false);
    }
  };

  const handleApplySuggestion = async (
    formationId: string,
    dateDebut: string,
    dateFin: string
  ) => {
    try {
      const { error } = await supabase
        .from("formations_planifiees")
        .update({
          date_debut: dateDebut,
          date_fin: dateFin,
        })
        .eq("id", formationId);

      if (error) throw error;

      toast.success("Date alternative appliquée avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur application suggestion:", error);
      toast.error("Erreur lors de l'application de la suggestion");
    }
  };

  const handleUpdateFormation = async (formationId: string, data: Partial<Formation>) => {
    try {
      const { error } = await supabase
        .from("formations_planifiees")
        .update(data)
        .eq("id", formationId);

      if (error) throw error;

      toast.success("Formation mise à jour");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
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
      {/* Alertes de conflits */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ Conflits de formateurs détectés</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-3">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="bg-background/50 p-3 rounded-md">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-semibold">
                      {conflict.formateur_nom} a {conflict.formations.length} formations simultanées:
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveConflicts(conflict.formateur_id)}
                      disabled={resolvingConflict}
                      className="shrink-0"
                    >
                      {resolvingConflict ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-1" />
                          Résoudre
                        </>
                      )}
                    </Button>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {conflict.formations.map((formation) => (
                      <li key={formation.id} className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span>
                          <strong>{formation.titre}</strong> - du{" "}
                          {format(new Date(formation.date_debut), "dd MMM yyyy", { locale: fr })} au{" "}
                          {format(new Date(formation.date_fin), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Barre d'utilisateurs actifs */}
      {activeUsers.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activeUsers.length} utilisateur(s) en ligne:</span>
              </div>
              <div className="flex gap-2">
                {activeUsers.map((u) => (
                  <Badge key={u.user_id} variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {u.user_name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Légende */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-sm">Formation planifiée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm">Formation en cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm">Formation terminée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d1fae5', border: '1px dashed #10b981' }}></div>
              <span className="text-sm">Disponibilité formateur</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444', border: '2px solid #dc2626' }}></div>
              <span className="text-sm">Conflit détecté</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier des Formations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '700px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              draggableAccessor={(event) => (event as CalendarEvent).type === 'formation'}
              resizable
              selectable
              culture="fr"
              messages={{
                next: "Suivant",
                previous: "Précédent",
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                agenda: "Agenda",
                date: "Date",
                time: "Heure",
                event: "Événement",
                showMore: (total) => `+ ${total} de plus`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog de détails/édition */}
      {selectedEvent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent.type === 'formation' ? 'Détails de la Formation' : 'Disponibilité du Formateur'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEvent.type === 'formation' ? (
                <>
                  {(() => {
                    const formation = selectedEvent.resource as Formation;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Titre</Label>
                            <p className="text-sm font-medium">{formation.titre}</p>
                          </div>
                          <div>
                            <Label>Statut</Label>
                            <Badge
                              variant={
                                formation.statut === 'planifiee' ? 'default' :
                                formation.statut === 'en_cours' ? 'secondary' :
                                'outline'
                              }
                            >
                              {formation.statut}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date début</Label>
                            <p className="text-sm">{format(new Date(formation.date_debut), "dd MMMM yyyy", { locale: fr })}</p>
                          </div>
                          <div>
                            <Label>Date fin</Label>
                            <p className="text-sm">{format(new Date(formation.date_fin), "dd MMMM yyyy", { locale: fr })}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Lieu</Label>
                            <p className="text-sm">{formation.lieu || "Non spécifié"}</p>
                          </div>
                          <div>
                            <Label>Participants inscrits</Label>
                            <p className="text-sm font-medium">{formation.nb_participants_inscrits}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Label htmlFor="statut">Changer le statut</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={formation.statut === 'planifiee' ? 'default' : 'outline'}
                              onClick={() => handleUpdateFormation(formation.id, { statut: 'planifiee' })}
                            >
                              Planifiée
                            </Button>
                            <Button
                              size="sm"
                              variant={formation.statut === 'en_cours' ? 'default' : 'outline'}
                              onClick={() => handleUpdateFormation(formation.id, { statut: 'en_cours' })}
                            >
                              En cours
                            </Button>
                            <Button
                              size="sm"
                              variant={formation.statut === 'terminee' ? 'default' : 'outline'}
                              onClick={() => handleUpdateFormation(formation.id, { statut: 'terminee' })}
                            >
                              Terminée
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {(() => {
                    const dispo = selectedEvent.resource as Disponibilite;
                    return (
                      <>
                        <div>
                          <Label>Formateur</Label>
                          <p className="text-sm font-medium">
                            {dispo.formateurs.prenom} {dispo.formateurs.nom}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date début</Label>
                            <p className="text-sm">{format(new Date(dispo.date_debut), "dd MMMM yyyy", { locale: fr })}</p>
                          </div>
                          <div>
                            <Label>Date fin</Label>
                            <p className="text-sm">{format(new Date(dispo.date_fin), "dd MMMM yyyy", { locale: fr })}</p>
                          </div>
                        </div>
                        <div>
                          <Label>Disponible</Label>
                          <Badge variant={dispo.disponible ? 'default' : 'secondary'}>
                            {dispo.disponible ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog des suggestions de résolution */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Suggestions de Résolution Automatique
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.formation_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{suggestion.formation_titre}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Date actuelle: du {format(new Date(suggestion.date_debut_actuelle), "dd MMM yyyy", { locale: fr })} au{" "}
                    {format(new Date(suggestion.date_fin_actuelle), "dd MMM yyyy", { locale: fr })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestion.suggestions_dates.length > 0 ? (
                      suggestion.suggestions_dates.map((alt, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={alt.score >= 90 ? 'default' : alt.score >= 75 ? 'secondary' : 'outline'}>
                                Score: {alt.score}
                              </Badge>
                              <span className="text-sm font-medium">
                                Du {format(new Date(alt.date_debut), "dd MMM yyyy", { locale: fr })} au{" "}
                                {format(new Date(alt.date_fin), "dd MMM yyyy", { locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{alt.raison}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              handleApplySuggestion(suggestion.formation_id, alt.date_debut, alt.date_fin);
                              setShowSuggestionsDialog(false);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Appliquer
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune suggestion disponible pour cette formation
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
