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
    
    if (!donneesHistoriques || Object.keys(donneesHistoriques).length === 0) {
      return new Response(
        JSON.stringify({ error: "Données historiques manquantes" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const systemPrompt = `Tu es un expert en analyse financière et prévisions pour le secteur de la pêche au Gabon.
Ton rôle est d'analyser les données historiques des recettes par type de taxe et de générer des prévisions réalistes pour l'année suivante.

Types de taxes à analyser:
- Taxes de capture: Taxes sur les captures de poissons
- Licences de pêche: Permis et autorisations de pêche
- Taxes d'exportation: Taxes sur les produits exportés
- Autres taxes: Autres revenus liés à la pêche

Prends en compte:
- Les tendances spécifiques à chaque type de taxe
- La saisonnalité différente selon les types
- Les facteurs économiques influençant chaque source de revenu`;

    const userPrompt = `Voici les données historiques des recettes par type de taxe (en FCFA):

${JSON.stringify(donneesHistoriques, null, 2)}

Génère des prévisions mensuelles pour l'année prochaine (12 mois) pour CHAQUE type de taxe. Pour chaque mois et chaque type:
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
              name: "generer_previsions_par_type",
              description: "Génère des prévisions mensuelles par type de taxe",
              parameters: {
                type: "object",
                properties: {
                  previsions_par_type: {
                    type: "object",
                    properties: {
                      captures: {
                        type: "object",
                        properties: {
                          previsions_mensuelles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                mois: { type: "string" },
                                montant_prevu: { type: "number" },
                                montant_min: { type: "number" },
                                montant_max: { type: "number" },
                                confiance: { type: "number" }
                              },
                              required: ["mois", "montant_prevu", "montant_min", "montant_max", "confiance"]
                            }
                          },
                          total_annuel: { type: "number" },
                          croissance: { type: "number" }
                        },
                        required: ["previsions_mensuelles", "total_annuel", "croissance"]
                      },
                      licences: {
                        type: "object",
                        properties: {
                          previsions_mensuelles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                mois: { type: "string" },
                                montant_prevu: { type: "number" },
                                montant_min: { type: "number" },
                                montant_max: { type: "number" },
                                confiance: { type: "number" }
                              },
                              required: ["mois", "montant_prevu", "montant_min", "montant_max", "confiance"]
                            }
                          },
                          total_annuel: { type: "number" },
                          croissance: { type: "number" }
                        },
                        required: ["previsions_mensuelles", "total_annuel", "croissance"]
                      },
                      exportations: {
                        type: "object",
                        properties: {
                          previsions_mensuelles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                mois: { type: "string" },
                                montant_prevu: { type: "number" },
                                montant_min: { type: "number" },
                                montant_max: { type: "number" },
                                confiance: { type: "number" }
                              },
                              required: ["mois", "montant_prevu", "montant_min", "montant_max", "confiance"]
                            }
                          },
                          total_annuel: { type: "number" },
                          croissance: { type: "number" }
                        },
                        required: ["previsions_mensuelles", "total_annuel", "croissance"]
                      },
                      autres: {
                        type: "object",
                        properties: {
                          previsions_mensuelles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                mois: { type: "string" },
                                montant_prevu: { type: "number" },
                                montant_min: { type: "number" },
                                montant_max: { type: "number" },
                                confiance: { type: "number" }
                              },
                              required: ["mois", "montant_prevu", "montant_min", "montant_max", "confiance"]
                            }
                          },
                          total_annuel: { type: "number" },
                          croissance: { type: "number" }
                        },
                        required: ["previsions_mensuelles", "total_annuel", "croissance"]
                      }
                    },
                    required: ["captures", "licences", "exportations", "autres"]
                  },
                  total_global: { type: "number" },
                  analyse_globale: { type: "string" },
                  recommandations: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["previsions_par_type", "total_global", "analyse_globale", "recommandations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generer_previsions_par_type" } }
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
    console.error("Erreur dans prevoir-recettes-par-type:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
