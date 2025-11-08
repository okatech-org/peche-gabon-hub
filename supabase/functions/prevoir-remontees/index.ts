import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donneesHistoriques, institutions } = await req.json();

    if (!donneesHistoriques || !institutions) {
      return new Response(
        JSON.stringify({ error: "Données historiques et institutions requises" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Préparer le prompt pour l'IA
    const systemPrompt = `Tu es un expert en analyse financière et prévisions. 
Tu dois analyser les données historiques de remontées institutionnelles et générer des prévisions pour l'année suivante.
Fournis des prévisions mensuelles avec intervalle de confiance (min/max) basées sur les tendances historiques, la saisonnalité et les variations observées.`;

    const userPrompt = `Voici les données historiques de remontées institutionnelles sur 5 ans:

${JSON.stringify(donneesHistoriques, null, 2)}

Et voici les institutions et leurs pourcentages de répartition:
${JSON.stringify(institutions, null, 2)}

Analyse ces données et génère des prévisions pour les 12 prochains mois de l'année suivante.
Pour chaque mois, fournis:
- Le montant total prévu
- Un intervalle de confiance (montant minimum et maximum)
- La confiance de la prévision (en %)
- Les prévisions par institution

Prends en compte:
1. Les tendances de croissance/décroissance observées
2. La saisonnalité (variations mensuelles récurrentes)
3. La volatilité historique pour définir l'intervalle de confiance
4. Les répartitions institutionnelles actuelles`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generer_previsions",
              description: "Générer les prévisions mensuelles de remontées institutionnelles",
              parameters: {
                type: "object",
                properties: {
                  annee_prevue: {
                    type: "number",
                    description: "L'année pour laquelle les prévisions sont faites",
                  },
                  previsions_mensuelles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        mois: {
                          type: "number",
                          description: "Numéro du mois (1-12)",
                        },
                        montant_prevu: {
                          type: "number",
                          description: "Montant total prévu pour ce mois",
                        },
                        montant_min: {
                          type: "number",
                          description: "Montant minimum (borne inférieure intervalle confiance)",
                        },
                        montant_max: {
                          type: "number",
                          description: "Montant maximum (borne supérieure intervalle confiance)",
                        },
                        confiance_pct: {
                          type: "number",
                          description: "Niveau de confiance en % (0-100)",
                        },
                        par_institution: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              institution: { type: "string" },
                              montant_prevu: { type: "number" },
                            },
                            required: ["institution", "montant_prevu"],
                          },
                        },
                      },
                      required: [
                        "mois",
                        "montant_prevu",
                        "montant_min",
                        "montant_max",
                        "confiance_pct",
                        "par_institution",
                      ],
                    },
                  },
                  analyse: {
                    type: "object",
                    properties: {
                      tendance_generale: {
                        type: "string",
                        description: "Tendance générale observée (hausse/baisse/stable)",
                      },
                      croissance_prevue_pct: {
                        type: "number",
                        description: "Taux de croissance annuel prévu en %",
                      },
                      facteurs_cles: {
                        type: "array",
                        items: { type: "string" },
                        description: "Principaux facteurs influençant les prévisions",
                      },
                      niveau_confiance_global: {
                        type: "string",
                        description: "Niveau de confiance global (élevé/moyen/faible)",
                      },
                    },
                    required: [
                      "tendance_generale",
                      "croissance_prevue_pct",
                      "facteurs_cles",
                      "niveau_confiance_global",
                    ],
                  },
                },
                required: ["annee_prevue", "previsions_mensuelles", "analyse"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generer_previsions" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de taux dépassée, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Paiement requis, ajoutez des crédits à votre workspace" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await aiResponse.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Aucune prévision générée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const previsions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(previsions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
