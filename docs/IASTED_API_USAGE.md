# iAsted - Guide d'utilisation de l'API

## Vue d'ensemble

L'edge function `chat-with-iasted` supporte maintenant deux modes:

1. **Mode Legacy** (rétrocompatibilité) - avec `messages` array
2. **Mode Nouveau** (recommandé) - avec `sessionId` pour mémoire multi-tours

---

## Mode Nouveau (Recommandé)

### Paramètres de requête

```typescript
{
  sessionId: string;           // REQUIS - UUID de la session
  userId?: string;             // Optionnel - UUID de l'utilisateur (pour analytics)
  audioBase64?: string;        // Base64 audio WebM (si pas de transcriptOverride)
  transcriptOverride?: string; // Texte direct (si pas d'audio)
  langHint?: string;           // 'fr' | 'en' | etc.
  voiceId?: string;            // ID voix ElevenLabs (défaut: iAsted)
  generateAudio?: boolean;     // true par défaut
}
```

### Exemple d'utilisation (avec audio)

```typescript
const { data, error } = await supabase.functions.invoke('chat-with-iasted', {
  body: {
    sessionId: currentSessionId,
    userId: user.id,
    audioBase64: recordedAudio, // base64 WebM
    langHint: 'fr',
    voiceId: selectedVoiceId, // Optionnel
    generateAudio: true
  }
});

if (data.ok) {
  // data.route.category: 'query' | 'voice_command' | 'ask_resume' | 'small_talk'
  
  if (data.route.category === 'voice_command') {
    // Traiter la commande localement (pause, stop, nouvelle question, etc.)
    handleVoiceCommand(data.route.command, data.route.args);
  } else {
    // Afficher la réponse textuelle
    console.log('Réponse:', data.answer);
    
    // Jouer l'audio
    if (data.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      await audio.play();
    }
  }
  
  // Latences disponibles
  console.log('Latences:', data.latencies);
  // { stt: 1200, router: 300, llm: 2500, tts: 1800, total: 5800 }
}
```

### Exemple avec texte direct (sans audio)

```typescript
const { data } = await supabase.functions.invoke('chat-with-iasted', {
  body: {
    sessionId: currentSessionId,
    transcriptOverride: "Quelles sont les captures du mois dernier ?",
    langHint: 'fr',
    generateAudio: true
  }
});
```

---

## Classification des intentions (Router)

Le routeur d'intentions classe automatiquement chaque message en:

### 1. `voice_command` - Commandes vocales

Déclencheurs:
- "arrête", "stop", "pause"
- "continue", "reprends"
- "nouvelle question"
- "montre l'historique", "afficher historique"
- "change la voix à [nom]"

Réponse:
```json
{
  "category": "voice_command",
  "command": "stop_listening",
  "args": {}
}
```

**Traitement client:** Exécuter l'action localement (arrêter audio, relancer écoute, etc.)

### 2. `ask_resume` - Demande de résumé

Déclencheurs:
- "fais-moi un résumé"
- "débriefe-moi cette session"
- "synthèse de la conversation"

**Traitement client:** Appeler `debrief-session` edge function

### 3. `query` - Question métier

Déclencheurs:
- Questions sur les données
- Demandes d'analyse
- Questions générales sur le secteur

**Traitement client:** Afficher réponse + jouer audio

### 4. `small_talk` - Conversation sociale

Déclencheurs:
- "bonjour", "salut"
- "merci", "merci beaucoup"
- Politesses, humour léger

**Traitement client:** Afficher réponse courte + jouer audio

---

## Mémoire multi-tours

### Comment ça fonctionne

1. **Chaque session** a un `memory_summary` (résumé actionnable)
2. **Tous les 5+ messages**, le résumé est rafraîchi automatiquement
3. **Contexte injecté** dans chaque requête LLM:
   - Résumé de mémoire (180 mots max)
   - 6 derniers messages
   - Base de connaissances

### Avantages

- ✅ Conversations cohérentes sur plusieurs tours
- ✅ Référence aux échanges précédents
- ✅ Contexte persistant entre les sessions
- ✅ Pas de répétition d'informations déjà données

### Exemple de mémoire

```
Résumé: L'utilisateur s'intéresse aux captures de pêche artisanale 
dans la province de l'Estuaire pour le mois de janvier 2025. 
Il a demandé des comparaisons avec décembre 2024 et s'inquiète 
de la baisse observée. Actions suggérées: analyse des facteurs 
externes, renforcement de la surveillance, formation des pêcheurs.
```

---

## Analytics UX

Tous les événements sont automatiquement loggés dans `analytics_voice_events`:

### Types d'événements

```typescript
{
  event_type: 'turn_complete',
  data: {
    sttLatency: 1200,      // Transcription
    routerLatency: 300,    // Classification
    llmLatency: 2500,      // Génération réponse
    ttsLatency: 1800,      // Audio
    totalLatency: 5800,    // Total
    intent: 'query'        // Catégorie détectée
  }
}

{
  event_type: 'voice_command',
  data: {
    command: 'stop_listening',
    args: {}
  }
}

{
  event_type: 'error',
  data: {
    error: 'OPENAI_API_KEY not configured',
    latency: 150
  }
}
```

