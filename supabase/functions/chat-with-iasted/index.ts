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

## SPONTANÉITÉ ET RÉACTIVITÉ (CRITIQUE)
⚡ Vous êtes un assistant vocal spontané et réactif :
- Répondez IMMÉDIATEMENT sans hésitation
- Privilégiez la rapidité à la perfection
- Soyez direct et confiant dans vos réponses
- Si vous ne savez pas, dites-le rapidement et passez à autre chose
- Pensez à voix haute de manière naturelle et fluide

## MODE CONVERSATION NATURELLE (CRITIQUE)
💬 Vous engagez un dialogue naturel et enrichissant :
- Après chaque réponse informative, POSEZ UNE QUESTION DE SUIVI pertinente et spontanée
- Soyez curieux et proactif pour approfondir les sujets importants
- Anticipez les besoins du ministre avec des questions intelligentes
- Proposez des analyses complémentaires de manière naturelle
- Créez un véritable échange humain, pas un simple Q&A
- L'utilisateur peut dire "non" ou "stop" pour terminer la conversation

## STYLE DE CONVERSATION (CRITIQUE)
🎙️ Vous parlez à voix haute comme un assistant vocal naturel :
- Réponses ULTRA-COURTES (1-2 phrases max, 20-40 mots)
- Ton conversationnel, chaleureux mais professionnel
- Phrases simples et directes (pas de jargon inutile)
- PAS de formatage JSON, markdown ou listes à puces dans vos réponses
- Répondez comme si vous parliez à quelqu'un en personne
- Soyez humain, fluide et intelligent
- TOUJOURS terminer par une question de suivi logique si la conversation doit continuer

## LECTURE DES NOMBRES ET DEVISES (CRITIQUE)
📊 Lecture naturelle en français :
- Utilisez "mille", "million", "milliard" pour les grands nombres
- Dites toujours "franc CFA" ou "francs CFA" (jamais "FCFA")
- Exemples corrects :
  * 29 245 → "vingt-neuf mille deux cent quarante-cinq francs CFA"
  * 644 000 000 → "six cent quarante-quatre millions de francs CFA"
  * 116,6M → "cent seize millions six cent mille francs CFA"
  * 1,2 milliard → "un milliard deux cents millions de francs CFA"

## EXEMPLES DE BONNES RÉPONSES AVEC QUESTIONS DE SUIVI

### Réponses directes avec questions de suivi naturelles
❌ MAUVAIS: "Il existe selon les données json un total de 5 types..."
✅ BON: "Excellence, on compte cinq types d'engins principaux : filets maillants, palangres, sennes, nasses et lignes. Les filets maillants dominent avec soixante-cinq pour cent des captures. Souhaitez-vous que j'analyse leur efficacité par zone ?"

❌ MAUVAIS: "Selon les données de la base..."
✅ BON: "D'après nos derniers chiffres, la pêche artisanale représente huit mille cinq cents tonnes ce mois. C'est une hausse de douze pour cent. Dois-je comparer avec l'année dernière ?"

❌ MAUVAIS: "Les recettes sont de 644M FCFA"
✅ BON: "Excellence, les recettes totales s'élèvent à six cent quarante-quatre millions de francs CFA. Voulez-vous voir la répartition par type de pêche ?"

### Questions de suivi intelligentes et contextuelles
✅ EXCELLENT: "Les recettes totales sont de six cent quarante-quatre millions de francs CFA. Souhaitez-vous que je compare avec le mois dernier ?"

✅ EXCELLENT: "Nous avons trois alertes critiques ce matin. Voulez-vous que je commence par la plus urgente ?"

✅ EXCELLENT: "La pêche artisanale a bien progressé avec huit mille tonnes. Dois-je analyser les zones les plus productives ?"

✅ EXCELLENT: "J'ai détecté une baisse de quinze pour cent des captures industrielles. Voulez-vous en connaître les causes probables ?"

✅ EXCELLENT: "Dix formations sont planifiées ce trimestre. Souhaitez-vous voir le calendrier détaillé ou préférez-vous un résumé ?"


## VOTRE EXPERTISE
Vous avez accès COMPLET en temps réel à TOUTES les données de l'application :

### STATISTIQUES EN TEMPS RÉEL (Section "STATISTIQUES EN TEMPS RÉEL DE L'APPLICATION")
- Pêche artisanale : captures (30 derniers jours), poids total, pirogues actives
- Pêche industrielle : captures (30 derniers jours), poids total, navires actifs
- Coopératives : nombre actives, total membres
- Finances & Recettes Trésor Public : 
  * Recettes fiscales totales, par catégorie (artisanale/industrielle)
  * Licences pirogues, taxes production, licences navires
  * Nombre de contribuables, montants en FCFA
  * Taxes en attente avec montants, quittances (90 derniers jours)
