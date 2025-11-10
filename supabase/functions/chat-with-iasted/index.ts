import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let knowledgeBaseCache: { data: any; timestamp: number } | null = null;

const SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent du Ministre de la Pêche du Gabon.

## STYLE DE CONVERSATION (CRITIQUE)
🎙️ Vous parlez à voix haute comme un assistant vocal naturel :
- Réponses COURTES (1-3 phrases max, 30-50 mots)
- Ton conversationnel, chaleureux mais professionnel
- Phrases simples et directes (pas de jargon inutile)
- PAS de formatage JSON, markdown ou listes à puces dans vos réponses
- Répondez comme si vous parliez à quelqu'un en personne

## EXEMPLES DE BONNES RÉPONSES
❌ MAUVAIS: "Il existe selon les données json un total de 5 types..."
✅ BON: "Excellence, on compte 5 types d'engins principaux : filets maillants, palangres, sennes, nasses et lignes. Les filets maillants dominent avec 65% des captures."

❌ MAUVAIS: "Selon les données de la base..."
✅ BON: "D'après nos derniers chiffres, la pêche artisanale représente 8 500 tonnes ce mois."


## VOTRE EXPERTISE
Vous avez accès COMPLET en temps réel à TOUTES les données de l'application :

### STATISTIQUES EN TEMPS RÉEL (Section "STATISTIQUES EN TEMPS RÉEL DE L'APPLICATION")
- Pêche artisanale : captures (30 derniers jours), poids total, pirogues actives
- Pêche industrielle : captures (30 derniers jours), poids total, navires actifs
- Coopératives : nombre actives, total membres
- Finances : taxes en attente avec montants, quittances (90 derniers jours)
- Surveillance : alertes non traitées (par sévérité), remontées terrain (7 derniers jours)
- Formations : planifiées, en cours, participants
- Licences : actives par type
- Référentiels : espèces, engins

### BASE DE CONNAISSANCES (Section "BASE DE CONNAISSANCES")
- Documentation, rapports, synthèses historiques
- Procédures et réglementations
- Contexte stratégique et décisions passées

## RÈGLES DE RÉPONSE
1. PRIORITÉ AUX STATS EN TEMPS RÉEL : Citez TOUJOURS les chiffres actuels de la section "STATISTIQUES EN TEMPS RÉEL"
2. Donnez la réponse directement, sans préambule
3. Combinez stats temps réel + contexte de la base de connaissances
4. Si données manquantes : "Je n'ai pas cette info actuellement, Excellence."
5. Une seule question de clarification si vraiment nécessaire
6. Commandes vocales (arrête, pause, etc.) → retournez UNIQUEMENT le JSON d'intention

## MÉMOIRE
Utilisez le contexte fourni pour personnaliser vos réponses.`;


const ROUTER_PROMPT = `Vous êtes un routeur d'intentions pour classifier les entrées utilisateur.

Catégories EXACTES :
- "voice_command": commandes agent (arrête, pause, continue, nouvelle question, historique, changer voix à <nom>)
- "ask_resume": demande de résumé/débrief de session
- "query": question métier/information générale
- "small_talk": salutation, politesse, remerciements

Répondez UNIQUEMENT en JSON valide, sans texte additionnel :
{
  "category": "<voice_command|ask_resume|query|small_talk>",
  "command": "<optionnel, nom canonique>",
  "args": {"target": "...", "voice": "...", "lang": "..."}
}`;

// Utilities
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// STT: Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBase64: string, langHint?: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const audioBytes = processBase64Chunks(audioBase64);
  const form = new FormData();
  const blob = new Blob([audioBytes as any], { type: 'audio/webm' });
  form.append('file', blob, 'audio.webm');
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');
  if (langHint) form.append('language', langHint);

  console.log('Transcribing audio with Whisper...');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form
  });

  if (!res.ok) throw new Error(`Whisper STT failed: ${res.status}`);
  const data = await res.json();
  console.log('Transcription:', data.text);
  return data.text as string;
}

// Router: Classify user intent
async function classifyIntent(userText: string): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  console.log('Classifying intent:', userText.substring(0, 50));
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: ROUTER_PROMPT },
        { role: 'user', content: `Texte utilisateur: """${userText}"""` }
      ],
      temperature: 0
    })
  });

  if (!res.ok) throw new Error(`Router failed: ${res.status}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  
  try {
    const intent = JSON.parse(content);
    console.log('Intent classified:', intent.category);
    return intent;
  } catch {
    console.log('Failed to parse intent, defaulting to query');
    return { category: 'query' };
  }
}

