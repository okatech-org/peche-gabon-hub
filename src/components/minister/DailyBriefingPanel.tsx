import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Briefing {
  id: string;
  date_briefing: string;
  titre: string;
  contenu_vocal: string;
  audio_url: string | null;
  points_cles: any;
  questions_strategiques: any;
  alertes_prioritaires: any;
  statistiques_resumees: any;
  statut: string;
  created_at: string;
}

export const DailyBriefingPanel = () => {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = async () => {
    try {
      const { data, error } = await supabase
        .from('briefings_quotidiens')
        .select('*')
        .order('date_briefing', { ascending: false })
        .limit(7);

      if (error) throw error;

      setBriefings(data || []);
      if (data && data.length > 0) {
        setSelectedBriefing(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement briefings:', error);
      toast.error('Impossible de charger les briefings');
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-briefing', {
        body: { generateAudio: true }
      });

      if (error) throw error;

      toast.success('Briefing généré avec succès');
      await loadBriefings();
    } catch (error) {
      console.error('Erreur génération briefing:', error);
      toast.error('Impossible de générer le briefing');
    } finally {
      setGenerating(false);
    }
  };

  const toggleAudio = () => {
    if (!selectedBriefing?.audio_url) {
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
        const newAudio = new Audio(selectedBriefing.audio_url);
        newAudio.onended = () => setPlaying(false);
        newAudio.play();
        setAudio(newAudio);
        setPlaying(true);
      }
    }
  };

  const markAsRead = async () => {
    if (!selectedBriefing) return;

    try {
      const { error } = await supabase
        .from('briefings_quotidiens')
        .update({ statut: 'lu', lu_le: new Date().toISOString() })
        .eq('id', selectedBriefing.id);

      if (error) throw error;

      toast.success('Briefing marqué comme lu');
      await loadBriefings();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Briefings Quotidiens iAsted
              </CardTitle>
              <CardDescription>
                Rapports vocaux intelligents générés automatiquement chaque matin
              </CardDescription>
            </div>
            <Button onClick={generateBriefing} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Générer maintenant
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Briefing sélectionné */}
      {selectedBriefing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedBriefing.titre}</CardTitle>
                <CardDescription>
                  {format(new Date(selectedBriefing.date_briefing), 'EEEE d MMMM yyyy', { locale: fr })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedBriefing.statut === 'lu' ? 'default' : 'secondary'}>
                  {selectedBriefing.statut === 'lu' ? 'Lu' : 'Non lu'}
                </Badge>
                {selectedBriefing.audio_url && (
                  <Button
                    onClick={toggleAudio}
                    variant="outline"
                    size="sm"
                  >
                    {playing ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {playing ? 'Pause' : 'Écouter'}
                  </Button>
                )}
                {selectedBriefing.statut !== 'lu' && (
                  <Button
                    onClick={markAsRead}
                    variant="outline"
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer comme lu
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contenu">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="contenu">Contenu</TabsTrigger>
                <TabsTrigger value="points">Points Clés</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>

              <TabsContent value="contenu" className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{selectedBriefing.contenu_vocal}</p>
                </div>
              </TabsContent>

              <TabsContent value="points" className="space-y-4">
                <div className="space-y-2">
                  {Array.isArray(selectedBriefing.points_cles) && selectedBriefing.points_cles.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                <div className="space-y-2">
                  {Array.isArray(selectedBriefing.questions_strategiques) && selectedBriefing.questions_strategiques.map((question, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{question}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedBriefing.statistiques_resumees).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {Array.isArray(selectedBriefing.alertes_prioritaires) && selectedBriefing.alertes_prioritaires.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Alertes Critiques
                    </h4>
                    {selectedBriefing.alertes_prioritaires.map((alerte, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium">{alerte.indicateur}</p>
                        <p className="text-xs text-muted-foreground">
                          Valeur: {alerte.valeur} ({alerte.variation > 0 ? '+' : ''}{alerte.variation}%)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Liste des briefings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {briefings.map((briefing) => (
              <button
                key={briefing.id}
                onClick={() => setSelectedBriefing(briefing)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedBriefing?.id === briefing.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{briefing.titre}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(briefing.date_briefing), 'd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant={briefing.statut === 'lu' ? 'default' : 'secondary'}>
                    {briefing.statut === 'lu' ? 'Lu' : 'Non lu'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
