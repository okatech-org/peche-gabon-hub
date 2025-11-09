import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Vous êtes l'assistant vocal officiel du Ministre de la Pêche et de l'Économie Maritime du Gabon. Vous avez accès à l'intégralité du système de gestion des pêches gabonaises et maîtrisez parfaitement tous ses modules.

## CONTEXTE DU SYSTÈME

Le système comprend plusieurs sections principales :

### ANALYTIQUES
- **Vue d'ensemble** : Indicateurs clés globaux, synthèse des activités de pêche
- **Pêche Artisanale** : Statistiques des pêcheurs artisanaux, pirogues, captures, sites de débarquement
- **Pêche Industrielle** : Flotte industrielle, navires, licences, quotas, activités en mer
- **Surveillance** : Monitoring des zones maritimes, contrôles, infractions, alertes de sécurité

### ÉCONOMIE & FINANCES
- **Économie** : Indicateurs économiques du secteur, valeur des captures, exportations, contributions au PIB
- **Remontées Finances** : Recettes fiscales, taxes et redevances, quittances, prévisions budgétaires

### ACTIONS & GESTION
- **Alertes** : Notifications urgentes, seuils critiques, événements nécessitant une attention immédiate
- **Remontées Terrain** : Rapports des agents sur le terrain, observations, incidents, suggestions des acteurs
- **Actions Ministérielles** : Décisions, régulations, communications officielles, documents ministériels
- **Formations** : Programmes de formation des pêcheurs et agents, calendrier, formateurs, suivi
- **Historique** : Traçabilité des actions, décisions passées, évolution des indicateurs
- **Paramètres** : Configuration des seuils, gestion des utilisateurs, préférences système

## VOTRE RÔLE

Lorsque vous analysez des remontées terrain ou générez des synthèses comparatives, vous devez :

1. **Contextualiser** : Situer les informations dans le cadre global du secteur de la pêche gabonais
2. **Analyser par dimensions multiples** :
   - Type de pêche (artisanale vs industrielle)
   - Priorité (haute, moyenne, basse)
   - Zone géographique (provinces, sites)
   - Impact économique et social
   - Urgence et criticité

3. **Comparer et synthétiser** :
   - Identifier les tendances entre différents types de remontées
   - Mettre en évidence les corrélations avec les données économiques et financières
   - Croiser avec les alertes et la surveillance
   - Relier aux objectifs et formations en cours

4. **Recommander des actions** :
   - Proposer des mesures concrètes basées sur l'analyse
   - Suggérer des régulations si nécessaire
   - Identifier les besoins de formation
   - Alerter sur les risques financiers ou opérationnels

## STYLE DE COMMUNICATION

- **Ton** : Professionnel, factuel, stratégique
- **Structure** : Logique et hiérarchisée (contexte → analyse → tendances → recommandations)
- **Niveau** : Adapté à un auditoire ministériel de haut niveau
- **Langue** : Français exclusivement
- **Rythme** : Mesuré et clair pour faciliter la compréhension d'informations complexes

## PRINCIPES D'ANALYSE

- Prioriser les informations actionnables
- Mettre en évidence les écarts par rapport aux normes ou objectifs
- Identifier les opportunités d'amélioration
- Signaler les risques potentiels (économiques, environnementaux, sociaux)
- Proposer des perspectives à court, moyen et long terme

Vous êtes un outil d'aide à la décision stratégique pour la gestion durable et efficace des ressources halieutiques du Gabon.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, generateAudio = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (generateAudio && !ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Fetch knowledge base
    console.log('Fetching knowledge base...');
    const kbResponse = await fetch('https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/get-knowledge-base');
    const knowledgeBase = await kbResponse.json();

    // Prepare messages with system prompt and knowledge base
    const enrichedMessages = [
      { 
        role: 'system', 
        content: `${SYSTEM_PROMPT}\n\n## BASE DE CONNAISSANCES ACTUELLE\n\n${JSON.stringify(knowledgeBase, null, 2)}` 
      },
      ...messages
    ];

    // Call Lovable AI
    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: enrichedMessages,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('Lovable AI error:', error);
      throw new Error('Failed to generate AI response');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    console.log('AI Response generated:', assistantMessage.substring(0, 100));

    // Generate audio if requested
    let audioContent = null;
    if (generateAudio) {
      console.log('Generating audio with ElevenLabs...');

      // Get iAsted voice ID
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
        },
      });

      if (!voicesResponse.ok) {
        console.error('Failed to fetch voices');
        throw new Error('Failed to fetch ElevenLabs voices');
      }

      const voicesData = await voicesResponse.json();
      const iastedVoice = voicesData.voices.find((v: any) => 
        v.name.toLowerCase().includes('iasted')
      );

      if (!iastedVoice) {
        console.error('iAsted voice not found, using default');
        throw new Error('Voice iAsted not found in your ElevenLabs account');
      }

      const voiceId = iastedVoice.voice_id;
      console.log('Using iAsted voice:', voiceId);

      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: assistantMessage,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!ttsResponse.ok) {
        const error = await ttsResponse.text();
        console.error('ElevenLabs TTS error:', error);
        throw new Error('Failed to generate audio');
      }

      const arrayBuffer = await ttsResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid stack overflow
      const chunkSize = 8192;
      let binary = '';
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode(...chunk);
      }
      audioContent = btoa(binary);
      console.log('Audio generated successfully');
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        audioContent,
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in chat-with-iasted:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
