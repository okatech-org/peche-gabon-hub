import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Volume2, Calendar, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BriefingData {
  text: string;
  audio: string | null;
  context: any;
  generated_at: string;
  generation_time_ms: number;
}

export default function DailyBriefing() {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateBriefing = async () => {
    setLoading(true);
    
    try {
      console.log('Generating daily briefing...');
      
      const { data, error } = await supabase.functions.invoke('generate-daily-briefing', {
        body: { 
          generateAudio: true,
          date: new Date().toISOString()
        }
      });

      if (error) throw error;

      if (data?.success && data?.briefing) {
        setBriefing(data.briefing);
        
        toast.success("Briefing généré", {
          description: "Le briefing matinal est prêt à être écouté."
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error generating briefing:', error);
      toast.error("Erreur", {
        description: error.message || "Impossible de générer le briefing."
      });
    } finally {
      setLoading(false);
    }
  };

  const playBriefing = () => {
    if (!briefing?.audio) {
      toast.error("Aucun audio disponible");
      return;
    }

    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create audio element
      const audio = new Audio(`data:audio/mpeg;base64,${briefing.audio}`);
      audioRef.current = audio;

      audio.onplay = () => setPlaying(true);
      audio.onended = () => {
        setPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setPlaying(false);
        audioRef.current = null;
        toast.error("Erreur de lecture audio");
      };

      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error("Impossible de lire l'audio");
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
    }
  };

  const downloadBriefing = () => {
    if (!briefing) return;

    const content = `BRIEFING MATINAL - ${format(new Date(briefing.generated_at), 'dd MMMM yyyy', { locale: fr })}\n\n${briefing.text}\n\n---\nGénéré le ${format(new Date(briefing.generated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-${format(new Date(briefing.generated_at), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Briefing Matinal iAsted
            </CardTitle>
            <CardDescription>
              Synthèse vocale quotidienne des indicateurs clés et alertes
            </CardDescription>
          </div>
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!briefing ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Générez votre briefing matinal personnalisé
            </p>
            <Button 
              onClick={generateBriefing} 
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Générer le briefing
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date et meta */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Généré le {format(new Date(briefing.generated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </span>
              <span>
                {(briefing.generation_time_ms / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Contrôles audio */}
            {briefing.audio && (
              <div className="flex gap-2">
                <Button 
                  onClick={playing ? stopAudio : playBriefing}
                  variant={playing ? "destructive" : "default"}
                  className="flex-1 gap-2"
                >
                  <Play className="h-4 w-4" />
                  {playing ? "Arrêter la lecture" : "Écouter le briefing"}
                </Button>
                <Button 
                  onClick={downloadBriefing}
                  variant="outline"
                  size="icon"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Texte du briefing */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {briefing.text.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Statistiques contextuelles */}
            {briefing.context && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {briefing.context.statistiques_jour?.captures_pa_kg > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {briefing.context.statistiques_jour.captures_pa_kg.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">kg capturés</div>
                  </div>
                )}
                
                {briefing.context.statistiques_jour?.recettes_collectees > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(briefing.context.statistiques_jour.recettes_collectees / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-muted-foreground">FCFA collectés</div>
                  </div>
                )}
                
                {briefing.context.alertes_critiques?.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {briefing.context.alertes_critiques.length}
                    </div>
                    <div className="text-xs text-muted-foreground">alertes critiques</div>
                  </div>
                )}
                
                {briefing.context.formations_aujourdhui?.length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {briefing.context.formations_aujourdhui.length}
                    </div>
                    <div className="text-xs text-muted-foreground">formations</div>
                  </div>
                )}
              </div>
            )}

            {/* Bouton refresh */}
            <Button 
              onClick={generateBriefing} 
              disabled={loading}
              variant="outline"
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Actualiser le briefing
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}