# Documentation Complète : iAsted - Assistant Vocal Ministériel

## Vue d'Ensemble

iAsted est un assistant vocal intelligent conçu pour le Ministre de la Pêche et de l'Économie Maritime du Gabon. Il utilise l'API OpenAI pour la transcription vocale (Whisper), la génération de réponses (GPT) et la synthèse vocale (TTS).

## Architecture du Système

### 1. Composants Frontend

#### 1.1 Hook Principal : `useVoiceInteraction.tsx`
**Localisation**: `src/hooks/useVoiceInteraction.tsx`

**Responsabilités**:
- Gestion des états vocaux (idle, listening, thinking, speaking)
- Enregistrement audio via MediaRecorder
- Analyse du niveau sonore en temps réel
- Détection automatique du silence (VAD - Voice Activity Detection)
- Gestion du mode continu de conversation
- Système de salutation contextuelle (matin/soir)

**États Vocaux**:
```typescript
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
```

**Fonctionnalités Clés**:
- `startListening()`: Démarre l'enregistrement audio avec analyse en temps réel
- `stopListening()`: Arrête l'enregistrement et envoie l'audio pour traitement
- `processAudio()`: Transcrit l'audio et obtient une réponse AI
- `playGreeting()`: Joue une salutation contextuelle
- `playAudioResponse()`: Joue la réponse audio de l'AI
- `handleInteraction()`: Gère le cycle complet d'interaction
- `toggleContinuousPause()`: Pause/reprend le mode continu

**Paramètres Configurables**:
- `silenceDuration`: Durée de silence avant arrêt automatique (défaut: 2000ms)
- `silenceThreshold`: Seuil de détection du son (défaut: 10)
- `continuousMode`: Mode de conversation continue activable

#### 1.2 Composants Visuels

##### `IAstedButton.tsx`
**Localisation**: `src/components/minister/IAstedButton.tsx`

Bouton principal avec animations visuelles:
- Animation pulsante pendant l'écoute
- Indicateur de niveau audio
- Badge mode continu
- Gestion du double-clic pour activation

##### `IAstedListeningOverlay.tsx`
**Localisation**: `src/components/minister/IAstedListeningOverlay.tsx`

Overlay plein écran pendant l'écoute:
- Message "Je vous écoute Excellence"
- Indicateur circulaire de niveau audio animé
- Barres verticales réagissant au niveau sonore
- Barre horizontale de niveau audio

##### `IAstedVoiceControls.tsx`
**Localisation**: `src/components/minister/IAstedVoiceControls.tsx`

Contrôles vocaux fixes:
- Bouton Arrêter (MicOff)
- Bouton Annuler (XCircle)
- Bouton Redémarrer (RotateCcw)
- Indicateur textuel d'état

##### `IAstedVoiceButton.tsx`
**Localisation**: `src/components/minister/IAstedVoiceButton.tsx`

Composant orchestrateur qui:
- Intègre tous les composants visuels
- Gère les raccourcis clavier (Espace, Échap, R)
- Coordonne les interactions utilisateur

### 2. Backend (Edge Functions)

#### 2.1 `generate-greeting-audio`
**Localisation**: `supabase/functions/generate-greeting-audio/index.ts`

**Fonction**: Génère uniquement l'audio de salutation via OpenAI TTS
- Voix: `onyx` (masculine professionnelle)
- Format: MP3
- Retourne l'audio encodé en base64

**Flux**:
```
Input: { text: "Bonjour Excellence" }
↓
OpenAI TTS API
↓
Output: { audioContent: "base64_encoded_audio" }
```

#### 2.2 `transcribe-audio`
**Localisation**: `supabase/functions/transcribe-audio/index.ts`

**Fonction**: Transcrit l'audio utilisateur en texte
- Modèle: Whisper-1
- Traitement par chunks pour éviter les problèmes de mémoire
- Support audio WebM

**Flux**:
```
Input: { audio: "base64_encoded_audio" }
↓
Conversion chunks → Blob
↓
OpenAI Whisper API
↓
Output: { text: "transcription" }
```

#### 2.3 `chat-with-iasted`
**Localisation**: `supabase/functions/chat-with-iasted/index.ts`

**Fonction**: Génère les réponses intelligentes d'iAsted
- Accès à la base de connaissances du système
- Génération de réponse textuelle via GPT
- Génération de l'audio de réponse via TTS
- Mise en cache de la base de connaissances (5 min)

**Contexte Système**: 
Le prompt système définit iAsted comme l'assistant officiel du Ministre avec accès à:
- Vue d'ensemble et analytiques
- Pêche artisanale et industrielle
- Surveillance maritime
- Économie et finances
- Alertes et remontées terrain
- Actions ministérielles et formations

**Flux**:
```
Input: { messages: [], generateAudio: true }
↓
Récupération base de connaissances
↓
OpenAI GPT-4 (réponse texte)
↓
OpenAI TTS (audio de réponse)
↓
Output: { message: "text", audioContent: "base64" }
```

