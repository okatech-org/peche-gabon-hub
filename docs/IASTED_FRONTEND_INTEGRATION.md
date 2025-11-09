# iAsted - Guide d'intégration Frontend

## ✅ Intégration complète réalisée

L'assistant vocal iAsted est maintenant **complètement intégré** avec affichage des transcriptions en temps réel via ChatDock.

### Ce qui a été implémenté

✅ **useVoiceInteraction** - Hook avec sessionId, newQuestion(), appels aux nouvelles edge functions  
✅ **IAstedChat** - Intégré avec useVoiceInteraction, props onMessage et voiceSettings  
✅ **ChatDock** - Affichage temps réel des transcriptions vocales  
✅ **VoiceSettings** - Interface complète de personnalisation (voix, silence, mode continu)  
✅ **IAsted.tsx** - Page avec flux de données complet Chat → ChatDock  

### Architecture actuelle

```
IAsted.tsx
├── voiceSettings (state)
├── messages (state)
│
├── IAstedChat (props: onMessage, voiceSettings)
│   ├── useVoiceInteraction()
│   │   ├── sessionId
│   │   ├── messages
│   │   ├── newQuestion()
│   │   └── setSelectedVoiceId()
│   └── Callbacks → onMessage(role, text)
│
└── ChatDock (props: messages)
    └── Affichage temps réel
```

### Flux de données en production

1. **Configuration vocale**: VoiceSettings → IAsted.tsx → IAstedChat → useVoiceInteraction
2. **Interaction vocale**: useVoiceInteraction → chat-with-iasted (edge function)
3. **Messages**: useVoiceInteraction.messages → IAstedChat → onMessage → IAsted.tsx → ChatDock
4. **Affichage temps réel**: Chaque nouveau message apparaît immédiatement dans ChatDock

### Fonctionnalités disponibles

- ✅ Activation vocale (clic/long-press)
- ✅ Transcription temps réel dans ChatDock
- ✅ Réponses audio avec TTS ElevenLabs
- ✅ Personnalisation de voix avec aperçu
- ✅ Ajustement durée de silence (500-3000ms)
- ✅ Sensibilité micro configurable (10-100%)
- ✅ Mode continu avec pause/reprise
- ✅ Fonction "Nouvelle question" (relance immédiate)
- ✅ Persistance en base (sessions + messages)
- ✅ Analytics (latences, métriques UX)

---

## Architecture recommandée

```
┌─────────────────────────────────────────────┐
│         Page IAsted (3 onglets)             │
│  ┌──────────┬──────────┬──────────────┐    │
│  │   Chat   │ History  │   Settings   │    │
│  └──────────┴──────────┴──────────────┘    │
│                                             │
│  ┌───────────────────┬──────────────────┐  │
│  │  IAstedChat       │   ChatDock       │  │
│  │  (Interface       │   (Transcript    │  │
│  │   principale)     │    temps réel)   │  │
│  └───────────────────┴──────────────────┘  │
│                                             │
│  └──> useVoiceInteraction (hook state)     │
│  └──> IAstedVoiceButton (floating button)  │
└─────────────────────────────────────────────┘
```

---

## 1. Mise à jour de `useVoiceInteraction`

### Modifications nécessaires