### Analyse des métriques

```sql
-- Latence moyenne par type d'événement
SELECT 
  event_type,
  AVG((data->>'totalLatency')::int) as avg_latency_ms,
  COUNT(*) as count
FROM analytics_voice_events
WHERE event_type = 'turn_complete'
  AND at > NOW() - INTERVAL '7 days'
GROUP BY event_type;

-- Commandes vocales les plus utilisées
SELECT 
  data->>'command' as command,
  COUNT(*) as usage_count
FROM analytics_voice_events
WHERE event_type = 'voice_command'
GROUP BY data->>'command'
ORDER BY usage_count DESC;

-- Distribution des intentions
SELECT 
  data->>'intent' as intent,
  COUNT(*) as count,
  AVG((data->>'llmLatency')::int) as avg_llm_latency
FROM analytics_voice_events
WHERE event_type = 'turn_complete'
  AND at > NOW() - INTERVAL '30 days'
GROUP BY data->>'intent';
```

---

## Gestion des sessions

### Créer une nouvelle session

```typescript
const { data: session, error } = await supabase
  .from('conversation_sessions')
  .insert({
    user_id: user.id,
    language: 'fr',
    title: 'Session iAsted',
    settings: {
      voiceId: selectedVoiceId,
      silenceDuration: 1000,
      threshold: 0.5
    }
  })
  .select()
  .single();

const sessionId = session.id;
```

### Terminer une session

```typescript
await supabase
  .from('conversation_sessions')
  .update({ ended_at: new Date().toISOString() })
  .eq('id', sessionId);
```

### Récupérer l'historique d'une session

```typescript
const { data: messages } = await supabase
  .from('conversation_messages')
  .select('*')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true });
```

---

## Personnalisation de la voix

### Liste des voix disponibles

```typescript
const { data } = await supabase.functions.invoke('list-voices');

// data.voices = [
//   { id: 'abc123', name: 'Sarah', labels: { accent: 'american', ... } },
//   { id: 'def456', name: 'Pierre', labels: { accent: 'french', ... } },
//   ...
// ]
```

### Utiliser une voix spécifique

```typescript
// Passer le voiceId dans la requête
const { data } = await supabase.functions.invoke('chat-with-iasted', {
  body: {
    sessionId,
    transcriptOverride: "Bonjour iAsted",
    voiceId: 'abc123' // ID de la voix choisie
  }
});
```

---

## Débriefing de session

### Générer un résumé exécutif

```typescript
const { data } = await supabase.functions.invoke('debrief-session', {
  body: { sessionId }
});

console.log(data.debrief);
// Format:
// - 3-6 puces avec faits clés
// - Paragraphe "Risques/Points de vigilance"
// - Liste "Prochaines étapes" (2-4 items)
```

Le résumé est également sauvegardé dans `memory_summary` de la session.

---

## Gestion d'erreurs

### Erreurs courantes

```typescript
// 1. API Key manquant
{
  ok: false,
  error: "OPENAI_API_KEY not configured"
}

// 2. Session inexistante
{
  ok: false,
  error: "sessionId is required for new flow"
}

// 3. Pas d'input
{
  ok: false,
  error: "No user input provided"
}
```

### Logging automatique

Toutes les erreurs sont loggées dans `analytics_voice_events` avec `event_type: 'error'`.

---

## Migration depuis l'ancien système

### Ancien appel (avec messages)

```typescript
// ❌ Ancien
const { data } = await supabase.functions.invoke('chat-with-iasted', {
  body: {
    messages: [
      { role: 'user', content: 'Question...' }
    ],
    generateAudio: true
  }
});
```

### Nouveau appel (avec sessionId)

```typescript
// ✅ Nouveau
const { data } = await supabase.functions.invoke('chat-with-iasted', {
  body: {
    sessionId: currentSession.id,
    transcriptOverride: 'Question...',
    generateAudio: true
  }
});
```

**Note:** L'ancien mode fonctionne toujours pour rétrocompatibilité mais ne bénéficie pas de la mémoire multi-tours ni des analytics.

---

## Tests recommandés

### 1. Test de base (query simple)

```bash
curl -X POST https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/chat-with-iasted \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "transcriptOverride": "Quelles sont les captures du mois dernier ?",
    "generateAudio": false
  }'
```

### 2. Test voice command

```bash
curl -X POST https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/chat-with-iasted \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "transcriptOverride": "arrête l'\''écoute",
    "generateAudio": false
  }'

# Réponse attendue: { ok: true, route: { category: "voice_command", command: "stop_listening" } }
```

### 3. Test avec mémoire

```bash
# Message 1
curl ... -d '{"sessionId":"...", "transcriptOverride":"Parle-moi de la pêche artisanale"}'

# Message 2 (doit référencer le contexte)
curl ... -d '{"sessionId":"...", "transcriptOverride":"Quelles sont les tendances ?"}'
```

