import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { remonteeId, customText, maxDuration } = await req.json();

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let aiPrompt: string;

    // Si customText est fourni, l'utiliser directement
    if (customText) {
      const duration = maxDuration || 15;
      const wordCount = Math.floor(duration * 2.7); // ~2.7 mots par seconde en français
      
      aiPrompt = `Génère une synthèse vocale professionnelle de ${duration} secondes maximum (environ ${wordCount} mots) pour ce texte:

${customText}

Instructions:
- Résume l'essentiel en 2-3 phrases courtes
- Ton professionnel et clair
- Maximum ${duration} secondes de lecture (~${wordCount} mots)
- Format pour être lu à voix haute`;
    } else {
      // Sinon, récupérer la remontée par ID
      if (!remonteeId) {
        throw new Error('remonteeId ou customText est requis');
      }

      const { data: remontee, error } = await supabase
        .from('remontees_terrain')
        .select('*')
        .eq('id', remonteeId)
        .single();

      if (error) throw error;

      aiPrompt = `Génère une synthèse vocale professionnelle de 15 secondes maximum pour cette remontée terrain du secteur de la pêche au Gabon:

Type: ${remontee.type_remontee}
Titre: ${remontee.titre}
Description: ${remontee.description}
Priorité: ${remontee.niveau_priorite}
Statut: ${remontee.statut}
${remontee.localisation ? `Localisation: ${remontee.localisation}` : ''}
${remontee.impact_estime ? `Impact estimé: ${remontee.impact_estime}` : ''}
${remontee.nb_personnes_concernees ? `Personnes concernées: ${remontee.nb_personnes_concernees}` : ''}

Instructions:
- Résume l'essentiel en 2-3 phrases courtes
- Ton professionnel et clair
- Mentionne le type, l'urgence et l'action recommandée
- Maximum 15 secondes de lecture (~40 mots)
- Format pour être lu à voix haute`;
    }

    // Générer synthèse IA avec Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un assistant IA spécialisé dans la création de synthèses vocales concises et professionnelles pour les rapports gouvernementaux.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error('Erreur lors de la génération de la synthèse IA');
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    console.log('Synthèse générée:', summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        ...(remonteeId && {
          remontee: {
            id: remonteeId,
          }
        })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