```typescript
// src/hooks/useVoiceInteraction.tsx

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

export function useVoiceInteraction() {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Voice settings
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const [silenceDuration, setSilenceDuration] = useState(1000);
  const [threshold, setThreshold] = useState(0.5);
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousModePaused, setContinuousModePaused] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Create new session
      const { data: session, error } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          language: 'fr',
          title: `Session ${new Date().toLocaleString('fr-FR')}`,
          settings: { voiceId, silenceDuration, threshold, continuousMode }
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create session:', error);
        toast.error('Impossible de créer la session');
        return;
      }

      setSessionId(session.id);
      console.log('Session created:', session.id);
    }

    initSession();
  }, []);

  // Process audio and send to API
  const processAudio = useCallback(async (audioBase64: string) => {
    if (!sessionId) {
      toast.error('Session non initialisée');
      return;
    }

    setVoiceState('thinking');

    try {
      console.log('Sending audio to chat-with-iasted...');
      
      const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
        body: {
          sessionId,
          userId,
          audioBase64,
          langHint: 'fr',
          voiceId,
          generateAudio: true
        }
      });

      if (error) throw error;

      console.log('Response received:', data);

      // Handle different intent categories
      if (data.route?.category === 'voice_command') {
        handleVoiceCommand(data.route.command, data.route.args);
        return;
      }

      if (data.route?.category === 'ask_resume') {
        await handleDebriefRequest();
        return;
      }

      // Play audio response
      if (data.audioContent) {
        await playAudioResponse(data.audioContent);
      }

      // If continuous mode and not paused, restart listening
      if (continuousMode && !continuousModePaused) {
        setTimeout(() => {
          if (voiceState === 'idle') {
            startListening();
          }
        }, 500);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Erreur lors du traitement');
      setVoiceState('idle');
    }
  }, [sessionId, userId, voiceId, continuousMode, continuousModePaused]);

  // Handle voice commands locally
  const handleVoiceCommand = useCallback((command: string, args: any) => {
    console.log('Handling voice command:', command, args);

    switch (command) {
      case 'stop_listening':
        stopListening();
        toast.info('Écoute arrêtée');
        break;
      case 'pause':
        setContinuousModePaused(true);
        toast.info('Mode continu en pause');
        break;
      case 'continue':
        setContinuousModePaused(false);
        toast.info('Mode continu repris');
        break;
      case 'new_question':
        newQuestion();
        break;
      case 'show_history':
        // Navigate to history tab
        window.location.hash = '#history';
        toast.info('Affichage de l\'historique');
        break;
      case 'change_voice':
        if (args?.voice) {
          setVoiceId(args.voice);
          toast.success(`Voix changée: ${args.voice}`);
        }
        break;
    }

    setVoiceState('idle');
  }, []);

  // Handle debrief request
  const handleDebriefRequest = useCallback(async () => {
    if (!sessionId) return;

    try {
      toast.info('Génération du résumé...');
      
      const { data, error } = await supabase.functions.invoke('debrief-session', {
        body: { sessionId }
      });

      if (error) throw error;

      // Play debrief audio
      if (data.debrief) {
        // Generate audio for debrief
        const { data: audioData } = await supabase.functions.invoke('chat-with-iasted', {
          body: {
            sessionId,
            transcriptOverride: data.debrief,
            generateAudio: true
          }
        });

        if (audioData?.audioContent) {
          await playAudioResponse(audioData.audioContent);
        }

        toast.success('Résumé généré');
      }
    } catch (error) {
      console.error('Error generating debrief:', error);
      toast.error('Impossible de générer le résumé');
    }
  }, [sessionId]);

  // New question (restart listening immediately)
  const newQuestion = useCallback(async () => {
    console.log('Starting new question...');
    cancelInteraction();
    
    // Small delay to release audio resources
    await new Promise(resolve => setTimeout(resolve, 100));
    
    startListening();
    toast.info('Nouvelle question');
  }, []);

  // Update settings
  const updateVoiceSettings = useCallback(async (settings: {
    voiceId?: string;
    silenceDuration?: number;
    threshold?: number;
    continuousMode?: boolean;
  }) => {
    if (settings.voiceId !== undefined) setVoiceId(settings.voiceId);
    if (settings.silenceDuration !== undefined) setSilenceDuration(settings.silenceDuration);
    if (settings.threshold !== undefined) setThreshold(settings.threshold);
    if (settings.continuousMode !== undefined) setContinuousMode(settings.continuousMode);

    // Update in session settings
    if (sessionId) {
      await supabase
        .from('conversation_sessions')
        .update({ 
          settings: { 
            voiceId: settings.voiceId ?? voiceId,
            silenceDuration: settings.silenceDuration ?? silenceDuration,
            threshold: settings.threshold ?? threshold,
            continuousMode: settings.continuousMode ?? continuousMode
          } 
        })
        .eq('id', sessionId);
    }
  }, [sessionId, voiceId, silenceDuration, threshold, continuousMode]);

  return {
    voiceState,
    sessionId,
    
    // Actions
    handleInteraction,
    startListening,
    stopListening,
    cancelInteraction,
    newQuestion,
    
    // Settings
    updateVoiceSettings,
    voiceSettings: { voiceId, silenceDuration, threshold, continuousMode },
    
    // Continuous mode controls
    continuousModePaused,
    toggleContinuousPause: () => setContinuousModePaused(prev => !prev),
    
    // UI state
    isListening: voiceState === 'listening',
    isThinking: voiceState === 'thinking',
    isSpeaking: voiceState === 'speaking',
    audioLevel: 0.5 // Placeholder, calculate from actual audio
  };
}
```

