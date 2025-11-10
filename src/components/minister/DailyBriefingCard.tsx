import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, Calendar, CheckCircle2 } from "lucide-react";
import { useDailyBriefing } from "@/hooks/useDailyBriefing";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export const DailyBriefingCard = () => {
  const { briefing, loading, generateBriefing, markAsRead } = useDailyBriefing();
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [generating, setGenerating] = useState(false);

  const toggleAudio = () => {
    if (!briefing?.audio_url) {
      toast.error('Aucun audio disponible');
      return;
    }

    if (playing && audio) {
      audio.pause();
      setPlaying(false);
    } else {
      if (audio) {
        audio.play();
        setPlaying(true);
      } else {
        const newAudio = new Audio(briefing.audio_url);
        newAudio.onended = () => setPlaying(false);
        newAudio.play();
        setAudio(newAudio);
        setPlaying(true);
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateBriefing();
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await markAsRead();
      toast.success('Briefing marqué comme lu');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!briefing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Briefing Quotidien
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aucun briefing disponible pour aujourd'hui
          </p>
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Générer le briefing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Briefing du {format(new Date(briefing.date_briefing), 'd MMMM', { locale: fr })}
          </CardTitle>
          <Badge variant={briefing.statut === 'lu' ? 'default' : 'secondary'}>
            {briefing.statut === 'lu' ? 'Lu' : 'Non lu'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points clés */}
        {Array.isArray(briefing.points_cles) && briefing.points_cles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Points clés</h4>
            <div className="space-y-1">
              {briefing.points_cles.slice(0, 3).map((point: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {briefing.audio_url && (
            <Button
              onClick={toggleAudio}
              variant="default"
              className="flex-1"
            >
              {playing ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {playing ? 'Pause' : 'Écouter'}
            </Button>
          )}
          {briefing.statut !== 'lu' && (
            <Button
              onClick={handleMarkAsRead}
              variant="outline"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marquer lu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
