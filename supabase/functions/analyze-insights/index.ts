import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating AI insights...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Vous êtes un expert en analyse de données et en gestion des ressources halieutiques. Vous générez des insights actionnables basés sur des données statistiques. Répondez UNIQUEMENT avec du JSON valide, sans texte additionnel.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received:', content);

    // Parser le JSON de la réponse
    let insights;
    try {
      // Essayer de parser directement
      insights = JSON.parse(content);
    } catch (parseError) {
      // Si ça échoue, essayer d'extraire le JSON d'un bloc de code
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Créer un insight par défaut si le parsing échoue
        console.error('Failed to parse AI response:', parseError);
        insights = [
          {
            title: "Analyse générée",
            description: "L'analyse IA a été générée mais le format n'est pas optimal.",
            type: "info",
            recommendations: [
              "Vérifier la qualité des données d'entrée",
              "Réessayer l'analyse",
              "Consulter les statistiques détaillées"
            ]
          }
        ];
      }
    }

    // Valider que insights est un tableau
    if (!Array.isArray(insights)) {
      insights = [insights];
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
        insights: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
