import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Volume2, Loader2, Save } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  labels?: { [key: string]: string };
  preview_url?: string;
}

interface VoiceSettingsProps {
  onVoiceChange?: (voiceId: string) => void;
  onSilenceDurationChange?: (duration: number) => void;
  onThresholdChange?: (threshold: number) => void;
  onContinuousModeChange?: (enabled: boolean) => void;
}

export function VoiceSettings({
  onVoiceChange,
  onSilenceDurationChange,
  onThresholdChange,
  onContinuousModeChange
}: VoiceSettingsProps) {
  const { user } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [silenceDuration, setSilenceDuration] = useState(2000);
  const [threshold, setThreshold] = useState(10);
  const [continuousMode, setContinuousMode] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('voice_silence_duration, voice_silence_threshold, voice_continuous_mode, voice_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
        }

        if (data) {
          setSilenceDuration(data.voice_silence_duration || 2000);
          setThreshold(data.voice_silence_threshold || 10);
          setContinuousMode(data.voice_continuous_mode || false);
          if (data.voice_id) {
            setSelectedVoice(data.voice_id);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }

    loadPreferences();
  }, [user]);

  // Fetch available voices
  useEffect(() => {
    async function fetchVoices() {
      try {
        const { data, error } = await supabase.functions.invoke('list-voices');
        
        if (error) throw error;
        
        if (data?.voices) {
          setVoices(data.voices);
          // Select first voice by default if none selected
          if (data.voices.length > 0 && !selectedVoice) {
            setSelectedVoice(data.voices[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast.error('Impossible de charger les voix disponibles');
      } finally {
        setLoading(false);
      }
    }

    fetchVoices();
  }, []);

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setHasChanges(true);
    onVoiceChange?.(voiceId);
  };

  const handleSilenceDurationChange = (value: number[]) => {
    const duration = value[0];
    setSilenceDuration(duration);
    setHasChanges(true);
    onSilenceDurationChange?.(duration);
  };

  const handleThresholdChange = (value: number[]) => {
    const newThreshold = value[0];
    setThreshold(newThreshold);
    setHasChanges(true);
    onThresholdChange?.(newThreshold);
  };

  const handleContinuousModeChange = (enabled: boolean) => {
    setContinuousMode(enabled);
    setHasChanges(true);
    onContinuousModeChange?.(enabled);
  };

  const savePreferences = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour sauvegarder vos préférences');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          voice_id: selectedVoice,
          voice_silence_duration: silenceDuration,
          voice_silence_threshold: threshold,
          voice_continuous_mode: continuousMode,
        });

      if (error) throw error;

      setHasChanges(false);
      toast.success('Préférences sauvegardées avec succès');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  const playPreview = async (voiceId: string, previewUrl?: string) => {
    if (!previewUrl) {
      toast.info('Aucun aperçu disponible pour cette voix');
      return;
    }

    try {
      setPreviewPlaying(voiceId);
      const audio = new Audio(previewUrl);
      audio.onended = () => setPreviewPlaying(null);
      await audio.play();
    } catch (error) {
      console.error('Error playing preview:', error);
      toast.error('Impossible de lire l\'aperçu');
      setPreviewPlaying(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Vocaux</CardTitle>
          <CardDescription>Configuration de l'assistant vocal iAsted</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Vocaux</CardTitle>
        <CardDescription>
          Personnalisez votre expérience avec iAsted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice-select">Voix d'iAsted</Label>
          <div className="flex gap-2">
            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger id="voice-select">
                <SelectValue placeholder="Sélectionner une voix" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                    {voice.labels?.accent && ` (${voice.labels.accent})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedVoice && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const voice = voices.find(v => v.id === selectedVoice);
                  playPreview(selectedVoice, voice?.preview_url);
                }}
                disabled={previewPlaying === selectedVoice}
              >
                {previewPlaying === selectedVoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {voices.length} voix disponibles
          </p>
        </div>

        {/* Silence Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Durée de silence</Label>
            <span className="text-sm text-muted-foreground">{silenceDuration}ms</span>
          </div>
          <Slider
            value={[silenceDuration]}
            onValueChange={handleSilenceDurationChange}
            min={500}
            max={3000}
            step={100}
          />
          <p className="text-xs text-muted-foreground">
            Temps d'attente avant de considérer que vous avez fini de parler
          </p>
        </div>

        {/* Voice Detection Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sensibilité du micro</Label>
            <span className="text-sm text-muted-foreground">{(threshold * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={handleThresholdChange}
            min={0.1}
            max={1}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">
            Niveau de volume minimum pour détecter votre voix
          </p>
        </div>

        {/* Continuous Mode */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor="continuous-mode">Mode continu</Label>
            <p className="text-xs text-muted-foreground mt-1">
              iAsted écoutera automatiquement après chaque réponse
            </p>
          </div>
          <Switch
            id="continuous-mode"
            checked={continuousMode}
            onCheckedChange={handleContinuousModeChange}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les préférences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