---

## 2. Mise à jour de `IAstedChat`

### Props à ajouter

```typescript
interface IAstedChatProps {
  conversationIdToLoad?: string | null;
  onMessage?: (role: 'user' | 'assistant', text: string) => void;
  voiceSettings?: {
    voiceId?: string;
    silenceDuration?: number;
    threshold?: number;
    continuousMode?: boolean;
  };
}
```

### Utilisation du nouveau sessionId

```typescript
// Dans IAstedChat component
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

// Au démarrage ou lors de "Nouvelle conversation"
const createNewSession = async () => {
  const { data: session } = await supabase
    .from('conversation_sessions')
    .insert({
      user_id: user.id,
      language: 'fr',
      title: 'Nouvelle conversation',
      settings: props.voiceSettings || {}
    })
    .select()
    .single();

  setCurrentSessionId(session.id);
  setMessages([]); // Reset messages
};

// Lors de l'envoi d'un message
const sendMessage = async (text: string) => {
  if (!currentSessionId) {
    await createNewSession();
  }

  // Call with sessionId instead of messages array
  const { data } = await supabase.functions.invoke('chat-with-iasted', {
    body: {
      sessionId: currentSessionId,
      transcriptOverride: text,
      voiceId: props.voiceSettings?.voiceId,
      generateAudio: true
    }
  });

  // Notify parent
  props.onMessage?.('user', text);
  props.onMessage?.('assistant', data.answer);
};
```

---

## 3. Intégration de ChatDock

### Synchronisation temps réel

```typescript
// Dans la page IAsted
const [messages, setMessages] = useState<Message[]>([]);

// Callback depuis IAstedChat
const handleNewMessage = (role: 'user' | 'assistant', text: string) => {
  setMessages(prev => [...prev, { 
    role, 
    text, 
    timestamp: new Date() 
  }]);
};

// Render
<div className="grid lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    <IAstedChat 
      onMessage={handleNewMessage}
      voiceSettings={voiceSettings}
    />
  </div>
  <div>
    <ChatDock messages={messages} />
  </div>
</div>
```

---

## 4. Intégration de VoiceSettings

### Propagation des changements

```typescript
// Dans la page IAsted
const [voiceSettings, setVoiceSettings] = useState({
  voiceId: undefined,
  silenceDuration: 1000,
  threshold: 0.5,
  continuousMode: false
});

// Callbacks
const handleVoiceChange = (voiceId: string) => {
  setVoiceSettings(prev => ({ ...prev, voiceId }));
};

// Render
<VoiceSettings
  onVoiceChange={handleVoiceChange}
  onSilenceDurationChange={(d) => setVoiceSettings(p => ({ ...p, silenceDuration: d }))}
  onThresholdChange={(t) => setVoiceSettings(p => ({ ...p, threshold: t }))}
  onContinuousModeChange={(c) => setVoiceSettings(p => ({ ...p, continuousMode: c }))}
/>
```

---

## 5. Bouton "Nouvelle question"

### Ajout à IAstedVoiceControls

