import { useRef, useEffect } from 'react';
import { IAstedButton } from './IAstedButton';
import { IAstedListeningOverlay } from './IAstedListeningOverlay';
import { IAstedVoiceControls } from './IAstedVoiceControls';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import { toast } from '@/lib/toast';

interface IAstedVoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IAstedVoiceButton = ({ className = '', size = 'md' }: IAstedVoiceButtonProps) => {
  const { 
    voiceState, 
    handleInteraction, 
    isListening, 
    isThinking, 
    isSpeaking,
    audioLevel,
    continuousMode,
    continuousModePaused,
    toggleContinuousPause,
    stopListening,
    cancelInteraction,
    silenceDetected,
    silenceTimeRemaining,
    silenceDuration,
  } = useVoiceInteraction();
  const lastClickTime = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ': // Espace - démarrer/arrêter
          event.preventDefault();
          handleInteraction();
          toast.info(
            voiceState === 'idle' ? 'Démarrage iAsted' : 'Arrêt iAsted',
            'Raccourci: Espace'
          );
          break;
        case 'escape': // Échap - annuler
          event.preventDefault();
          if (voiceState !== 'idle') {
            cancelInteraction();
            toast.info('Interaction annulée', 'Raccourci: Échap');
          }
          break;
        case 'r': // R - redémarrer
          event.preventDefault();
          if (voiceState !== 'idle') {
            handleInteraction();
            toast.info('Nouvelle question', 'Raccourci: R');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, handleInteraction, cancelInteraction]);

  const handleDoubleClick = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Increment click count
    clickCount.current += 1;
    lastClickTime.current = now;

    // Clear existing timeout
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    // If double click (within 400ms), trigger voice interaction
    if (clickCount.current === 2 && timeSinceLastClick < 400) {
      clickCount.current = 0;
      handleInteraction();
    } else {
      // Reset count after timeout
      clickTimeout.current = setTimeout(() => {
        clickCount.current = 0;
      }, 400);
    }
  };

  return (
    <>
      <IAstedButton
        onClick={handleDoubleClick}
        className={className}
        size={size}
        voiceListening={isListening}
        voiceSpeaking={isSpeaking}
        voiceProcessing={isThinking}
        isInterfaceOpen={false}
        audioLevel={audioLevel}
        continuousMode={continuousMode}
        continuousModePaused={continuousModePaused}
        onToggleContinuousPause={toggleContinuousPause}
      />
      
      {/* Overlay d'écoute */}
      <IAstedListeningOverlay 
        audioLevel={audioLevel}
        isVisible={isListening}
        silenceDetected={silenceDetected}
        silenceTimeRemaining={silenceTimeRemaining}
        silenceDuration={silenceDuration}
        onSendNow={stopListening}
        onCancel={cancelInteraction}
      />
      
      {/* Contrôles vocaux */}
      <IAstedVoiceControls
        voiceState={voiceState}
        onStop={stopListening}
        onCancel={cancelInteraction}
        onRestart={handleInteraction}
      />
    </>
  );
};

export default IAstedVoiceButton;
