import { useEffect, useState } from 'react';
import { Mic, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface IAstedListeningOverlayProps {
  audioLevel: number;
  isVisible: boolean;
  silenceDetected: boolean;
  silenceTimeRemaining: number;
  silenceDuration: number;
  onSendNow?: () => void;
  onCancel?: () => void;
  liveTranscript?: string;
}

export const IAstedListeningOverlay = ({ 
  audioLevel, 
  isVisible, 
  silenceDetected, 
  silenceTimeRemaining,
  silenceDuration,
  onSendNow,
  onCancel,
  liveTranscript = '',
}: IAstedListeningOverlayProps) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (isVisible && audioLevel > 0) {
      const scale = 1 + (audioLevel / 100) * 0.5;
      setPulseScale(scale);
    } else {
      setPulseScale(1);
    }
  }, [audioLevel, isVisible]);

  if (!isVisible) return null;

  const silenceProgress = silenceTimeRemaining > 0 
    ? (silenceTimeRemaining / silenceDuration) * 100 
    : 0;

  return (
    <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-500">
        {/* Indicateur de niveau sonore circulaire */}
        <div className="relative flex items-center justify-center">
          {/* Cercles de fond animés */}
          <div 
            className="absolute w-64 h-64 rounded-full bg-primary/10 animate-pulse"
            style={{
              transform: `scale(${pulseScale})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          <div 
            className="absolute w-52 h-52 rounded-full bg-primary/20 animate-pulse"
            style={{
              transform: `scale(${pulseScale * 0.9})`,
              transition: 'transform 0.1s ease-out',
              animationDelay: '0.1s'
            }}
          />
          <div 
            className="absolute w-40 h-40 rounded-full bg-primary/30 animate-pulse"
            style={{
              transform: `scale(${pulseScale * 0.8})`,
              transition: 'transform 0.1s ease-out',
              animationDelay: '0.2s'
            }}
          />
          
          {/* Icône micro centrale */}
          <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl">
            <Mic className="w-14 h-14 text-primary-foreground" />
          </div>
          
          {/* Barre de niveau sonore */}
          <div className="absolute -bottom-16 w-full max-w-md">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 transition-all duration-100 ease-out rounded-full"
                style={{ 
                  width: `${audioLevel}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center animate-in slide-in-from-bottom duration-700 max-w-2xl">
          <h2 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
            {silenceDetected ? "Détection de silence..." : "Je vous écoute Excellence"}
          </h2>
          <p className="text-muted-foreground text-lg mb-4">
            {silenceDetected 
              ? `Envoi dans ${(silenceTimeRemaining / 1000).toFixed(1)}s` 
              : "Parlez maintenant..."}
          </p>
          
          {/* Transcription en temps réel */}
          {liveTranscript && (
            <div className="mt-4 p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground mb-1">Transcription en direct:</p>
              <p className="text-base text-foreground font-medium">
                {liveTranscript}
              </p>
            </div>
          )}
        </div>

        {/* Indicateur de silence avec compte à rebours */}
        {silenceDetected && (
          <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-2 text-warning">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Silence détecté</span>
            </div>
            
            {/* Barre de progression du silence */}
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-warning to-destructive transition-all duration-100 rounded-full"
                style={{ 
                  width: `${100 - silenceProgress}%`,
                }}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              L'enregistrement s'arrête automatiquement
            </p>
          </div>
        )}

        {/* VU-mètre amélioré */}
        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom duration-1000">
          <div className="flex items-end gap-1.5 h-24">
            {[...Array(20)].map((_, i) => {
              // Créer un effet de distribution pour simuler un VU-mètre réaliste
              const barHeight = Math.max(
                8,
                (audioLevel / 100) * 80 * (0.5 + Math.random() * 0.5)
              );
              const delay = i * 0.05;
              
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-100 ease-out"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: audioLevel > 70 
                      ? 'hsl(var(--destructive))' 
                      : audioLevel > 40 
                      ? 'hsl(var(--warning))' 
                      : 'hsl(var(--primary))',
                    opacity: audioLevel > 5 ? 0.9 : 0.3,
                    animationDelay: `${delay}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {onSendNow && (
              <Button onClick={onSendNow} className="px-6">
                Envoyer maintenant
              </Button>
            )}
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} className="px-6">
                Annuler
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