```typescript
// src/components/minister/IAstedVoiceControls.tsx

// Ajouter un bouton
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        onClick={onRestart}
        disabled={voiceState === 'listening'}
        className="gap-2"
      >
        <RotateCw className="h-4 w-4" />
        Nouvelle question
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Raccourci: R</p>
      <p className="text-xs text-muted-foreground">
        Relance l'écoute immédiatement
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 6. Commandes vocales supportées

### Implémentation dans le frontend

```typescript
function handleVoiceCommand(command: string, args: any) {
  switch (command) {
    case 'stop_listening':
      // Arrêter MediaRecorder
      mediaRecorder.current?.stop();
      setVoiceState('idle');
      break;

    case 'pause':
      // Pause mode continu
      setContinuousModePaused(true);
      break;

    case 'continue':
      // Reprendre mode continu
      setContinuousModePaused(false);
      if (continuousMode) startListening();
      break;

    case 'new_question':
      // Relancer écoute
      newQuestion();
      break;

    case 'show_history':
      // Aller à l'onglet historique
      setActiveTab('history');
      break;

    case 'change_voice':
      // Changer la voix
      if (args?.voice) {
        setVoiceId(args.voice);
      }
      break;

    default:
      console.warn('Unknown command:', command);
  }
}
```

### Phrases reconnues

| Phrase utilisateur | Commande | Action |
|-------------------|----------|--------|
| "arrête", "stop" | `stop_listening` | Arrête l'écoute |
| "pause" | `pause` | Pause mode continu |
| "continue", "reprends" | `continue` | Reprend mode continu |
| "nouvelle question" | `new_question` | Relance écoute |
| "montre historique" | `show_history` | Affiche onglet historique |
| "change voix à Sarah" | `change_voice` | Change voix (args.voice = "Sarah") |

---

## 7. Mode Continu

### Logique d'implémentation

```typescript
// Après qu'une réponse audio ait fini de jouer
audio.onended = () => {
  setVoiceState('idle');
  
  // Si mode continu actif et non en pause
  if (continuousMode && !continuousModePaused) {
    setTimeout(() => {
      // Log analytics
      supabase.functions.invoke('log-analytics', {
        body: {
          sessionId,
          userId,
          event_type: 'auto_restart_listening',
          data: { delay_ms: 500 }
        }
      });
      
      // Relancer écoute
      startListening();
    }, 500); // Petit délai pour fluidité
  }
};
```

### UI pour contrôler le mode continu

```typescript
// Badge sur le bouton iAsted
{continuousMode && (
  <div className="continuous-badge">
    {continuousModePaused ? (
      <Pause className="h-3 w-3" />
    ) : (
      <Play className="h-3 w-3" />
    )}
    <span>Continu</span>
  </div>
)}

// Bouton pause/play
{continuousMode && voiceState === 'idle' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={toggleContinuousPause}
  >
    {continuousModePaused ? (
      <Play className="h-4 w-4" />
    ) : (
      <Pause className="h-4 w-4" />
    )}
  </Button>
)}
```

---

## 8. Gestion du débriefing

### Bouton "Résumé de session"

```typescript
// Dans IAstedChat ou IAsted page
<Button
  variant="outline"
  onClick={async () => {
    if (!sessionId) return;
    
    try {
      toast.info('Génération du résumé en cours...');
      
      const { data } = await supabase.functions.invoke('debrief-session', {
        body: { sessionId }
      });

      if (data?.debrief) {
        // Afficher dans un dialog ou jouer en audio
        setDebriefText(data.debrief);
        setDebriefDialogOpen(true);
      }
    } catch (error) {
      toast.error('Impossible de générer le résumé');
    }
  }}
>
  <FileText className="h-4 w-4 mr-2" />
  Résumé de session
</Button>
```

---

## 9. Analytics Dashboard (Admin)

### Page d'analytics

```typescript
// src/pages/minister/IAstedAnalytics.tsx

