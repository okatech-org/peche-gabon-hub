import { useEffect } from "react";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export const SuccessAnimation = ({ 
  message = "Connexion réussie", 
  onComplete,
  duration = 2000 
}: SuccessAnimationProps) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative">
        {/* Cercle de fond avec animation */}
        <div className="relative flex items-center justify-center">
          {/* Cercle externe pulsant */}
          <div className="absolute w-32 h-32 rounded-full bg-primary/20 animate-ping" />
          
          {/* Cercle principal */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-hover shadow-elevated flex items-center justify-center animate-scale-in">
            {/* Checkmark animé */}
            <Check className="w-12 h-12 text-white animate-check-draw" strokeWidth={3} />
          </div>
        </div>

        {/* Message de succès */}
        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-lg font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">Redirection en cours...</p>
        </div>
      </div>
    </div>
  );
};
