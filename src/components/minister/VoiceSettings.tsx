import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { Volume2, Loader2, Save, Star, Trash2, Download } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  labels?: { [key: string]: string };
  preview_url?: string;
}

interface VoicePreset {
  id: string;
  name: string;
  voice_id: string;
  voice_silence_duration: number;
  voice_silence_threshold: number;
  voice_continuous_mode: boolean;
  is_default: boolean;
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
  
  // Presets management
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

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

  // Load presets
  useEffect(() => {
    async function loadPresets() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('voice_presets')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('name', { ascending: true });

        if (error) throw error;

        setPresets(data || []);
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }

    loadPresets();
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
      toast.error("Impossible de lire l'aperçu");
      setPreviewPlaying(null);
    }
  };

  const saveAsPreset = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!newPresetName.trim()) {
      toast.error('Veuillez entrer un nom pour le favori');
      return;
    }

    setSavingPreset(true);
    try {
      const { data, error } = await supabase
        .from('voice_presets')
        .insert({
          user_id: user.id,
          name: newPresetName.trim(),
          voice_id: selectedVoice,
          voice_silence_duration: silenceDuration,
          voice_silence_threshold: threshold,
          voice_continuous_mode: continuousMode,
        })
        .select()
        .single();

      if (error) throw error;

      setPresets(prev => [...prev, data]);
      setNewPresetName("");
      setShowSavePresetDialog(false);
      setHasChanges(false);
      toast.success(`Favori "${newPresetName}" sauvegardé`);
    } catch (error: any) {
      console.error('Error saving preset:', error);
      if (error.code === '23505') {
        toast.error('Un favori avec ce nom existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde du favori');
      }
    } finally {
      setSavingPreset(false);
    }
  };

  const loadPreset = async (preset: VoicePreset) => {
    setSelectedVoice(preset.voice_id);
    setSilenceDuration(preset.voice_silence_duration);
    setThreshold(preset.voice_silence_threshold);
    setContinuousMode(preset.voice_continuous_mode);
    
    // Notify parent components
    onVoiceChange?.(preset.voice_id);
    onSilenceDurationChange?.(preset.voice_silence_duration);
    onThresholdChange?.(preset.voice_silence_threshold);
    onContinuousModeChange?.(preset.voice_continuous_mode);
    
    setHasChanges(false);
    toast.success(`Favori "${preset.name}" chargé`);
  };

  const deletePreset = async (presetId: string, presetName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('voice_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      setPresets(prev => prev.filter(p => p.id !== presetId));
      toast.success(`Favori "${presetName}" supprimé`);
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast.error('Erreur lors de la suppression du favori');
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
    <div className="space-y-6">
      {/* Presets Section */}
      {presets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Favoris
            </CardTitle>
            <CardDescription>
              Configurations vocales sauvegardées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((preset) => (
                <Card key={preset.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{preset.name}</h4>
                      {preset.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <p>Voix: {voices.find(v => v.id === preset.voice_id)?.name || preset.voice_id.substring(0, 8)}</p>
                      <p>Silence: {preset.voice_silence_duration}ms</p>
                      <p>Sensibilité: {preset.voice_silence_threshold}%</p>
                      <p>Mode continu: {preset.voice_continuous_mode ? "Activé" : "Désactivé"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => loadPreset(preset)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Charger
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id, preset.name)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings Card */}
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

        {/* Save Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1"
              >
                <Star className="h-4 w-4 mr-2" />
                Sauvegarder comme favori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sauvegarder comme favori</DialogTitle>
                <DialogDescription>
                  Donnez un nom à cette configuration pour la retrouver facilement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Nom du favori</Label>
                  <Input
                    id="preset-name"
                    placeholder="Ex: Voix grave et rapide"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPresetName.trim()) {
                        saveAsPreset();
                      }
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Configuration actuelle:</strong></p>
                  <p>• Voix: {voices.find(v => v.id === selectedVoice)?.name}</p>
                  <p>• Durée silence: {silenceDuration}ms</p>
                  <p>• Sensibilité: {threshold}%</p>
                  <p>• Mode continu: {continuousMode ? "Activé" : "Désactivé"}</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSavePresetDialog(false);
                    setNewPresetName("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveAsPreset}
                  disabled={!newPresetName.trim() || savingPreset}
                >
                  {savingPreset ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
            className="flex-1"
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
    </div>
  );
}