export default function IAstedAnalytics() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function fetchMetrics() {
      // Latences moyennes
      const { data: latencies } = await supabase
        .from('analytics_voice_events')
        .select('data')
        .eq('event_type', 'turn_complete')
        .gte('at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Commandes vocales
      const { data: commands } = await supabase
        .from('analytics_voice_events')
        .select('data')
        .eq('event_type', 'voice_command');

      // Distribution intentions
      const { data: intents } = await supabase
        .from('analytics_voice_events')
        .select('data')
        .eq('event_type', 'turn_complete');

      setMetrics({ latencies, commands, intents });
    }

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <h1>Analytics iAsted</h1>

      {/* Latences */}
      <Card>
        <CardHeader>
          <CardTitle>Performances (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyData}>
              <Line dataKey="stt" stroke="#8884d8" name="STT" />
              <Line dataKey="llm" stroke="#82ca9d" name="LLM" />
              <Line dataKey="tts" stroke="#ffc658" name="TTS" />
              <Line dataKey="total" stroke="#ff7c7c" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commandes vocales */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes vocales utilisées</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commandsData}>
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution intentions */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des intentions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={intentsData} dataKey="value" nameKey="name" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 10. Checklist d'intégration

### Backend ✅

- [x] Tables créées (`conversation_sessions`, `conversation_messages`, `analytics_voice_events`)
- [x] RLS policies configurées
- [x] Edge functions déployées (`list-voices`, `debrief-session`, `log-analytics`)
- [x] `chat-with-iasted` mis à jour avec routeur + mémoire

### Frontend 🚧

- [x] `ChatDock` créé
- [x] `VoiceSettings` créé
- [x] Page IAsted mise à jour (3 onglets)
- [ ] `useVoiceInteraction` à mettre à jour (sessionId, newQuestion, settings)
- [ ] `IAstedChat` à mettre à jour (props onMessage, voiceSettings)
- [ ] Bouton "Nouvelle question" à ajouter
- [ ] Gestion commandes vocales côté client
- [ ] Mode continu à implémenter
- [ ] Analytics dashboard à créer (optionnel)

### Tests 🧪

- [ ] Test création session
- [ ] Test envoi message avec sessionId
- [ ] Test commande vocale ("arrête")
- [ ] Test mémoire multi-tours (3+ messages)
- [ ] Test débriefing
- [ ] Test personnalisation voix
- [ ] Test mode continu
- [ ] Test analytics logging

---

## 11. Exemple complet d'intégration

```typescript
// src/pages/minister/IAsted.tsx (version complète)

export default function IAsted() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceSettings, setVoiceSettings] = useState({...});

  const handleNewMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages(prev => [...prev, { role, text, timestamp: new Date() }]);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="chat">Conversation</TabsTrigger>
        <TabsTrigger value="history">Historique</TabsTrigger>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IAstedChat 
              onMessage={handleNewMessage}
              voiceSettings={voiceSettings}
            />
          </div>
          <div>
            <ChatDock messages={messages} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <ConversationHistory />
      </TabsContent>

      <TabsContent value="settings">
        <VoiceSettings
          onVoiceChange={(v) => setVoiceSettings(p => ({ ...p, voiceId: v }))}
          onSilenceDurationChange={(d) => setVoiceSettings(p => ({ ...p, silenceDuration: d }))}
          onThresholdChange={(t) => setVoiceSettings(p => ({ ...p, threshold: t }))}
          onContinuousModeChange={(c) => setVoiceSettings(p => ({ ...p, continuousMode: c }))}
        />
      </TabsContent>
    </Tabs>
  );
}
```

---

## Prochaines étapes

1. **Mettre à jour `useVoiceInteraction.tsx`** avec sessionId et nouvelles fonctions
2. **Ajouter props à `IAstedChat.tsx`** (onMessage, voiceSettings)
3. **Tester le flow complet** bout-en-bout
4. **Créer page analytics** (optionnel mais recommandé)

---

**Documentation complète**: Voir `docs/IASTED_API_USAGE.md` et `docs/IASTED_INTEGRATION_STATUS.md`