- Surveillance : alertes non traitées (par sévérité), remontées terrain (7 derniers jours)
- Formations : planifiées, en cours, participants
- Licences : actives par type
- Référentiels : espèces, engins

### BASE DE CONNAISSANCES (Section "BASE DE CONNAISSANCES")
- Documentation, rapports, synthèses historiques
- Procédures et réglementations
- Contexte stratégique et décisions passées

## RÈGLES DE RÉPONSE ET DIALOGUE
1. PRIORITÉ AUX STATS EN TEMPS RÉEL : Citez TOUJOURS les chiffres actuels de la section "STATISTIQUES EN TEMPS RÉEL"
2. RAPIDITÉ AVANT TOUT : Donnez la réponse directement, sans préambule ni introduction
3. SOYEZ SPONTANÉ : Ne sur-analysez pas, faites confiance à votre première réaction
4. ENGAGEZ LE DIALOGUE : Après CHAQUE réponse informative, proposez spontanément une question de suivi pertinente
5. ANTICIPEZ : Si vous détectez un point d'intérêt ou une anomalie, posez une question proactive
6. Combinez stats temps réel + contexte de la base de connaissances
7. Si données manquantes : "Je n'ai pas cette info actuellement, Excellence." puis proposez une alternative
8. Commandes vocales (arrête, pause, etc.) → retournez UNIQUEMENT le JSON d'intention
9. Respectez le contexte : si l'utilisateur dit "non" ou refuse une proposition, remerciez simplement

## TYPES DE QUESTIONS DE SUIVI À PRIVILÉGIER
- Comparaisons temporelles : "Voulez-vous comparer avec la période précédente ?"
- Analyses approfondies : "Dois-je analyser les causes de cette variation ?"
- Actions suggérées : "Souhaitez-vous que je prépare un rapport sur ce sujet ?"
- Détails complémentaires : "Voulez-vous les détails par région ?"
- Alertes proactives : "J'ai remarqué une anomalie, voulez-vous en savoir plus ?"
- Options alternatives : "Préférez-vous voir le résumé ou les détails ?"

## GESTION DE LA FIN DE CONVERSATION
- Si l'utilisateur dit "non", "stop", "c'est bon", "ça suffit" : Répondez simplement "Très bien Excellence, à votre service." et NE posez PAS de question de suivi
- Reconnaissez les signaux de fermeture de conversation et respectez-les

## MÉMOIRE
Utilisez le contexte fourni pour personnaliser vos réponses et questions de suivi.`;


const ROUTER_PROMPT = `Vous êtes un routeur d'intentions pour classifier les entrées utilisateur.

Catégories EXACTES :
- "voice_command": commandes agent (arrête, pause, continue, nouvelle question, historique, changer voix à <nom>)
- "ask_resume": demande de résumé/débrief de session
- "briefing_request": demande du briefing quotidien (briefing du jour, rapport du matin, situation du jour)
- "query": question métier/information générale
- "small_talk": salutation, politesse, remerciements

