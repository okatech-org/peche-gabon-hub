import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { generateAudio = true, date } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Date pour le briefing (par défaut: aujourd'hui)
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`Generating briefing for ${dateStr}`);

    // ============= COLLECTE DES DONNÉES =============
    
    // Captures PA des dernières 24h
    const { data: capturesPA } = await supabase
      .from('captures_pa')
      .select('poids_kg, date_capture')
      .gte('date_capture', yesterdayStr)
      .lte('date_capture', dateStr);
    
    const totalCapturesPA = capturesPA?.reduce((sum, c) => sum + (Number(c.poids_kg) || 0), 0) || 0;
    
    // Marées industrielles récentes
    const { data: mareesPI } = await supabase
      .from('marees_industrielles')
      .select('id, date_retour')
      .gte('date_retour', yesterdayStr)
      .lte('date_retour', dateStr);
    
    // Quittances du jour
    const { data: quittances } = await supabase
      .from('quittances')
      .select('montant, statut')
      .eq('date_emission', dateStr);
    
    const recettesJour = quittances?.reduce((sum, q) => sum + (Number(q.montant) || 0), 0) || 0;
    const nbQuittancesPayees = quittances?.filter(q => q.statut === 'payee').length || 0;
    
    // Alertes critiques non résolues
    const { data: alertesCritiques } = await supabase
      .from('alertes_rapports')
      .select('indicateur, severite, valeur_actuelle, variation_pourcentage, created_at')
      .eq('severite', 'critique')
      .neq('statut', 'resolue')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Remontées terrain urgentes
    const { data: remonteesUrgentes } = await supabase
      .from('remontees_terrain')
      .select('type_remontee, titre, priorite, created_at')
      .eq('priorite', 'haute')
      .in('statut', ['nouvelle', 'en_traitement'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Actions correctives en cours
    const { data: actions } = await supabase
      .from('actions_correctives')
      .select('action_description, date_fin_prevue, statut')
      .in('statut', ['planifiee', 'en_cours'])
      .lte('date_fin_prevue', dateStr)
      .order('date_fin_prevue', { ascending: true })
      .limit(5);
    
    // Formations du jour
    const { data: formations } = await supabase
      .from('formations_planifiees')
      .select('type_formation, lieu, nb_participants_prevus, date_debut')
      .eq('date_debut', dateStr)
      .order('date_debut', { ascending: true });
    
    // Documents ministériels récents
    const { data: documents } = await supabase
      .from('documents_ministeriels')
      .select('type_document, titre, created_at')
      .gte('created_at', new Date(yesterday).toISOString())
      .order('created_at', { ascending: false })
      .limit(3);
    
    // Statistiques globales
    const { count: nbPiroguesActives } = await supabase
      .from('pirogues')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active');
    
    const { count: nbCooperatives } = await supabase
      .from('cooperatives')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active');

    // ============= COMPILATION DU CONTEXTE =============
    
    const briefingContext = {
      date: targetDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      statistiques_jour: {
        captures_pa_kg: totalCapturesPA,
        marees_pi_terminees: mareesPI?.length || 0,
        recettes_collectees: recettesJour,
        quittances_payees: nbQuittancesPayees,
        total_quittances: quittances?.length || 0
      },
      statistiques_globales: {
        pirogues_actives: nbPiroguesActives || 0,
        cooperatives_actives: nbCooperatives || 0
      },
      alertes_critiques: alertesCritiques?.map(a => ({
        indicateur: a.indicateur,
        valeur: a.valeur_actuelle,
        variation: a.variation_pourcentage
      })) || [],
      remontees_urgentes: remonteesUrgentes?.map(r => ({
        type: r.type_remontee,
        titre: r.titre,
        date: new Date(r.created_at).toLocaleDateString('fr-FR')
      })) || [],
      actions_en_retard: actions?.filter(a => a.statut === 'en_cours').length || 0,
      actions_a_echoir: actions?.map(a => ({
        description: a.action_description,
        echeance: a.date_fin_prevue
      })) || [],
      formations_aujourdhui: formations?.map(f => ({
        type: f.type_formation,
        lieu: f.lieu,
        participants: f.nb_participants_prevus
      })) || [],
      documents_recents: documents?.map(d => ({
        type: d.type_document,
        titre: d.titre
      })) || []
    };

    // ============= GÉNÉRATION DU BRIEFING TEXTUEL =============
    
    const systemPrompt = `Tu es iAsted, l'assistant vocal du Ministre de la Pêche du Gabon.

Génère un briefing matinal naturel et vocal, en style conversationnel professionnel.

STRUCTURE OBLIGATOIRE:
1. Salutation personnalisée avec la date
2. Aperçu rapide de la situation (1-2 phrases)
3. Indicateurs clés de la journée précédente
4. Points d'attention critiques (alertes, remontées urgentes)
5. Actions et échéances importantes
6. Événements du jour (formations, documents)
7. Conclusion positive avec recommandation d'action

STYLE:
- Ton conversationnel mais professionnel
- Phrases courtes et claires
- Chiffres concrets et contextualisés
- Focus sur l'actionnable
- Naturel pour être écouté (pas lu)
- Maximum 300 mots

IMPORTANT: 
- Ne mentionne que les éléments significatifs
- Si un indicateur est à 0, ne le mentionne pas
- Priorise les informations urgentes
- Termine toujours par une note constructive`;

    console.log('Generating briefing text with AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Génère le briefing matinal avec ces données:\n\n${JSON.stringify(briefingContext, null, 2)}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('AI generation error:', error);
      throw new Error('Failed to generate briefing text');
    }

    const aiData = await aiResponse.json();
    const briefingText = aiData.choices?.[0]?.message?.content || '';
    
    if (!briefingText) {
      throw new Error('No briefing text generated');
    }

    console.log('Briefing text generated:', briefingText.substring(0, 100) + '...');

    // ============= GÉNÉRATION DE L'AUDIO =============
    
    let audioContent = null;
    
    if (generateAudio && ELEVENLABS_API_KEY) {
      console.log('Generating audio with ElevenLabs...');
      
      // Trouver la voix iAsted
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY }
      });

      let voiceId = null;
      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        const iastedVoice = voicesData.voices.find((v: any) => 
          v.name.toLowerCase().includes('iasted')
        );
        voiceId = iastedVoice?.voice_id || voicesData.voices[0]?.voice_id;
      }

      if (voiceId) {
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: briefingText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.8,
              style: 0.3,
              use_speaker_boost: true
            }
          })
        });

        if (ttsResponse.ok) {
          const arrayBuffer = await ttsResponse.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Convert to base64 in chunks
          const chunkSize = 8192;
          let binary = '';
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode(...chunk);
          }
          
          audioContent = btoa(binary);
          console.log('Audio generated successfully');
        } else {
          console.error('TTS error:', await ttsResponse.text());
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Briefing generated in ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        briefing: {
          text: briefingText,
          audio: audioContent,
          context: briefingContext,
          generated_at: new Date().toISOString(),
          generation_time_ms: totalTime
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error generating briefing:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});