// Memory: Fetch memory summary from session
async function fetchMemorySummary(supabase: any, sessionId: string): Promise<string> {
  const { data } = await supabase
    .from('conversation_sessions')
    .select('memory_summary')
    .eq('id', sessionId)
    .maybeSingle();
  
  return data?.memory_summary ?? '';
}

// Memory: Fetch recent messages
async function fetchRecentMessages(supabase: any, sessionId: string, limit = 6): Promise<any[]> {
  const { data } = await supabase
    .from('conversation_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return (data ?? []).reverse();
}

// Memory: Summarize conversation history
async function summarizeMemory(supabase: any, sessionId: string): Promise<string> {
  if (!LOVABLE_API_KEY) return '';

  const recent = await fetchRecentMessages(supabase, sessionId, 8);
  
  if (recent.length === 0) return '';

  console.log('Summarizing memory...');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'Compresseur de mémoire: créez un résumé court et actionnable (max 180 mots) de cette conversation.' 
        },
        { role: 'user', content: JSON.stringify(recent) }
      ],
      temperature: 0.2
    })
  });

  if (!res.ok) return '';
  
  const json = await res.json();
  const summary = json.choices?.[0]?.message?.content ?? '';
  
  // Update session with new summary
  await supabase
    .from('conversation_sessions')
    .update({ 
      memory_summary: summary, 
      memory_updated_at: new Date().toISOString() 
    })
    .eq('id', sessionId);

  console.log('Memory summarized and saved');
  return summary;
}

