import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { toast as unifiedToast } from '@/lib/toast';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceInteractionMessage {
  role: 'user' | 'assistant';
  content: string;
  audio_base64?: string;
}

export const useVoiceInteraction = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [silenceDuration, setSilenceDuration] = useState<number>(900);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(10);
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [continuousModePaused, setContinuousModePaused] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<VoiceInteractionMessage[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [silenceDetected, setSilenceDetected] = useState<boolean>(false);
  const [silenceTimeRemaining, setSilenceTimeRemaining] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const continuousModeToastShownRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize playback audio context once
  useEffect(() => {
    playbackAudioContextRef.current = new AudioContext();
    
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (playbackAudioContextRef.current) {
        playbackAudioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (silenceCountdownIntervalRef.current) {
        clearInterval(silenceCountdownIntervalRef.current);
      }
    };
  }, [currentAudio]);

  // Resume audio context if suspended
  const ensureAudioContextResumed = async () => {
    if (playbackAudioContextRef.current && playbackAudioContextRef.current.state === 'suspended') {
      console.log('Resuming suspended AudioContext');
      await playbackAudioContextRef.current.resume();
    }
  };

  // Créer ou charger une session
  useEffect(() => {
    const initSession = async () => {
      if (!user) return;

      try {
        // Créer une nouvelle session
        const { data: sessionData, error: sessionError } = await supabase
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            settings: {
              silenceDuration,
              silenceThreshold,
              continuousMode
            }
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          return;
        }

        setSessionId(sessionData.id);
        console.log('Session created:', sessionData.id);
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, [user]);

  // Charger les préférences vocales de l'utilisateur
  useEffect(() => {
    const loadVoicePreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('voice_silence_duration, voice_silence_threshold, voice_continuous_mode')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading voice preferences:', error);
          return;
        }

        if (data) {
          setSilenceDuration(data.voice_silence_duration || 1500);
          setSilenceThreshold(data.voice_silence_threshold || 10);
          const newContinuousMode = data.voice_continuous_mode || false;
          setContinuousMode(newContinuousMode);
          
          if (!newContinuousMode) {
            continuousModeToastShownRef.current = false;
          }
        }
      } catch (error) {
        console.error('Error loading voice preferences:', error);
      }
    };

    loadVoicePreferences();
  }, [user]);

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
      
      console.log('Playing greeting:', greetingMessage);
      
      // Ensure audio context is ready
      await ensureAudioContextResumed();
      
      // Generate audio for greeting (simple TTS without AI conversation)
      const { data: greetingData, error: greetingError } = await supabase.functions.invoke('generate-greeting-audio', {
        body: { text: greetingMessage }
      });

      if (greetingError || !greetingData.audioContent) {
        console.error('Failed to generate greeting audio:', greetingError);
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
          console.log('Greeting finished, ready to listen');
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Error playing greeting'));
        };

        setCurrentAudio(audio);
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          reject(err);
        });
      });

      setCurrentAudio(null);
    } catch (error) {
      console.error('Error playing greeting:', error);
      // Continue to listening even if greeting fails
    }
  };

  const analyzeAudioLevel = () => {
    if (!analyserRef.current || voiceState !== 'listening') return;

    // Use time-domain data for more reliable VAD
    const timeDomain = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(timeDomain);

    // Compute RMS amplitude (0..1)
    let sumSquares = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const centered = (timeDomain[i] - 128) / 128; // -1..1
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / timeDomain.length);
    const level = Math.min(1, rms * 2); // simple scaling
    const normalizedLevel = Math.round(level * 100);

    setAudioLevel(normalizedLevel);

    if (normalizedLevel > silenceThreshold) {
      // Voice activity
      lastSoundTimeRef.current = Date.now();
      setSilenceDetected(false);
      setSilenceTimeRemaining(0);
      if (silenceCountdownIntervalRef.current) {
        clearInterval(silenceCountdownIntervalRef.current);
        silenceCountdownIntervalRef.current = null;
      }
    } else {
      const timeSinceLastSound = Date.now() - lastSoundTimeRef.current;

      // Show visual feedback after 200ms of silence
      if (timeSinceLastSound >= 200 && !silenceDetected) {
        setSilenceDetected(true);
        setSilenceTimeRemaining(silenceDuration);
        if (!silenceCountdownIntervalRef.current) {
          silenceCountdownIntervalRef.current = setInterval(() => {
            const remaining = silenceDuration - (Date.now() - lastSoundTimeRef.current);
            if (remaining > 0) {
              setSilenceTimeRemaining(Math.max(0, remaining));
            }
          }, 50);
        }
      }

      if (timeSinceLastSound >= silenceDuration) {
        console.log('Silence detected, stopping recording (rms-based)');
        if (silenceCountdownIntervalRef.current) {
          clearInterval(silenceCountdownIntervalRef.current);
          silenceCountdownIntervalRef.current = null;
        }
        stopListening();
        return;
      }
    }

    if (voiceState === 'listening') {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
    }
  };

  const startListening = async () => {
    try {
      setLiveTranscript(''); // Reset transcript
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep a stable reference for stopping/cleanup
      streamRef.current = stream;
      
      // Start Web Speech API for live transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
        
        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          
          setLiveTranscript(final + interim);
        };

        recognition.onspeechend = () => {
          console.log('🗣️ Speech ended detected by WebSpeech, stopping listening');
          if (voiceState === 'listening') {
            stopListening();
          }
        };

        recognition.onend = () => {
          console.log('ℹ️ Speech recognition ended');
          // If listening is still active (edge case), ensure we stop
          if (voiceState === 'listening') {
            stopListening();
          }
        };
        
        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };
        
        recognition.start();
        recognitionRef.current = recognition;
        console.log('🎤 Speech recognition started');
      }
      
      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        console.log('📼 Recorder stopped, processing audio...');
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('📦 Audio blob size:', audioBlob.size, 'bytes');
        
        if (audioBlob.size === 0) {
          console.error('❌ Audio blob is empty!');
          setVoiceState('idle');
          toast({
            title: "Erreur",
            description: "Aucun audio enregistré. Veuillez réessayer.",
            variant: "destructive"
          });
          const s = streamRef.current || stream;
          s?.getTracks().forEach(track => track.stop());
          return;
        }
        
        await processAudio(audioBlob);
         const s2 = streamRef.current || stream;
         s2?.getTracks().forEach(track => track.stop());
        
        // Clean up audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (silenceCountdownIntervalRef.current) {
          clearInterval(silenceCountdownIntervalRef.current);
        }
        setAudioLevel(0);
        setSilenceDetected(false);
        setSilenceTimeRemaining(0);
      };

      recorder.start();
      console.log('🎙️ Recording started');
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setVoiceState('listening');
      
      // Reset silence detection
      lastSoundTimeRef.current = Date.now();
      setSilenceDetected(false);
      setSilenceTimeRemaining(0);
      
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
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        console.log('🛑 Speech recognition stopped');
      } catch (e) {
        console.warn('⚠️ Error stopping speech recognition:', e);
      }
    }
    
    const mr = mediaRecorderRef.current || mediaRecorder;
    const state = mr?.state;
    console.log('🛑 Stopping listening... State:', state);
    if (mr && state === 'recording') {
      // Clear silence timer and countdown
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (silenceCountdownIntervalRef.current) {
        clearInterval(silenceCountdownIntervalRef.current);
        silenceCountdownIntervalRef.current = null;
      }
      
      setSilenceDetected(false);
      setSilenceTimeRemaining(0);
      setVoiceState('thinking');
      console.log('🔄 State changed to thinking, stopping recorder...');
      try {
        mr.stop();
        console.log('✅ Recorder.stop() called');
      } catch (e) {
        console.warn('⚠️ Recorder.stop() threw, proceeding to process if possible', e);
      }
    } else {
      console.warn('⚠️ Cannot stop - recorder state:', state);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    console.log('🎤 Processing audio... Blob size:', audioBlob.size);
    
    if (!sessionId) {
      console.error('❌ No session ID available');
      setVoiceState('idle');
      return;
    }

    if (audioBlob.size === 0) {
      console.error('❌ Audio blob is empty in processAudio');
      setVoiceState('idle');
      return;
    }

    try {
      const startTime = Date.now();
      console.log('📝 Converting audio to base64...');
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        console.log('✅ Base64 conversion complete');
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        console.log('🌐 Calling chat-with-iasted...');
        // Call new chat-with-iasted endpoint
        const { data: chatData, error: chatError } = await supabase.functions.invoke('chat-with-iasted', {
          body: { 
            sessionId,
            audioBase64: base64Data,
            voiceId: selectedVoiceId,
            langHint: 'fr',
            settings: {
              silenceDuration,
              silenceThreshold,
              continuousMode
            }
          }
        });

        if (chatError) {
          console.error('❌ Chat error:', chatError);
          toast({
            title: "Erreur",
            description: "Erreur lors de la communication avec iAsted.",
            variant: "destructive"
          });
          setVoiceState('idle');
          return;
        }

        console.log('✅ Chat response received:', chatData);

        // Handle voice commands
        if (chatData.route?.category === 'voice_command') {
          handleVoiceCommand(chatData.route);
          setVoiceState('idle');
          return;
        }

        // Handle resume request
        if (chatData.route?.category === 'ask_resume') {
          await handleResumeRequest();
          return;
        }

        // Update messages
        const userMessage: VoiceInteractionMessage = {
          role: 'user',
          content: chatData.userText
        };
        
        const audioBase64 = chatData.audio_base64 || chatData.audioContent;

        const assistantMessage: VoiceInteractionMessage = {
          role: 'assistant',
          content: chatData.answer,
          audio_base64: audioBase64
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);

        // Log analytics
        await supabase.functions.invoke('log-analytics', {
          body: {
            sessionId,
            event_type: 'turn_complete',
            data: {
              ...chatData.latencies,
              totalDuration: Date.now() - startTime
            }
          }
        });

        // Play audio response
        if (audioBase64) {
          console.log('🔊 Playing audio response...');
          await playAudioResponse(audioBase64);
        } else {
          console.log('ℹ️ No audio to play, returning to idle');
          setVoiceState('idle');
        }
      };

      reader.onerror = () => {
        console.error('❌ Error reading audio file');
        setVoiceState('idle');
      };

    } catch (error) {
      console.error('❌ Error processing audio:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'audio.",
        variant: "destructive"
      });
      setVoiceState('idle');
    }
  };

  const handleVoiceCommand = (route: any) => {
    const command = route.command;
    
    switch (command) {
      case 'stop':
      case 'pause':
        cancelInteraction();
        break;
      case 'continue':
        if (continuousModePaused) {
          toggleContinuousPause();
        }
        break;
      case 'new_question':
        newQuestion();
        break;
      default:
        console.log('Unknown voice command:', command);
    }
  };

  const handleResumeRequest = async () => {
    if (!sessionId) return;

    try {
      setVoiceState('thinking');
      
      const { data: debriefData, error: debriefError } = await supabase.functions.invoke('debrief-session', {
        body: { sessionId }
      });

      if (debriefError) {
        throw new Error('Debrief failed');
      }

      console.log('Debrief:', debriefData.debrief);

      // Generate audio for debrief
      const { data: greetingData, error: greetingError } = await supabase.functions.invoke('generate-greeting-audio', {
        body: { text: debriefData.debrief }
      });

      if (!greetingError && greetingData.audioContent) {
        await playAudioResponse(greetingData.audioContent);
      } else {
        setVoiceState('idle');
      }
    } catch (error) {
      console.error('Error generating debrief:', error);
      setVoiceState('idle');
    }
  };

  const playAudioResponse = async (base64Audio: string) => {
    console.log('🔊 Starting audio playback...');
    try {
      setVoiceState('speaking');

      // Ensure audio context is ready before playing
      await ensureAudioContextResumed();

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      console.log('🎵 Audio data prepared, size:', bytes.length, 'bytes');
      if (playbackAudioContextRef.current) {
        const ctx = playbackAudioContextRef.current;

        try {
          console.log('🎼 Attempting WebAudio decode...');
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          console.log('✅ Audio decoded successfully, duration:', audioBuffer.duration, 's');
          
          await new Promise<void>((resolve) => {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => {
              console.log('✅ WebAudio playback complete');
              resolve();
            };
            source.start(0);
          });
          setVoiceState('idle');
          
          // Mode continu: relancer l'écoute
          if (continuousMode && !continuousModePaused) {
            console.log('♻️ Continuous mode active, restarting listening (WebAudio)...');
            setTimeout(() => startListening(), 300);
          }
          return;
        } catch (decodeErr) {
          console.warn('⚠️ decodeAudioData failed, falling back to HTMLAudio', decodeErr);
        }
      }

      // Fallback to HTMLAudioElement
      console.log('🔄 Using HTMLAudioElement fallback...');
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log('✅ HTMLAudio playback complete');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (err) => {
          console.error('❌ HTMLAudio error:', err);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Error playing audio'));
        };
        setCurrentAudio(audio);
        audio.play().catch(err => {
          console.error('❌ Audio play() failed:', err);
          reject(err);
        });
      });

      setCurrentAudio(null);
      setVoiceState('idle');

      if (continuousMode && !continuousModePaused) {
        console.log('♻️ Continuous mode active, restarting listening (fallback)...');
        setTimeout(() => startListening(), 300);
      }

    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setVoiceState('idle');
    }
  };

  const handleInteraction = async () => {
    if (voiceState === 'idle') {
      // Afficher le toast la première fois que le mode continu est utilisé
      if (continuousMode && !continuousModeToastShownRef.current) {
        unifiedToast.info(
          "Mode conversation continue activé",
          "iAsted écoutera automatiquement après chaque réponse",
          4000
        );
        continuousModeToastShownRef.current = true;
      }

      // Débloquer l'audio (navigateurs mobiles/desktop)
      await ensureAudioContextResumed();

      // Jouer la salutation puis démarrer l'écoute
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

  const toggleContinuousPause = () => {
    setContinuousModePaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        unifiedToast.info(
          "Mode continu en pause",
          "L'écoute automatique est suspendue",
          3000
        );
      } else {
        unifiedToast.success(
          "Mode continu repris",
          "L'écoute automatique va reprendre après la prochaine réponse",
          3000
        );
      }
      return newPaused;
    });
  };

  const newQuestion = useCallback(async () => {
    // Stop any ongoing audio immediately
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    
    // Stop recording if in progress
    const mr = mediaRecorderRef.current || mediaRecorder;
    if (mr && mr.state === 'recording') {
      try { mr.stop(); } catch {}
    }
    
    // Reset state and restart listening immediately
    setVoiceState('idle');
    
    // Small delay to allow cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restart listening without greeting
    startListening();
    
    unifiedToast.info("Nouvelle question", "Je vous écoute...");
  }, [currentAudio, mediaRecorder, startListening]);

  const cancelInteraction = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch {}
    }
    
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }
    const mr = mediaRecorderRef.current || mediaRecorder;
    if (mr && mr.state === 'recording') {
      try { mr.stop(); } catch {}
    }
    setLiveTranscript('');
    setVoiceState('idle');
    unifiedToast.info("Interaction annulée", "La conversation a été interrompue");
  };

  return {
    voiceState,
    handleInteraction,
    isListening: voiceState === 'listening',
    isThinking: voiceState === 'thinking',
    isSpeaking: voiceState === 'speaking',
    audioLevel,
    continuousMode,
    continuousModePaused,
    toggleContinuousPause,
    stopListening,
    cancelInteraction,
    newQuestion,
    sessionId,
    messages,
    selectedVoiceId,
    setSelectedVoiceId,
    silenceDetected,
    silenceTimeRemaining,
    silenceDuration,
    liveTranscript,
  };
};
