import { useEffect, useState } from 'react';
import { Mic, Clock } from 'lucide-react';

interface IAstedListeningOverlayProps {
  audioLevel: number;
  isVisible: boolean;
  silenceDetected: boolean;
  silenceTimeRemaining: number;
  silenceDuration: number;
}

export const IAstedListeningOverlay = ({ 
  audioLevel, 
  isVisible, 
  silenceDetected, 
  silenceTimeRemaining,
  silenceDuration 
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
        <div className="text-center animate-in slide-in-from-bottom duration-700">
          <h2 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
            {silenceDetected ? "Détection de silence..." : "Je vous écoute Excellence"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {silenceDetected 
              ? `Envoi dans ${(silenceTimeRemaining / 1000).toFixed(1)}s` 
              : "Parlez maintenant..."}
          </p>
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

        {/* Indicateur d'activité */}
        <div className="flex gap-2 animate-in slide-in-from-bottom duration-1000">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-8 bg-primary/60 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${20 + (audioLevel / 100) * 20}px`,
                transition: 'height 0.1s ease-out'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