// Fetch complete application stats in real-time
async function fetchApplicationStats(supabase: any): Promise<any> {
  console.log('Fetching complete application stats...');
  
  try {
    // Parallel fetch of all stats
    const [
      capturesPA,
      capturesPI,
      cooperatives,
      taxes,
      quittances,
      navires,
      pirogues,
      alertes,
      remontees,
      formations,
      licences,
      especies,
      engins
    ] = await Promise.all([
      // Captures artisanales (derniers 30 jours)
      supabase.from('captures_pa')
        .select('date_capture, poids_kg, espece_id, site_id')
        .gte('date_capture', new Date(Date.now() - 30*24*60*60*1000).toISOString())
        .limit(1000),
      
      // Captures industrielles (derniers 30 jours)
      supabase.from('captures_industrielles_detail')
        .select('poids_kg, espece_id, maree_id, marees_industrielles(date_depart, date_retour)')
        .limit(1000),
      
      // Coopératives actives
      supabase.from('cooperatives')
        .select('id, nom, statut, pecheurs_cooperatives(count)')
        .eq('statut', 'active'),
      
      // Taxes en cours
      supabase.from('taxes_captures')
        .select('montant_total, date_emission, statut_paiement')
        .eq('statut_paiement', 'en_attente')
        .limit(500),
      
      // Quittances récentes (3 derniers mois)
      supabase.from('quittances')
        .select('montant_total, date_emission, type_peche')
        .gte('date_emission', new Date(Date.now() - 90*24*60*60*1000).toISOString())
        .limit(1000),
      
      // Navires actifs
      supabase.from('navires')
        .select('id, nom, type, statut')
        .eq('statut', 'actif'),
      
      // Pirogues actives
      supabase.from('pirogues')
        .select('id, immatriculation, type_pirogue, statut')
        .eq('statut', 'active'),
      
      // Alertes non traitées
      supabase.from('alertes_rapports')
        .select('severite, type_variation, indicateur, statut')
        .eq('statut', 'nouvelle')
        .limit(100),
      
      // Remontées récentes (7 derniers jours)
      supabase.from('remontees_terrain')
        .select('type_remontee, urgence, statut, created_at')
        .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
        .limit(200),
      
      // Formations (à venir et en cours)
      supabase.from('formations')
        .select('titre, date_debut, date_fin, statut, nb_participants_max')
        .in('statut', ['planifiee', 'en_cours'])
        .limit(50),
      
      // Licences actives
      supabase.from('licences')
        .select('type_licence, date_debut, date_fin, statut')
        .eq('statut', 'active'),
      
      // Espèces
      supabase.from('especes')
        .select('id, nom, nom_scientifique, categorie'),
      
      // Engins
      supabase.from('engins')
        .select('id, nom, type')
    ]);

    // Calculate aggregated stats
    const stats = {
      // Pêche artisanale
      peche_artisanale: {
        captures_30j: capturesPA.data?.length || 0,
        poids_total_30j: capturesPA.data?.reduce((sum: number, c: any) => sum + (c.poids_kg || 0), 0) || 0,
        pirogues_actives: pirogues.data?.length || 0
      },
      
      // Pêche industrielle
      peche_industrielle: {
        captures_30j: capturesPI.data?.length || 0,
        poids_total_30j: capturesPI.data?.reduce((sum: number, c: any) => sum + (c.poids_kg || 0), 0) || 0,
        navires_actifs: navires.data?.length || 0
      },
      
      // Coopératives
      cooperatives: {
        nombre_actives: cooperatives.data?.length || 0,
        total_membres: cooperatives.data?.reduce((sum: number, c: any) => sum + (c.pecheurs_cooperatives?.[0]?.count || 0), 0) || 0
      },
      
      // Finances
      finances: {
        taxes_en_attente: taxes.data?.length || 0,
        montant_taxes_en_attente: taxes.data?.reduce((sum: number, t: any) => sum + (t.montant_total || 0), 0) || 0,
        quittances_90j: quittances.data?.length || 0,
        montant_quittances_90j: quittances.data?.reduce((sum: number, q: any) => sum + (q.montant_total || 0), 0) || 0
      },
      
      // Alertes et surveillance
      surveillance: {
        alertes_non_traitees: alertes.data?.length || 0,
        alertes_par_severite: {
          critique: alertes.data?.filter((a: any) => a.severite === 'critique').length || 0,
          haute: alertes.data?.filter((a: any) => a.severite === 'haute').length || 0,
          moyenne: alertes.data?.filter((a: any) => a.severite === 'moyenne').length || 0
        },
        remontees_7j: remontees.data?.length || 0,
        remontees_urgentes: remontees.data?.filter((r: any) => r.urgence === 'haute' || r.urgence === 'critique').length || 0
      },
      
      // Formations
      formations: {
        a_venir: formations.data?.filter((f: any) => f.statut === 'planifiee').length || 0,
        en_cours: formations.data?.filter((f: any) => f.statut === 'en_cours').length || 0,
        total_participants: formations.data?.reduce((sum: number, f: any) => sum + (f.nb_participants_max || 0), 0) || 0
      },
      
      // Licences
      licences: {
        actives: licences.data?.length || 0,
        par_type: licences.data?.reduce((acc: Record<string, number>, l: any) => {
          acc[l.type_licence] = (acc[l.type_licence] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      },
      
      // Référentiels
      referentiels: {
        nb_especes: especies.data?.length || 0,
        nb_engins: engins.data?.length || 0
      },
      
      // Timestamp
      timestamp: new Date().toISOString(),
      periode_donnees: 'Stats temps réel avec données des 30 derniers jours pour captures, 90 jours pour finances'
    };

    console.log('Application stats fetched successfully');
    return stats;
    
  } catch (error) {
    console.error('Error fetching application stats:', error);
    return { error: 'Impossible de récupérer les stats de l\'application', timestamp: new Date().toISOString() };
  }
}

// LLM: Generate response with context
async function generateResponse(params: {
  memorySummary?: string;
  history: any[];
  userText: string;
  knowledgeBase: any;
  applicationStats: any;
}): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const { memorySummary, history, userText, knowledgeBase, applicationStats } = params;

  const systemContent = `${SYSTEM_PROMPT}${
    memorySummary ? `\n\n## MÉMOIRE DE CONVERSATION\n${memorySummary}` : ''
  }\n\n## BASE DE CONNAISSANCES\n${JSON.stringify(knowledgeBase, null, 2)}\n\n## STATISTIQUES EN TEMPS RÉEL DE L'APPLICATION\n${JSON.stringify(applicationStats, null, 2)}`;

  const messages = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: userText }
  ];

  console.log('Generating AI response with full application context...');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('LLM error:', error);
    throw new Error('Failed to generate response');
  }

  const json = await res.json();
  let answer = json.choices?.[0]?.message?.content ?? '';
  
  // Post-process: remove JSON blocks, markdown, and code formatting
  answer = answer
    .replace(/```json[\s\S]*?```/g, '') // Remove JSON code blocks
    .replace(/```[\s\S]*?```/g, '')     // Remove any code blocks
    .replace(/^\s*\{[\s\S]*?\}\s*$/gm, '') // Remove standalone JSON objects
    .trim();
  
  console.log('Response generated:', answer.substring(0, 100));
  return answer;
}