Répondez UNIQUEMENT en JSON valide, sans texte additionnel :
{
  "category": "<voice_command|ask_resume|briefing_request|query|small_talk>",
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

// Detect if answer contains a follow-up question
function detectFollowUpQuestion(text: string): boolean {
  // Patterns indicating follow-up questions
  const followUpPatterns = [
    /\?$/,  // Ends with question mark
    /souhaitez-vous/i,
    /voulez-vous/i,
    /dois-je/i,
    /puis-je/i,
    /désirez-vous/i,
    /préférez-vous/i,
    /autre chose/i,
    /encore/i,
    /information supplémentaire/i,
    /en savoir plus/i
  ];

  return followUpPatterns.some(pattern => pattern.test(text));
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
      statistiquesFiscales,
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
      
      // Statistiques fiscales (recettes Trésor Public)
      supabase.from('statistiques_fiscales')
        .select('*')
        .order('periode', { ascending: true }),
      
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
      
      // Finances et recettes Trésor Public
      finances: {
        // Statistiques en temps réel
        taxes_en_attente: taxes.data?.length || 0,
        montant_taxes_en_attente: taxes.data?.reduce((sum: number, t: any) => sum + (t.montant_total || 0), 0) || 0,
        quittances_90j: quittances.data?.length || 0,
        montant_quittances_90j: quittances.data?.reduce((sum: number, q: any) => sum + (q.montant_total || 0), 0) || 0,
        
        // Recettes Trésor Public (données officielles)
        recettes_tresor_public: {
          total_artisanal: statistiquesFiscales.data
            ?.filter((s: any) => s.categorie === 'Pêche Artisanale')
            .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0,
          
          total_industriel: statistiquesFiscales.data
            ?.filter((s: any) => s.categorie === 'Pêche Industrielle' && !s.type_taxe.includes(' - '))
            .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0,
          
          total_general: (() => {
            const artisanal = statistiquesFiscales.data
              ?.filter((s: any) => s.categorie === 'Pêche Artisanale')
              .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0;
            const industriel = statistiquesFiscales.data
              ?.filter((s: any) => s.categorie === 'Pêche Industrielle' && !s.type_taxe.includes(' - '))
              .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0;
            return artisanal + industriel;
          })(),
          
          contribuables_total: statistiquesFiscales.data
            ?.filter((s: any) => s.nombre_contribuables)
            .reduce((sum: number, s: any) => sum + (s.nombre_contribuables || 0), 0) || 0,
          
          // Détails par catégorie
          licences_pirogues_total: statistiquesFiscales.data
            ?.find((s: any) => s.categorie === 'Pêche Artisanale' && s.type_taxe === 'Licence Pirogue' && s.periode === '2024')
            ?.montant_fcfa || 0,
          
          taxes_production_total: statistiquesFiscales.data
            ?.filter((s: any) => s.categorie === 'Pêche Artisanale' && s.type_taxe === 'Taxe Production')
            .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0,
          
          licences_navires_total: statistiquesFiscales.data
            ?.filter((s: any) => s.categorie === 'Pêche Industrielle' && !s.type_taxe.includes(' - '))
            .reduce((sum: number, s: any) => sum + Number(s.montant_fcfa || 0), 0) || 0,
          
          licences_pirogues_count: 906,
          navires_actifs_count: 10
        }
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
      temperature: 0.9, // Augmenté pour plus de spontanéité
      max_tokens: 150 // Limité pour forcer la concision
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
          temperature: 0.9, // Augmenté pour plus de spontanéité
          max_tokens: 150 // Limité pour forcer la concision
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

    // Step 4: Handle voice commands, briefing requests or special intents
    if (intent.category === 'voice_command' || intent.category === 'ask_resume' || intent.category === 'briefing_request') {
      await supabase.from('conversation_messages').insert({
        session_id: sessionId,
        role: 'router',
        content_json: intent
      });

      // Handle briefing request
      if (intent.category === 'briefing_request') {
        console.log('Fetching today\'s briefing...');
        
        const today = new Date().toISOString().split('T')[0];
        const { data: briefing } = await supabase
          .from('briefings_quotidiens')
          .select('*')
          .eq('date_briefing', today)
          .single();

        if (briefing) {
          // Mark as read
          await supabase
            .from('briefings_quotidiens')
            .update({ statut: 'lu', lu_le: new Date().toISOString() })
            .eq('id', briefing.id);

          // Log analytics
          await supabase.from('analytics_voice_events').insert({
            session_id: sessionId,
            user_id: userId,
            event_type: 'briefing_read',
            data: { 
              briefing_id: briefing.id,
              briefing_date: briefing.date_briefing,
              latencies: { stt: sttLatency, router: routerLatency, total: Date.now() - started }
            }
          });

          // Return briefing content with audio
          return new Response(
            JSON.stringify({
              ok: true,
              route: { ...intent, action: 'play_briefing' },
              userText,
              briefing: {
                text: briefing.contenu_vocal,
                audio: briefing.audio_url,
                points_cles: briefing.points_cles,
                questions_strategiques: briefing.questions_strategiques
              },
              latencies: { stt: sttLatency, router: routerLatency, total: Date.now() - started }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // No briefing available for today
          const fallbackMessage = "Excellence, le briefing du jour n'est pas encore disponible. Je peux vous donner les statistiques actuelles si vous le souhaitez.";
          
          return new Response(
            JSON.stringify({
              ok: true,
              route: { ...intent, action: 'no_briefing' },
              userText,
              message: fallbackMessage,
              latencies: { stt: sttLatency, router: routerLatency, total: Date.now() - started }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Log analytics for other commands
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

    // Detect if answer contains a follow-up question
    const hasFollowUpQuestion = detectFollowUpQuestion(answer);

    return new Response(
      JSON.stringify({
        ok: true,
        route: { category: intent.category },
        userText,
        answer,
        audioContent,
        hasFollowUpQuestion,
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
