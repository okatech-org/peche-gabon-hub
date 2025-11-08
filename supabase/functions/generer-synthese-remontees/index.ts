import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RemonteeData {
  id: string;
  numero_reference: string;
  type_remontee: string;
  titre: string;
  description: string;
  source?: string;
  localisation?: string;
  niveau_priorite: string;
  statut: string;
  sentiment?: string;
  categorie?: string;
  date_incident?: string;
  impact_estime?: string;
  nb_personnes_concernees?: number;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { remontees, periode_debut, periode_fin, titre } = await req.json() as {
      remontees: RemonteeData[];
      periode_debut: string;
      periode_fin: string;
      titre: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY n'est pas configurée");
    }

    // Préparer le contexte pour l'IA
    const contexte = `
Vous êtes un analyste expert en gestion des pêches. Vous devez analyser les remontées terrain suivantes et produire une synthèse structurée.

Période d'analyse: du ${new Date(periode_debut).toLocaleDateString('fr-FR')} au ${new Date(periode_fin).toLocaleDateString('fr-FR')}
Nombre de remontées: ${remontees.length}

Remontées à analyser:
${remontees.map((r, i) => `
${i + 1}. ${r.numero_reference} - ${r.titre}
   Type: ${r.type_remontee}
   Priorité: ${r.niveau_priorite}
   Sentiment: ${r.sentiment || 'non spécifié'}
   Catégorie: ${r.categorie || 'non spécifiée'}
   Localisation: ${r.localisation || 'non spécifiée'}
   Description: ${r.description}
   ${r.impact_estime ? `Impact estimé: ${r.impact_estime}` : ''}
   ${r.nb_personnes_concernees ? `Personnes concernées: ${r.nb_personnes_concernees}` : ''}
   ${r.date_incident ? `Date incident: ${new Date(r.date_incident).toLocaleDateString('fr-FR')}` : ''}
`).join('\n')}

Votre analyse doit être approfondie, factuelle et orientée action.
`;

    const systemPrompt = `Vous êtes un analyste expert en gestion des pêches et en politiques publiques. 
Votre rôle est d'analyser les remontées terrain (réclamations, suggestions, dénonciations, articles de presse, commentaires réseaux sociaux) 
et de produire une synthèse claire et actionnable pour le ministre des pêches.

Votre synthèse doit être:
- Factuelle et objective
- Structurée et claire
- Orientée vers l'action
- Basée uniquement sur les données fournies
- Rédigée en français professionnel`;

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
          { role: "user", content: contexte }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generer_synthese",
              description: "Génère une synthèse structurée des remontées terrain",
              parameters: {
                type: "object",
                properties: {
                  synthese_texte: {
                    type: "string",
                    description: "Synthèse narrative complète (300-500 mots) analysant les remontées, identifiant les tendances, problèmes récurrents et enjeux prioritaires"
                  },
                  points_cles: {
                    type: "array",
                    description: "Liste de 5-8 points clés à retenir",
                    items: {
                      type: "object",
                      properties: {
                        titre: { type: "string", description: "Titre du point clé" },
                        description: { type: "string", description: "Description détaillée" },
                        niveau_importance: { 
                          type: "string", 
                          enum: ["critique", "haut", "moyen"],
                          description: "Niveau d'importance"
                        },
                        categories_concernees: {
                          type: "array",
                          items: { type: "string" },
                          description: "Catégories ou thèmes concernés"
                        }
                      },
                      required: ["titre", "description", "niveau_importance"]
                    }
                  },
                  recommandations: {
                    type: "array",
                    description: "Liste de 5-10 recommandations concrètes et actionnables",
                    items: {
                      type: "object",
                      properties: {
                        titre: { type: "string", description: "Titre de la recommandation" },
                        description: { type: "string", description: "Description détaillée de l'action recommandée" },
                        priorite: { 
                          type: "string", 
                          enum: ["immediate", "court_terme", "moyen_terme"],
                          description: "Échéance recommandée"
                        },
                        type_action: {
                          type: "string",
                          enum: ["reglementation", "communication", "investigation", "formation", "sanction", "mesure_corrective"],
                          description: "Type d'action recommandée"
                        },
                        acteurs_impliques: {
                          type: "array",
                          items: { type: "string" },
                          description: "Institutions ou acteurs à impliquer"
                        }
                      },
                      required: ["titre", "description", "priorite", "type_action"]
                    }
                  },
                  tendances: {
                    type: "object",
                    description: "Analyse des tendances observées",
                    properties: {
                      themes_recurrents: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            theme: { type: "string" },
                            frequence: { type: "number" },
                            evolution: { 
                              type: "string",
                              enum: ["hausse", "stable", "baisse"]
                            }
                          }
                        }
                      },
                      zones_geographiques_prioritaires: {
                        type: "array",
                        items: { type: "string" },
                        description: "Zones géographiques nécessitant une attention particulière"
                      },
                      sentiment_general: {
                        type: "object",
                        properties: {
                          positif_pct: { type: "number" },
                          neutre_pct: { type: "number" },
                          negatif_pct: { type: "number" },
                          interpretation: { type: "string" }
                        }
                      }
                    },
                    required: ["themes_recurrents", "sentiment_general"]
                  }
                },
                required: ["synthese_texte", "points_cles", "recommandations", "tendances"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generer_synthese" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits à votre compte Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erreur API Lovable:", response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("Réponse de l'IA:", JSON.stringify(aiResponse, null, 2));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("Aucun outil appelé par l'IA");
    }

    const syntheseData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        synthese: syntheseData,
        metadata: {
          nb_remontees_analysees: remontees.length,
          periode_debut,
          periode_fin,
          titre
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Erreur lors de la génération de la synthèse:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
