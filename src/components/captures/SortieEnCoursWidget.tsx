import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, MapPin, Clock, Waves } from "lucide-react";
import { format, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SortieEnCoursWidgetProps {
  sortie: {
    id: string;
    pirogue_id: string;
    site_id: string;
    date_depart: string;
    heure_depart: string;
    pirogue_nom?: string;
    site_nom?: string;
  } | null;
}

export const SortieEnCoursWidget = ({ sortie }: SortieEnCoursWidgetProps) => {
  const [tempsEcoule, setTempsEcoule] = useState({ heures: 0, minutes: 0, secondes: 0 });

  useEffect(() => {
    if (!sortie) return;

    const calculerTemps = () => {
      const maintenant = new Date();
      const depart = new Date(`${sortie.date_depart}T${sortie.heure_depart}`);
      
      const heures = differenceInHours(maintenant, depart);
      const minutes = differenceInMinutes(maintenant, depart) % 60;
      const secondes = differenceInSeconds(maintenant, depart) % 60;
      
      setTempsEcoule({ heures, minutes, secondes });
    };

    calculerTemps();
    const interval = setInterval(calculerTemps, 1000);

    return () => clearInterval(interval);
  }, [sortie]);

  if (!sortie) return null;

  const dateDepart = new Date(`${sortie.date_depart}T${sortie.heure_depart}`);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 overflow-hidden relative">
      {/* Animated waves background */}
      <div className="absolute inset-0 opacity-10">
        <Waves className="absolute top-0 left-0 w-full h-full animate-pulse" />
      </div>

      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
              <Ship className="h-6 w-6 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Sortie en Cours
                <Badge variant="default" className="animate-pulse">
                  EN MER
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Départ le {format(dateDepart, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Compteur en temps réel */}
        <div className="bg-background/60 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Temps en mer</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "text-4xl md:text-5xl font-bold tabular-nums transition-all duration-300",
                  "bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent"
                )}>
                  {String(tempsEcoule.heures).padStart(2, '0')}
                </div>
                <span className="text-xs text-muted-foreground mt-1">heures</span>
              </div>
              <div className="text-3xl font-bold text-muted-foreground animate-pulse">:</div>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "text-4xl md:text-5xl font-bold tabular-nums transition-all duration-300",
                  "bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent"
                )}>
                  {String(tempsEcoule.minutes).padStart(2, '0')}
                </div>
                <span className="text-xs text-muted-foreground mt-1">minutes</span>
              </div>
              <div className="text-3xl font-bold text-muted-foreground animate-pulse">:</div>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "text-4xl md:text-5xl font-bold tabular-nums transition-all duration-300",
                  "bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent"
                )}>
                  {String(tempsEcoule.secondes).padStart(2, '0')}
                </div>
                <span className="text-xs text-muted-foreground mt-1">secondes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Détails de la sortie */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Ship className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Pirogue</span>
            </div>
            <p className="font-semibold text-foreground">{sortie.pirogue_nom}</p>
          </div>

          <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">Site</span>
            </div>
            <p className="font-semibold text-foreground">{sortie.site_nom}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
