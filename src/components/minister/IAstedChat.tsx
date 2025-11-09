import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Send, Volume2, VolumeX, Bot, User, History, Plus, X, Check, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioWaveform } from "./AudioWaveform";
import { IAstedHistory } from "./IAstedHistory";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

interface Conversation {
  id: string;
  titre: string;
  created_at: string;
  updated_at: string;
}

export const IAstedChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [isEnhancingAudio, setIsEnhancingAudio] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Cleanup audio preview URL on unmount or when audioPreview changes
  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview.url);
      }
    };
  }, [audioPreview]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations_iasted')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data);
    }
  };

  const createNewConversation = async (firstMessage: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Générer un titre basé sur le premier message (max 50 caractères)
    const titre = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...' 
      : firstMessage;

    const { data, error } = await supabase
      .from('conversations_iasted')
      .insert({
        user_id: user.id,
        titre,
        tags: [] // Les tags seront générés après
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    await loadConversations();
    return data.id;
  };

  const generateTags = async (conversationId: string) => {
    try {
      // Récupérer tous les messages de la conversation
      const { data: messages, error } = await supabase
        .from('messages_iasted')
        .select('content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !messages || messages.length === 0) return;

      // Concaténer les messages
      const conversationText = messages.map(m => m.content).join('\n\n');

      // Appeler l'edge function pour analyser les tags
      const { data: tagData } = await supabase.functions.invoke('analyze-conversation-tags', {
        body: { conversationText }
      });

      if (tagData?.success && tagData.tags && tagData.tags.length > 0) {
        // Mettre à jour les tags de la conversation
        await supabase
          .from('conversations_iasted')
          .update({ tags: tagData.tags })
          .eq('id', conversationId);

        // Recharger les conversations pour afficher les nouveaux tags
        await loadConversations();
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, audioUrl?: string) => {
    const { error } = await supabase
      .from('messages_iasted')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        audio_url: audioUrl
      });

    if (error) {
      console.error('Error saving message:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages_iasted')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const loadedMessages = data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        audioUrl: msg.audio_url
      }));
      setMessages(loadedMessages);
      setConversationId(conversationId);
      setShowHistory(false);
    }
  };

  const deleteConversation = async (conversationIdToDelete: string) => {
    const { error } = await supabase
      .from('conversations_iasted')
      .delete()
      .eq('id', conversationIdToDelete);

    if (!error) {
      await loadConversations();
      if (conversationId === conversationIdToDelete) {
        setMessages([]);
        setConversationId(null);
      }
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès."
      });
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  // Supprimer l'ancien useEffect d'initialisation de conversation
  // useEffect(() => {
  //   initializeConversation();
  // }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Créer une nouvelle conversation si nécessaire
      let currentConvId = conversationId;
      if (!currentConvId) {
        currentConvId = await createNewConversation(input);
        if (currentConvId) {
          setConversationId(currentConvId);
        }
      }

      // Sauvegarder le message utilisateur
      if (currentConvId) {
        await saveMessage(currentConvId, 'user', input);
      }

      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: { 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          generateAudio: true
        }
      });

      if (error) throw error;

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          audioUrl: data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : undefined
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Sauvegarder le message assistant
        if (currentConvId) {
          await saveMessage(currentConvId, 'assistant', data.message, assistantMessage.audioUrl);
          
          // Générer les tags automatiquement après quelques échanges (après le 2ème message assistant)
          if (messages.length >= 2) {
            generateTags(currentConvId);
          }
        }

        // Auto-play audio
        if (assistantMessage.audioUrl) {
          playAudio(assistantMessage.audioUrl);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec iAsted. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
      toast({
        title: "Erreur audio",
        description: "Impossible de lire l'audio",
        variant: "destructive"
      });
    };

    setCurrentAudio(audio);
    audio.play();
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setAudioStream(stream);
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      
      // Update recording duration every 100ms
      const durationInterval = setInterval(() => {
        setRecordingDuration((Date.now() - startTime) / 1000);
      }, 100);
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(durationInterval);
        const duration = (Date.now() - startTime) / 1000;
        
        // Validate minimum duration (0.5 seconds)
        if (duration < 0.5) {
          toast({
            title: "Enregistrement trop court",
            description: "Veuillez enregistrer au moins 0.5 seconde d'audio.",
            variant: "destructive"
          });
          stream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
          setRecordingStartTime(null);
          setRecordingDuration(0);
          return;
        }
        
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Show preview instead of immediate transcription
        setAudioPreview({ blob: audioBlob, url: audioUrl, duration });
        setShowAudioPreview(true);
        
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
        setRecordingStartTime(null);
        setRecordingDuration(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      
      toast({
        title: "Enregistrement démarré",
        description: "Parlez maintenant... (min 0.5s)",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
      
      if (duration < 0.5) {
        toast({
          title: "Enregistrement trop court",
          description: `Durée: ${duration.toFixed(1)}s. Minimum requis: 0.5s`,
          variant: "destructive"
        });
        
        // Cancel the recording
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
        }
        setRecordingStartTime(null);
        setRecordingDuration(0);
        return;
      }
      
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data.success && data.text) {
          setInput(data.text);
          toast({
            title: "Transcription réussie",
            description: "Votre message a été transcrit. Vous pouvez l'envoyer.",
          });
        } else {
          throw new Error(data.error || 'Transcription failed');
        }
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Erreur de transcription",
        description: "Impossible de transcrire l'audio. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleValidateAudio = async () => {
    if (!audioPreview) return;
    
    setShowAudioPreview(false);
    setIsEnhancingAudio(true);
    setPlaybackSpeed(1); // Reset speed
    
    try {
      toast({
        title: "Amélioration de l'audio...",
        description: "Application de filtres pour une meilleure qualité de transcription.",
      });
      
      // Enhance audio quality
      const enhancedBlob = await enhanceAudioQuality(audioPreview.blob);
      
      toast({
        title: "Audio amélioré",
        description: "Transcription en cours...",
      });
      
      await transcribeAudio(enhancedBlob);
    } catch (error) {
      console.error('Error in audio validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'améliorer l'audio. Tentative avec l'original...",
        variant: "destructive",
      });
      await transcribeAudio(audioPreview.blob);
    } finally {
      setIsEnhancingAudio(false);
      // Clean up
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    }
  };

  const handleDiscardAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    }
    setShowAudioPreview(false);
    setPlaybackSpeed(1);
    
    toast({
      title: "Enregistrement supprimé",
      description: "Vous pouvez faire un nouvel enregistrement.",
    });
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.playbackRate = speed;
    }
  };

  const synthesizeConversation = async () => {
    if (!conversationId) {
      toast({
        title: "Aucune conversation active",
        description: "Commencez une conversation avant de la synthétiser.",
        variant: "destructive"
      });
      return;
    }

    if (messages.length < 2) {
      toast({
        title: "Conversation trop courte",
        description: "Ajoutez plus de messages avant de synthétiser.",
        variant: "destructive"
      });
      return;
    }

    setIsSynthesizing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-conversation-to-knowledge', {
        body: { conversationId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Synthèse créée",
          description: `"${data.synthesis.titre}" ajouté à la base de connaissance`,
        });
      } else {
        throw new Error(data.message || 'Failed to synthesize');
      }
    } catch (error) {
      console.error('Error synthesizing conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de synthétiser la conversation.",
        variant: "destructive"
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const enhanceAudioQuality = async (audioBlob: Blob): Promise<Blob> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Create source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create filters for enhancement
      // High-pass filter to remove low-frequency noise
      const highPassFilter = offlineContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 80; // Remove frequencies below 80Hz
      
      // Low-pass filter to remove high-frequency noise
      const lowPassFilter = offlineContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 8000; // Remove frequencies above 8kHz
      
      // Compressor for dynamic range and volume normalization
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Gain node for final volume adjustment
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = 1.5; // Boost volume slightly
      
      // Connect the audio graph
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      
      // Start processing
      source.start(0);
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert back to blob
      const numberOfChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length * numberOfChannels * 2; // 16-bit audio
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      // Write WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, renderedBuffer.sampleRate, true);
      view.setUint32(28, renderedBuffer.sampleRate * 2 * numberOfChannels, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length, true);
      
      // Write audio data
      const channelData: Float32Array[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        channelData.push(renderedBuffer.getChannelData(i));
      }
      
      let offset = 44;
      for (let i = 0; i < renderedBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      await audioContext.close();
      return new Blob([buffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error enhancing audio:', error);
      // Return original blob if enhancement fails
      return audioBlob;
    }
  };

  return (
    <Card className="flex flex-col h-[700px]">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">iAsted</h3>
              <p className="text-sm text-muted-foreground">
                Assistant Vocal Ministériel Intelligent
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={synthesizeConversation}
              title="Synthétiser dans la base de connaissance"
              disabled={!conversationId || messages.length < 2 || isSynthesizing}
            >
              {isSynthesizing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={startNewConversation}
              title="Nouvelle conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" title="Historique">
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px] p-0">
                <IAstedHistory
                  onSelectConversation={loadConversation}
                  onDeleteConversation={deleteConversation}
                  onNewConversation={startNewConversation}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Bonjour Monsieur le Ministre</p>
              <p className="text-sm mt-2">
                Je suis iAsted, votre assistant vocal. Posez-moi vos questions sur les pêches gabonaises.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="p-2 bg-primary/10 rounded-full h-fit">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => playAudio(message.audioUrl!)}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Écouter la réponse
                  </Button>
                )}
              </div>
              {message.role === 'user' && (
                <div className="p-2 bg-primary/10 rounded-full h-fit">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="p-2 bg-primary/10 rounded-full h-fit">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/30">
        {isPlaying && (
          <div className="mb-3 flex items-center justify-between bg-primary/10 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-primary">iAsted est en train de parler...</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopAudio}>
              <VolumeX className="h-4 w-4" />
            </Button>
          </div>
        )}

        <AudioWaveform isRecording={isRecording} audioStream={audioStream} />

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Posez votre question à iAsted..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                disabled={isLoading}
                onClick={handleMicClick}
                title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un message vocal"}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
              {isRecording && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-mono text-red-500 whitespace-nowrap bg-background px-2 py-1 rounded border border-red-200">
                  {recordingDuration.toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          iAsted a accès à toute la base de données du système de pêche gabonais
        </p>
      </div>

      {/* Audio Preview Dialog */}
      <Dialog open={showAudioPreview} onOpenChange={setShowAudioPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de l'enregistrement</DialogTitle>
            <DialogDescription>
              Écoutez votre enregistrement avant de le transcrire. Vous pouvez le valider ou réenregistrer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {audioPreview && (
              <>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Durée : {audioPreview.duration.toFixed(1)}s
                    </span>
                  </div>
                </div>
                
                <div className="w-full space-y-3">
                  <audio 
                    ref={audioPreviewRef}
                    controls 
                    src={audioPreview.url} 
                    className="w-full"
                    preload="auto"
                  />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Vitesse de lecture
                    </label>
                    <div className="flex gap-2">
                      {[0.5, 1, 1.5, 2].map((speed) => (
                        <Button
                          key={speed}
                          variant={playbackSpeed === speed ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePlaybackSpeedChange(speed)}
                          className="flex-1"
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDiscardAudio}
              className="w-full sm:w-auto"
              disabled={isEnhancingAudio}
            >
              <X className="h-4 w-4 mr-2" />
              Réenregistrer
            </Button>
            <Button
              onClick={handleValidateAudio}
              className="w-full sm:w-auto"
              disabled={isLoading || isEnhancingAudio}
            >
              {isEnhancingAudio ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Amélioration...
                </>
              ) : isLoading ? (
                "Transcription..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider et transcrire
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
