import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate minimum loading time for smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoadingComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-sm animate-fade-in">
      <div className="relative">
        {/* Animated circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full border-2 border-primary/30 animate-pulse" />
        </div>
        
        {/* Logo container */}
        <div className="relative z-10 flex flex-col items-center gap-6 animate-scale-in">
          {/* Logo with wave animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-8 bg-background rounded-full shadow-elevated">
              <Logo size="xl" className="animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>
          
          {/* Loading text and indicator */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-foreground">PÊCHE GABON</h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-muted-foreground animate-fade-in">Chargement en cours...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
