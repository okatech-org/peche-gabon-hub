import { Mic, MicOff, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IAstedVoiceControlsProps {
  voiceState: 'idle' | 'listening' | 'thinking' | 'speaking';
  onStop: () => void;
  onCancel: () => void;
  onRestart: () => void;
}

export const IAstedVoiceControls = ({
  voiceState,
  onStop,
  onCancel,
  onRestart,
}: IAstedVoiceControlsProps) => {
  if (voiceState === 'idle') return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
        {/* Arrêter l'écoute */}
        {voiceState === 'listening' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStop}
                variant="secondary"
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <MicOff className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Arrêter l'écoute</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Annuler la conversation */}
        {(voiceState === 'thinking' || voiceState === 'speaking') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCancel}
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <XCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Annuler l'interaction</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Redémarrer */}
        {voiceState !== 'listening' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRestart}
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nouvelle question</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Indicateur d'état */}
        <div className="ml-4 px-6 py-3 rounded-full bg-muted shadow-lg">
          <p className="text-sm font-medium flex items-center gap-2">
            {voiceState === 'listening' && (
              <>
                <Mic className="h-4 w-4 animate-pulse text-primary" />
                <span>En écoute...</span>
              </>
            )}
            {voiceState === 'thinking' && (
              <>
                <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                <span>Réflexion en cours...</span>
              </>
            )}
            {voiceState === 'speaking' && (
              <>
                <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
                <span>iAsted parle...</span>
              </>
            )}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};
