import { useRef, useEffect } from 'react';
import { IAstedButton } from './IAstedButton';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';

interface IAstedVoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IAstedVoiceButton = ({ className = '', size = 'md' }: IAstedVoiceButtonProps) => {
  const { voiceState, handleInteraction, isListening, isThinking, isSpeaking, audioLevel, continuousMode, continuousModePaused, toggleContinuousPause } = useVoiceInteraction();
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
  );
};

export default IAstedVoiceButton;
