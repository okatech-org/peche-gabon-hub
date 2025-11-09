import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const useVoiceInteraction = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [currentAudio]);

  const getGreetingMessage = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes since midnight
    
    // Morning: 00:00 to 12:01 (0 to 721 minutes)
    // Evening: 12:01 to 23:59 (721 to 1439 minutes)
    const isMorning = currentTime <= 721;
    const period = isMorning ? 'morning' : 'evening';
    
    // Check if already greeted in this period today
    const today = now.toDateString();
    const lastGreeting = localStorage.getItem('iasted_last_greeting');
    const lastGreetingData = lastGreeting ? JSON.parse(lastGreeting) : null;
    
    const alreadyGreeted = lastGreetingData && 
                          lastGreetingData.date === today && 
                          lastGreetingData.period === period;
    
    // Update greeting status
    localStorage.setItem('iasted_last_greeting', JSON.stringify({
      date: today,
      period: period
    }));
    
    if (alreadyGreeted) {
      return isMorning 
        ? "Que puis-je faire pour vous Excellence?" 
        : "Excellence, puis-je vous aider?";
    } else {
      return isMorning ? "Bonjour Excellence" : "Bonsoir Excellence";
    }
  };

  const playGreeting = async () => {
    try {
      const greetingMessage = getGreetingMessage();
      
      setVoiceState('speaking');
      
      // Generate audio for greeting
      const { data: greetingData, error: greetingError } = await supabase.functions.invoke('chat-with-iasted', {
        body: { 
          message: greetingMessage,
          generateAudio: true 
        }
      });

      if (greetingError || !greetingData.audioContent) {
        throw new Error('Failed to generate greeting audio');
      }

      // Play greeting audio
      await new Promise<void>((resolve, reject) => {
        const binaryString = atob(greetingData.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Error playing greeting'));
        };

        setCurrentAudio(audio);
        audio.play();
      });

      setCurrentAudio(null);
    } catch (error) {
      console.error('Error playing greeting:', error);
    }
  };

  const analyzeAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 255) * 100);
    
    setAudioLevel(normalizedLevel);

    // Silence detection: if level is above threshold, update last sound time
    const SILENCE_THRESHOLD = 10; // Adjust this value based on testing
    const SILENCE_DURATION = 2000; // 2 seconds of silence
    
    if (normalizedLevel > SILENCE_THRESHOLD) {
      lastSoundTimeRef.current = Date.now();
      
      // Clear any existing silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // If we're below threshold and no timer is running, start one
      if (!silenceTimerRef.current && voiceState === 'listening') {
        silenceTimerRef.current = setTimeout(() => {
          const timeSinceLastSound = Date.now() - lastSoundTimeRef.current;
          if (timeSinceLastSound >= SILENCE_DURATION) {
            console.log('Silence detected, stopping recording');
            stopListening();
          }
          silenceTimerRef.current = null;
        }, SILENCE_DURATION);
      }
    }

    if (voiceState === 'listening') {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        setAudioLevel(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setVoiceState('listening');
      
      // Reset silence detection
      lastSoundTimeRef.current = Date.now();
      
      // Start analyzing audio level
      analyzeAudioLevel();

      // Auto stop after 10 seconds as fallback
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('Max recording time reached, stopping');
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone.",
        variant: "destructive"
      });
      setVoiceState('idle');
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      mediaRecorder.stop();
      setVoiceState('thinking');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        // Transcribe audio
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Data }
        });

        if (transcriptionError || !transcriptionData.text) {
          throw new Error('Transcription failed');
        }

        console.log('Transcription:', transcriptionData.text);

        // Maintain thinking state for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get AI response
        const { data: chatData, error: chatError } = await supabase.functions.invoke('chat-with-iasted', {
          body: { 
            message: transcriptionData.text,
            generateAudio: true 
          }
        });

        if (chatError || !chatData.message) {
          throw new Error('Chat failed');
        }

        console.log('AI Response:', chatData.message);

        // Play audio response if available
        if (chatData.audioContent) {
          await playAudioResponse(chatData.audioContent);
        } else {
          setVoiceState('idle');
        }
      };

      reader.onerror = () => {
        console.error('Error reading audio file');
        setVoiceState('idle');
      };

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'audio.",
        variant: "destructive"
      });
      setVoiceState('idle');
    }
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      setVoiceState('speaking');

      // Convert base64 to audio blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setVoiceState('idle');
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        console.error('Error playing audio');
        URL.revokeObjectURL(audioUrl);
        setVoiceState('idle');
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
      await audio.play();

    } catch (error) {
      console.error('Error playing audio:', error);
      setVoiceState('idle');
    }
  };

  const handleInteraction = async () => {
    if (voiceState === 'idle') {
      // Play greeting first, then start listening
      await playGreeting();
      startListening();
    } else if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      // Stop current audio and reset
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      setVoiceState('idle');
    }
  };

  return {
    voiceState,
    handleInteraction,
    isListening: voiceState === 'listening',
    isThinking: voiceState === 'thinking',
    isSpeaking: voiceState === 'speaking',
    audioLevel,
  };
};
