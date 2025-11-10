import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Play, Download, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateGroupedAudioSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRemontees: any[];
}

const VOICES = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", description: "Voix féminine expressive" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Voix masculine professionnelle" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Voix féminine claire" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Voix féminine posée" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Voix masculine énergique" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Voix masculine autoritaire" },
];

const CONTENT_OPTIONS = [
  { id: "reference", label: "Numéro de référence", defaultChecked: true },
  { id: "type", label: "Type de remontée", defaultChecked: true },
  { id: "priorite", label: "Niveau de priorité", defaultChecked: true },
  { id: "statut", label: "Statut actuel", defaultChecked: true },
  { id: "localisation", label: "Localisation", defaultChecked: true },
  { id: "description", label: "Description détaillée", defaultChecked: false },
  { id: "date", label: "Date de soumission", defaultChecked: false },
];

const SUMMARY_FORMATS = [
  { id: "synthetique", label: "Synthétique", description: "Résumé bref et concis" },
  { id: "standard", label: "Standard", description: "Résumé équilibré avec détails essentiels" },
  { id: "detaille", label: "Détaillé", description: "Résumé complet avec toutes les informations" },
];

export function GenerateGroupedAudioSummaryDialog({
  open,
  onOpenChange,
  selectedRemontees,
}: GenerateGroupedAudioSummaryDialogProps) {
  const [voiceId, setVoiceId] = useState("CwhRBWXzGAHq8TQ4Fs17");
  const [summaryFormat, setSummaryFormat] = useState("standard");
  const [contentOptions, setContentOptions] = useState<string[]>([
    "reference", "type", "priorite", "statut", "localisation"
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const toggleContentOption = (optionId: string) => {
    setContentOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleGenerate = async () => {
    if (selectedRemontees.length === 0) {
      toast.error("Aucune remontée sélectionnée");
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      // Générer le texte du résumé groupé
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'generate-grouped-remontee-summary',
        {
          body: {
            remontees: selectedRemontees,
            format: summaryFormat,
            includeFields: contentOptions,
          }
        }
      );

      if (summaryError) throw summaryError;

      // Générer l'audio à partir du texte
      const { data: audioData, error: audioError } = await supabase.functions.invoke(
        'generate-audio-summary',
        {
          body: {
            text: summaryData.summary,
            voiceId: voiceId,
          }
        }
      );

      if (audioError) throw audioError;

      if (audioData.success && audioData.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        toast.success("Résumé audio généré avec succès");
      }
    } catch (error) {
      console.error('Erreur génération audio groupé:', error);
      toast.error("Erreur lors de la génération du résumé audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      toast.error("Erreur lors de la lecture audio");
    };

    audio.play().catch(err => {
      console.error('Erreur lecture:', err);
      setIsPlaying(false);
      toast.error("Impossible de lire l'audio");
    });
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `resume-groupe-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Téléchargement démarré");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Générer un résumé audio groupé
          </DialogTitle>
          <DialogDescription>
            Personnalisez la génération du résumé audio pour {selectedRemontees.length} remontée(s) sélectionnée(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection de la voix */}
          <div className="space-y-2">
            <Label>Voix</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map(voice => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format du résumé */}
          <div className="space-y-2">
            <Label>Format du résumé</Label>
            <RadioGroup value={summaryFormat} onValueChange={setSummaryFormat}>
              {SUMMARY_FORMATS.map(format => (
                <div key={format.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={format.id} id={format.id} />
                  <Label htmlFor={format.id} className="font-normal cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium">{format.label}</span>
                      <span className="text-xs text-muted-foreground">{format.description}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Options de contenu */}
          <div className="space-y-2">
            <Label>Informations à inclure</Label>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_OPTIONS.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={contentOptions.includes(option.id)}
                    onCheckedChange={() => toggleContentOption(option.id)}
                  />
                  <Label htmlFor={option.id} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || contentOptions.length === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Générer le résumé audio
                </>
              )}
            </Button>
          </div>

          {/* Lecteur audio */}
          {audioUrl && (
            <div className="flex gap-2 p-4 bg-muted rounded-lg">
              <Button
                onClick={handlePlay}
                disabled={isPlaying}
                variant="outline"
                size="sm"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center">
                <span className="text-sm text-muted-foreground">
                  {isPlaying ? "Lecture en cours..." : "Résumé audio prêt"}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