// TTS: Generate audio with ElevenLabs
async function generateAudio(text: string, voiceId?: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');

  // If no voiceId provided, find iAsted voice
  let finalVoiceId = voiceId;
  
  if (!finalVoiceId) {
    console.log('Fetching iAsted voice...');
    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });

    if (!voicesResponse.ok) throw new Error('Failed to fetch voices');
    
    const voicesData = await voicesResponse.json();
    const iastedVoice = voicesData.voices.find((v: any) => 
      v.name.toLowerCase().includes('iasted')
    );

    if (!iastedVoice) {
      // Fallback to first available voice
      finalVoiceId = voicesData.voices[0]?.voice_id;
      if (!finalVoiceId) throw new Error('No voices available');
      console.log('iAsted voice not found, using fallback:', finalVoiceId);
    } else {
      finalVoiceId = iastedVoice.voice_id;
      console.log('Using iAsted voice:', finalVoiceId);
    }
  }

  console.log('Generating audio with ElevenLabs...');
  const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.8,
        style: 0.25,
        use_speaker_boost: true
      }
    })
  });

  if (!ttsResponse.ok) {
    const error = await ttsResponse.text();
    console.error('TTS error:', error);
    throw new Error('Failed to generate audio');
  }

  const arrayBuffer = await ttsResponse.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convert to base64 in chunks
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...chunk);
  }
  
  console.log('Audio generated successfully');
  return btoa(binary);
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const started = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { 
      sessionId, 
      userId,
      audioBase64, 
      transcriptOverride, 
      langHint, 
      voiceId, 
      generateAudio: shouldGenerateAudio = true,
      messages // For backwards compatibility
    } = await req.json();

    // Backwards compatibility: if messages provided, use old flow
    if (messages && Array.isArray(messages) && !sessionId) {
      console.log('Using legacy flow (no sessionId)');
      
      // Fetch knowledge base and application stats with cache
      let knowledgeBase;
      const now = Date.now();
      
      if (knowledgeBaseCache && (now - knowledgeBaseCache.timestamp) < CACHE_TTL_MS) {
        knowledgeBase = knowledgeBaseCache.data;
      } else {
        const kbResponse = await fetch('https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/get-knowledge-base');
        knowledgeBase = await kbResponse.json();
        knowledgeBaseCache = { data: knowledgeBase, timestamp: now };
      }

      // Fetch real-time application stats
      const applicationStats = await fetchApplicationStats(supabase);

      const enrichedMessages = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n## BASE DE CONNAISSANCES\n${JSON.stringify(knowledgeBase, null, 2)}\n\n## STATISTIQUES EN TEMPS RÉEL DE L'APPLICATION\n${JSON.stringify(applicationStats, null, 2)}` },
        ...messages
      ];

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

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices[0].message.content;

      let audioContent = null;
      if (shouldGenerateAudio && ELEVENLABS_API_KEY) {
        audioContent = await generateAudio(assistantMessage, voiceId);
      }

      return new Response(
        JSON.stringify({ message: assistantMessage, audioContent, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW FLOW: with sessionId
    if (!sessionId) {
      throw new Error('sessionId is required for new flow');
    }

    console.log(`Processing request for session ${sessionId}`);

    // Step 1: STT (if audio provided)
    const sttStart = Date.now();
    const userText = transcriptOverride?.trim() || 
      (audioBase64 ? await transcribeAudio(audioBase64, langHint) : '');
    const sttLatency = Date.now() - sttStart;

    if (!userText) {
      throw new Error('No user input provided');
    }

    // Step 2: Classify intent
    const routerStart = Date.now();
    const intent = await classifyIntent(userText);
    const routerLatency = Date.now() - routerStart;

    // Step 3: Save user message
    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userText,
      lang: langHint ?? null
    });

    // Step 4: Handle voice commands or special intents
    if (intent.category === 'voice_command' || intent.category === 'ask_resume') {
      await supabase.from('conversation_messages').insert({
        session_id: sessionId,
        role: 'router',
        content_json: intent
      });

      // Log analytics
      await supabase.from('analytics_voice_events').insert({
        session_id: sessionId,
        user_id: userId,
        event_type: intent.category === 'voice_command' ? 'voice_command' : 'ask_resume',
        data: { 
          command: intent.command, 
          args: intent.args,
          latencies: { stt: sttLatency, router: routerLatency, total: Date.now() - started }
        }
      });

      return new Response(
        JSON.stringify({
          ok: true,
          route: intent,
          userText,
          latencies: { stt: sttLatency, router: routerLatency, total: Date.now() - started }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Fetch knowledge base & application stats in parallel
    const now = Date.now();
    let knowledgeBase;
    
    if (knowledgeBaseCache && (now - knowledgeBaseCache.timestamp) < CACHE_TTL_MS) {
      knowledgeBase = knowledgeBaseCache.data;
    } else {
      const kbResponse = await fetch('https://lzqvrnuzgfuyxbpyqfxh.supabase.co/functions/v1/get-knowledge-base');
      knowledgeBase = await kbResponse.json();
      knowledgeBaseCache = { data: knowledgeBase, timestamp: now };
    }

    // Fetch real-time application stats
    const applicationStats = await fetchApplicationStats(supabase);

    // Step 6: Fetch memory & history
    const memory = await fetchMemorySummary(supabase, sessionId);
    const history = await fetchRecentMessages(supabase, sessionId, 4); // Reduced from 6 to 4 for speed

    // Optionally refresh memory if old (every 5+ messages)
    if (history.length >= 5 && (!memory || memory.length < 50)) {
      await summarizeMemory(supabase, sessionId);
    }

    // Step 7: Generate LLM response with complete application context
    const llmStart = Date.now();
    const answer = await generateResponse({
      memorySummary: memory,
      history,
      userText,
      knowledgeBase,
      applicationStats
    });
    const llmLatency = Date.now() - llmStart;

    // Step 8: Generate audio
    let audioContent = null;
    const ttsStart = Date.now();
    if (shouldGenerateAudio) {
      audioContent = await generateAudio(answer, voiceId);
    }
    const ttsLatency = Date.now() - ttsStart;

    // Step 9: Save assistant message
    await supabase.from('conversation_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: answer,
      tokens: answer.length, // Approximation
      latency_ms: llmLatency
    });

    // Step 10: Log analytics
    await supabase.from('analytics_voice_events').insert({
      session_id: sessionId,
      user_id: userId,
      event_type: 'turn_complete',
      data: {
        sttLatency,
        routerLatency,
        llmLatency,
        ttsLatency,
        totalLatency: Date.now() - started,
        intent: intent.category
      }
    });

    console.log('Request completed successfully');

    return new Response(
      JSON.stringify({
        ok: true,
        route: { category: intent.category },
        userText,
        answer,
        audioContent,
        latencies: {
          stt: sttLatency,
          router: routerLatency,
          llm: llmLatency,
          tts: ttsLatency,
          total: Date.now() - started
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-iasted:', error);
    
    // Log error analytics
    try {
      await supabase.from('analytics_voice_events').insert({
        session_id: null,
        user_id: null,
        event_type: 'error',
        data: { 
          error: error instanceof Error ? error.message : String(error),
          latency: Date.now() - started
        }
      });
    } catch (logError) {
      console.error('Failed to log error analytics:', logError);
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