### 4. Test débriefing

```bash
curl -X POST https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/debrief-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "550e8400-e29b-41d4-a716-446655440000"}'
```

---

## Configuration requise

### Secrets Supabase

| Secret | Statut | Description |
|--------|--------|-------------|
| `OPENAI_API_KEY` | ✅ Configuré | Pour Whisper STT |
| `ELEVENLABS_API_KEY` | ✅ Configuré | Pour TTS |
| `LOVABLE_API_KEY` | ✅ Auto | Pour LLM (Gemini) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto | Pour accès DB |

### Tables requises

- ✅ `conversation_sessions`
- ✅ `conversation_messages`
- ✅ `analytics_voice_events`

---

## Performances et optimisation

### Latences typiques

| Étape | Latence moyenne | Optimisations |
|-------|-----------------|---------------|
| **STT** (Whisper) | 1-2s | Audio court, compression WebM |
| **Router** | 200-400ms | Temperature=0, cache |
| **LLM** (Gemini) | 2-4s | Réponses concises (2-6 phrases) |
| **TTS** (ElevenLabs) | 1-3s | Voix optimisée, multilingual_v2 |
| **Total** | **4-9s** | Parallélisation possible |

### Cache knowledge base

- 5 minutes de cache
- Réduit latence de ~500ms par requête
- Invalidation automatique

### Optimisations futures

1. **STT streaming** - Transcription en temps réel (non implémenté)
2. **TTS streaming** - Audio par chunks (non implémenté)
3. **Pré-fetching** - Charger voix/knowledge base au démarrage

---

## Limites et contraintes

### Taille audio

- **Maximum recommandé**: 30 secondes (< 1 MB base64)
- **Au-delà**: Risque timeout ou OOM
- **Solution**: Découper en chunks ou utiliser STT streaming

### Mémoire de conversation

- **Résumé**: Max 180 mots
- **Historique**: 6 derniers messages
- **Refresh**: Tous les 5+ messages
- **Limite**: ~10 tours avant compression nécessaire

### Rate limits

#### ElevenLabs
- Gratuit: 10,000 caractères/mois
- Plan payant: 30,000+ caractères/mois
- Streaming: Réduit la latence perçue

#### OpenAI Whisper
- Fichiers: 25 MB max
- Format: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
- Langues: 99 langues supportées

#### Lovable AI (Gemini)
- Rate limits workspace
- 402 Payment Required si crédits épuisés
- 429 Too Many Requests si dépassement

---

## Sécurité et confidentialité

### Protection des données

- ✅ Audio **non persisté** (transcription uniquement)
- ✅ RLS activé sur toutes les tables
- ✅ JWT requis pour toutes les fonctions
- ✅ Service role key côté backend uniquement

### Recommandations RGPD

1. **Conservation limitée** - Ajouter un TTL sur les conversations
2. **Opt-out** - Permettre de désactiver l'enregistrement
3. **Anonymisation** - Option de sessions anonymes
4. **Suppression** - Fonction de suppression de session

```typescript
// Exemple: Supprimer une session et tous ses messages (CASCADE)
await supabase
  .from('conversation_sessions')
  .delete()
  .eq('id', sessionId);
```

---

## Troubleshooting

### "OPENAI_API_KEY not configured"

**Cause:** Secret manquant  
**Solution:** Ajouter via Supabase dashboard → Project Settings → Edge Functions → Manage Secrets

### "Voice iAsted not found"

**Cause:** Aucune voix nommée "iAsted" dans ElevenLabs  
**Solution:** 
1. Créer une voix custom nommée "iAsted" dans ElevenLabs
2. Ou passer un `voiceId` explicite dans la requête

### "No messages found for this session"

**Cause:** Session vide  
**Solution:** Envoyer au moins 1 message avant d'appeler debrief-session

### Latences élevées (>10s)

**Causes possibles:**
- Audio trop long (>30s)
- Cold start de l'edge function
- Réseau lent

**Solutions:**
- Limiter durée audio
- Warm-up request au démarrage de l'app
- Afficher spinner + progression

---

## Roadmap

### Phase actuelle ✅

- [x] Mémoire multi-tours
- [x] Routeur d'intentions
- [x] Persistance DB
- [x] Analytics UX
- [x] Personnalisation voix

### Phase suivante 🚧

- [ ] STT streaming (temps réel)
- [ ] TTS streaming (chunks audio)
- [ ] Mode hors-ligne (cache local)
- [ ] Support multi-utilisateurs (conversations partagées)
- [ ] Webhooks pour notifications

### Long terme 🔮

- [ ] Fine-tuning du modèle LLM
- [ ] Voix clonée pour iAsted
- [ ] Support multimodal (images/cartes dans réponses)
- [ ] Intégration deepgram pour STT (plus rapide)

---

**Dernière mise à jour**: 2025-11-09  
**Version**: 2.0 (mémoire multi-tours)