### 3. Cycle de Conversation Complet

```
1. ACTIVATION (Double-clic ou Espace)
   └─> playGreeting() → TTS "Bonjour Excellence"
   
2. ÉCOUTE (State: listening)
   └─> MediaRecorder active
   └─> Analyse niveau audio en temps réel
   └─> Détection silence automatique
   └─> Arrêt manuel possible (Échap)
   
3. TRAITEMENT (State: thinking)
   └─> Transcription audio (Whisper)
   └─> Délai 3 secondes (UX)
   └─> Génération réponse (GPT-4)
   └─> Génération audio (TTS)
   
4. RÉPONSE (State: speaking)
   └─> Lecture audio de réponse
   └─> Possibilité d'interruption
   
5. RETOUR À L'ÉCOUTE (si mode continu actif)
   └─> Redémarrage automatique après 500ms
```

### 4. Raccourcis Clavier

| Touche | Action | Condition |
|--------|--------|-----------|
| **Espace** | Démarrer/Arrêter | Toujours disponible |
| **Échap** | Annuler interaction | Si voiceState ≠ idle |
| **R** | Redémarrer nouvelle question | Si voiceState ≠ idle |

**Protection**: Les raccourcis sont désactivés dans les champs input/textarea

### 5. Configuration Supabase

#### Edge Functions (`supabase/config.toml`)
```toml
[functions.generate-greeting-audio]
verify_jwt = true

[functions.transcribe-audio]
verify_jwt = true

[functions.chat-with-iasted]
verify_jwt = true
```

#### Secrets Requis
- `OPENAI_API_KEY`: Clé API OpenAI pour Whisper, GPT et TTS
- `LOVABLE_API_KEY`: Clé auto-provisionnée pour Lovable AI (optionnel)

### 6. Fonctionnalités Avancées

#### 6.1 Système de Salutation Contextuelle
```typescript
// Logique basée sur l'heure et l'historique
- 00:00 → 12:01: "Bonjour Excellence" (première fois)
- 12:01 → 23:59: "Bonsoir Excellence" (première fois)
- Visites suivantes: "Que puis-je faire pour vous Excellence?"
```

#### 6.2 Détection Automatique du Silence (VAD)
- Analyse fréquence audio en temps réel
- Timer de silence configurable
- Normalisation niveau audio (0-100)
- Auto-stop après période de silence
- Fallback: arrêt automatique après 10 secondes

#### 6.3 Mode Continu
- Redémarrage automatique de l'écoute après réponse
- Pause/reprise via bouton dédié
- Toast informatif à la première utilisation
- Gestion de l'état de pause

### 7. Gestion des Erreurs

#### Frontend
- Erreur microphone: Toast "Impossible d'accéder au microphone"
- Erreur transcription: Toast "Impossible de traiter l'audio"
- Erreur réseau: Gestion silencieuse + log console

#### Backend
- Validation des entrées (audio, text requis)
- Gestion API OpenAI (statuts HTTP)
- Logging détaillé pour debugging
- Retours d'erreur structurés avec CORS

### 8. Performance et Optimisation

#### Audio
- Sample rate: 24kHz
- Format: WebM (enregistrement), MP3 (lecture)
- Chunk size: 4096 samples
- Encodage base64 par chunks pour économie mémoire

#### Cache
- Base de connaissances: 5 minutes TTL
- Évite requêtes répétées vers Supabase

#### UX
- Délai 3 secondes pendant "thinking" pour fluidité
- Animations CSS hardware-accelerated
- Feedback visuel temps réel

## Points d'Entrée

1. **Page Ministre**: `/minister-dashboard`
2. **Composant Principal**: `<IAstedVoiceButton />`
3. **Activation**: Double-clic sur bouton iAsted ou touche Espace

## Dépendances Principales

### NPM
- `@supabase/supabase-js`: Client Supabase
- `react`: Framework UI
- `lucide-react`: Icônes

### APIs Externes
- OpenAI Whisper (transcription)
- OpenAI GPT-4 (conversation)
- OpenAI TTS (synthèse vocale)

## Architecture de Sécurité

1. **Authentification**: JWT requis pour toutes les edge functions
2. **Secrets**: Gérés via Supabase Edge Function Secrets
3. **CORS**: Configuration stricte pour les origines autorisées
4. **Validation**: Vérification des entrées côté backend

## Évolutions Futures Suggérées

1. Historique des conversations avec transcription
2. Personnalisation de la voix
3. Mode débriefing avec résumé automatique
4. Analytics des interactions vocales
5. Support multilingue
6. Commandes vocales spécialisées

---

**Version**: 1.0  
**Dernière mise à jour**: Janvier 2025  
**Projet**: Système de Gestion des Pêches du Gabon
