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
    const { zoneStats } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Tu es un expert en gestion des pêches maritimes au Gabon. 
Analyse les statistiques de capture d'une zone et fournis des recommandations stratégiques.
Réponds en français avec un ton professionnel et constructif.`;

    const userPrompt = `Voici les statistiques d'une zone de pêche analysée:

- Captures totales: ${zoneStats.totalCaptures.toFixed(2)} kg
- Nombre de sites: ${zoneStats.sitesCount}
- CPUE moyen: ${zoneStats.averageCpue.toFixed(2)} kg/unité d'effort
- Province(s): ${zoneStats.provinces.join(', ')}
- Espèces principales: ${zoneStats.topSpecies.map((s: any) => `${s.nom} (${s.total.toFixed(1)} kg)`).join(', ')}
- Sites les plus productifs: ${zoneStats.topSites.map((s: any) => `${s.nom} (${s.total.toFixed(1)} kg)`).join(', ')}

Fournis une analyse complète avec:
1. **État des lieux**: Évaluation de la santé de la zone
2. **Points forts**: Ce qui fonctionne bien
3. **Points d'attention**: Risques ou problèmes identifiés
4. **Recommandations**: Actions concrètes à mettre en œuvre (3-5 points)
5. **Suivi**: Indicateurs à monitorer

Format ta réponse de manière structurée et professionnelle.`;

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédit épuisé. Veuillez ajouter des crédits à votre espace de travail.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway request failed');
    }

    const data = await response.json();
    const recommendations = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-zone function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
