import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = [
  'Budget',
  'Pêche Artisanale',
  'Pêche Industrielle',
  'Surveillance',
  'Formations',
  'Économie',
  'Finances',
  'Remontées Terrain',
  'Actions Ministérielles',
  'Alertes',
  'Réglementations',
  'Statistiques',
  'Infractions',
  'Licences',
  'Captures',
  'Flotte',
  'Coopératives',
  'Recettes',
  'Prévisions',
  'Analyses'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationText } = await req.json();

    if (!conversationText) {
      throw new Error('Conversation text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing conversation for tags...');

    const systemPrompt = `Tu es un assistant d'analyse de conversations pour le Ministère de la Pêche du Gabon.

Ton rôle est d'analyser le contenu d'une conversation et d'identifier les 3-5 tags les plus pertinents parmi cette liste:
${CATEGORIES.join(', ')}

Règles:
- Choisis UNIQUEMENT des tags de la liste fournie
- Sélectionne 3 à 5 tags maximum
- Priorise les tags les plus pertinents et centraux à la conversation
- Si plusieurs tags sont très liés, choisis le plus spécifique
- Retourne UNIQUEMENT un array JSON de tags, sans texte supplémentaire

Exemple de réponse:
["Pêche Artisanale", "Budget", "Formations"]`;

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
          { role: 'user', content: `Analyse cette conversation et identifie les tags pertinents:\n\n${conversationText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error('Failed to analyze conversation');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parser la réponse de l'IA pour extraire les tags
    let tags: string[] = [];
    try {
      // Essayer de parser directement comme JSON
      tags = JSON.parse(aiResponse);
    } catch {
      // Si ce n'est pas du JSON valide, extraire les mots entre guillemets ou crochets
      const matches = aiResponse.match(/"([^"]+)"/g);
      if (matches) {
        tags = matches.map((m: string) => m.replace(/"/g, ''));
      } else {
        // Fallback: chercher les catégories dans le texte
        tags = CATEGORIES.filter(cat => 
          aiResponse.toLowerCase().includes(cat.toLowerCase())
        ).slice(0, 5);
      }
    }

    // Valider que les tags sont dans la liste des catégories
    tags = tags.filter((tag: string) => 
      CATEGORIES.some(cat => cat.toLowerCase() === tag.toLowerCase())
    ).slice(0, 5);

    console.log('Generated tags:', tags);

    return new Response(
      JSON.stringify({ 
        success: true,
        tags 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        tags: [] 
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
