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
    const { donneesHistoriques } = await req.json();
    
    if (!donneesHistoriques || donneesHistoriques.length === 0) {
      return new Response(
        JSON.stringify({ error: "Données historiques manquantes" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const systemPrompt = `Tu es un expert en analyse financière et prévisions économiques pour le secteur de la pêche au Gabon.
Ton rôle est d'analyser les données historiques des recettes du Trésor Public provenant des taxes de pêche et de générer des prévisions réalistes pour l'année suivante.

Prends en compte:
- Les tendances historiques et la croissance
- La saisonnalité (certains mois peuvent être plus productifs)
- Les variations inter-annuelles
- Les facteurs économiques potentiels

Génère des prévisions mensuelles réalistes avec des intervalles de confiance.`;

    const userPrompt = `Voici les données historiques des recettes du Trésor Public (en FCFA):

${JSON.stringify(donneesHistoriques, null, 2)}

Génère des prévisions mensuelles pour l'année prochaine (12 mois) en FCFA. Pour chaque mois, fournis:
- Le montant prévu
- Un intervalle de confiance (min/max)
- Un niveau de confiance (%)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generer_previsions_tresor",
              description: "Génère des prévisions mensuelles pour les recettes du Trésor Public",
              parameters: {
                type: "object",
                properties: {
                  previsions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        mois: { type: "string", description: "Nom du mois (janvier, février, etc.)" },
                        montant_prevu: { type: "number", description: "Montant prévu en FCFA" },
                        montant_min: { type: "number", description: "Borne inférieure de l'intervalle de confiance" },
                        montant_max: { type: "number", description: "Borne supérieure de l'intervalle de confiance" },
                        confiance: { type: "number", description: "Niveau de confiance en pourcentage (0-100)" }
                      },
                      required: ["mois", "montant_prevu", "montant_min", "montant_max", "confiance"]
                    }
                  },
                  total_annuel_prevu: { type: "number", description: "Total annuel prévu" },
                  croissance_estimee: { type: "number", description: "Croissance estimée par rapport à l'année précédente (%)" },
                  analyse: { type: "string", description: "Analyse brève des prévisions" }
                },
                required: ["previsions", "total_annuel_prevu", "croissance_estimee", "analyse"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generer_previsions_tresor" } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer plus tard." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits à votre espace de travail." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("Erreur AI Gateway:", response.status, errorText);
      throw new Error("Erreur lors de l'appel à l'AI Gateway");
    }

    const data = await response.json();
    console.log("Réponse AI:", JSON.stringify(data));

    if (!data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      throw new Error("Format de réponse invalide de l'IA");
    }

    const previsions = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    return new Response(
      JSON.stringify(previsions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erreur dans prevoir-recettes-tresor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
