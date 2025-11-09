import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Fetching conversation messages...');

    // Récupérer les messages de la conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages_iasted')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch conversation messages');
    }

    if (!messages || messages.length === 0) {
      console.log('No messages found for conversation');
      return new Response(
        JSON.stringify({ success: false, message: 'No messages to synthesize' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire le texte de la conversation
    const conversationText = messages
      .map((msg) => `${msg.role === 'user' ? 'Utilisateur' : 'iAsted'}: ${msg.content}`)
      .join('\n\n');

    console.log('Analyzing conversation for knowledge synthesis...');

    // Prompt pour l'IA
    const systemPrompt = `Tu es un système d'analyse intelligent pour le Ministère de la Pêche du Gabon.

Ton rôle est d'analyser une conversation entre un utilisateur et l'assistant iAsted, puis de créer une entrée synthétique pour la base de connaissance.

Cette entrée doit:
1. Extraire les informations factuelles et actionables clés
2. Identifier les thèmes principaux (max 5)
3. Extraire les mots-clés pertinents (max 10)
4. Créer un titre concis et descriptif
5. Rédiger un contenu synthétique structuré (200-500 mots)

Concentre-toi sur:
- Les données chiffrées et statistiques
- Les décisions ou actions recommandées
- Les problématiques identifiées
- Les solutions proposées
- Les insights sur le secteur de la pêche

Ignore:
- Les salutations et politesses
- Les questions de clarification basiques
- Les répétitions

Retourne UNIQUEMENT un objet JSON avec cette structure exacte:
{
  "titre": "Titre descriptif de 10-15 mots max",
  "contenu_synthetise": "Contenu structuré avec sections si nécessaire",
  "themes": ["Thème 1", "Thème 2", ...],
  "mots_cles": ["mot1", "mot2", ...],
  "score_pertinence": 0.0-1.0
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyse cette conversation et crée une entrée de base de connaissance:\n\n${conversationText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error('Failed to synthesize conversation');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parser la réponse
    let synthesis;
    try {
      // Extraire le JSON de la réponse (au cas où il y aurait du texte avant/après)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesis = JSON.parse(jsonMatch[0]);
      } else {
        synthesis = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse synthesis data');
    }

    // Vérifier si une entrée similaire existe déjà
    const { data: existingEntries, error: searchError } = await supabase
      .from('knowledge_base_entries')
      .select('id, nb_references, conversations_sources')
      .contains('themes', synthesis.themes)
      .limit(5);

    if (searchError) {
      console.error('Error searching existing entries:', searchError);
    }

    let knowledgeEntry;

    // Si une entrée similaire existe, on la met à jour
    if (existingEntries && existingEntries.length > 0) {
      const mostSimilar = existingEntries[0];
      const updatedSources = [...new Set([...mostSimilar.conversations_sources, conversationId])];
      
      const { data: updated, error: updateError } = await supabase
        .from('knowledge_base_entries')
        .update({
          nb_references: mostSimilar.nb_references + 1,
          conversations_sources: updatedSources,
          score_pertinence: Math.min(1.0, mostSimilar.nb_references * 0.1 + 0.5),
        })
        .eq('id', mostSimilar.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating entry:', updateError);
      } else {
        knowledgeEntry = updated;
        console.log('Updated existing knowledge entry');
      }
    } else {
      // Créer une nouvelle entrée
      const { data: created, error: insertError } = await supabase
        .from('knowledge_base_entries')
        .insert({
          titre: synthesis.titre,
          contenu_synthetise: synthesis.contenu_synthetise,
          themes: synthesis.themes || [],
          mots_cles: synthesis.mots_cles || [],
          conversations_sources: [conversationId],
          nb_references: 1,
          score_pertinence: synthesis.score_pertinence || 0.7,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating entry:', insertError);
        throw new Error('Failed to create knowledge entry');
      }

      knowledgeEntry = created;
      console.log('Created new knowledge entry');
    }

    // Mettre à jour la conversation avec l'info qu'elle a été synthétisée
    await supabase
      .from('conversations_iasted')
      .update({ 
        tags: synthesis.themes,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ 
        success: true,
        knowledgeEntry,
        synthesis: {
          titre: synthesis.titre,
          themes: synthesis.themes,
          mots_cles: synthesis.mots_cles
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
    console.error('Error synthesizing conversation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
