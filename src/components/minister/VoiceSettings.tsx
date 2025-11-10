import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface VoiceSettingsProps {
  onVoiceChange: (voiceId: string) => void;
  onSilenceDurationChange: (silenceDuration: number) => void;
  onThresholdChange: (threshold: number) => void;
  onContinuousModeChange: (continuousMode: boolean) => void;
}

export const VoiceSettings = ({
  onVoiceChange,
  onSilenceDurationChange,
  onThresholdChange,
  onContinuousModeChange
}: VoiceSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Vocaux</CardTitle>
        <CardDescription>
          Personnalisez votre expérience avec l'iAsted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice">Voix</Label>
          <Select onValueChange={onVoiceChange}>
            <SelectTrigger id="voice">
              <SelectValue placeholder="Sélectionner une voix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Voix par défaut</SelectItem>
              <SelectItem value="male">Voix masculine</SelectItem>
              <SelectItem value="female">Voix féminine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Silence Duration */}
        <div className="space-y-2">
          <Label htmlFor="silence-duration">
            Durée de silence (ms)
          </Label>
          <Slider
            id="silence-duration"
            min={500}
            max={3000}
            step={100}
            defaultValue={[1000]}
            onValueChange={([value]) => onSilenceDurationChange(value)}
          />
          <p className="text-sm text-muted-foreground">
            Plus la durée est courte, plus l'iAsted réagit rapidement
          </p>
        </div>

        {/* Threshold */}
        <div className="space-y-2">
          <Label htmlFor="threshold">
            Seuil de détection
          </Label>
          <Slider
            id="threshold"
            min={0.1}
            max={1.0}
            step={0.1}
            defaultValue={[0.5]}
            onValueChange={([value]) => onThresholdChange(value)}
          />
          <p className="text-sm text-muted-foreground">
            Augmentez si l'iAsted capte trop de bruit de fond
          </p>
        </div>

        {/* Continuous Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="continuous-mode">Mode conversation continue</Label>
            <p className="text-sm text-muted-foreground">
              L'iAsted écoute automatiquement après chaque réponse
            </p>
          </div>
          <Switch
            id="continuous-mode"
            onCheckedChange={onContinuousModeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
