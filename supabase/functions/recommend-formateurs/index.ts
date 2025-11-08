import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormateurData {
  id: string;
  nom: string;
  prenom: string;
  specialites: string[];
  note_moyenne: number | null;
  nb_formations_donnees: number;
  statut: string;
}

interface DisponibiliteData {
  formateur_id: string;
  date_debut: string;
  date_fin: string;
  disponible: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      typeFormation, 
      specialitesRequises, 
      dateDebut, 
      dateFin,
      lieu,
      nombreParticipants 
    } = await req.json();

    console.log("Recherche de formateurs pour:", { typeFormation, specialitesRequises, dateDebut, dateFin });

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer tous les formateurs actifs
    const { data: formateurs, error: formateursError } = await supabase
      .from("formateurs")
      .select("*")
      .eq("statut", "actif");

    if (formateursError) throw formateursError;

    // Récupérer les disponibilités
    const { data: disponibilites, error: dispoError } = await supabase
      .from("formateurs_disponibilites")
      .select("*")
      .eq("disponible", true)
      .gte("date_fin", dateDebut)
      .lte("date_debut", dateFin);

    if (dispoError) throw dispoError;

    // Filtrer les formateurs disponibles sur la période
    const formateursDisponibles = formateurs?.filter((f: FormateurData) =>
      disponibilites?.some((d: DisponibiliteData) => d.formateur_id === f.id)
    ) || [];

    console.log(`${formateursDisponibles.length} formateurs disponibles trouvés`);

    if (formateursDisponibles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Aucun formateur disponible sur cette période",
          recommendations: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Préparer les données pour l'IA
    const formateursContext = formateursDisponibles.map((f: FormateurData) => ({
      id: f.id,
      nom: `${f.prenom} ${f.nom}`,
      specialites: f.specialites,
      note_moyenne: f.note_moyenne || 0,
      nb_formations: f.nb_formations_donnees,
    }));

    // Appeler Lovable AI pour obtenir des recommandations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Tu es un système expert en recommandation de formateurs pour le secteur de la pêche au Gabon. 
Ton rôle est d'analyser les besoins de formation et de recommander les meilleurs formateurs disponibles.

Critères d'évaluation:
1. Adéquation des spécialités avec le besoin (poids: 40%)
2. Note moyenne de performance (poids: 30%)
3. Expérience (nombre de formations données) (poids: 20%)
4. Disponibilité complète sur la période (poids: 10%)

Retourne EXACTEMENT 3 recommandations classées par pertinence, avec des justifications claires et actionables.`;

    const userPrompt = `Recommande les 3 meilleurs formateurs pour cette formation:

Type de formation: ${typeFormation}
Spécialités requises: ${specialitesRequises.join(", ")}
Période: du ${dateDebut} au ${dateFin}
Lieu: ${lieu || "Non spécifié"}
Nombre de participants: ${nombreParticipants || "Non spécifié"}

Formateurs disponibles:
${JSON.stringify(formateursContext, null, 2)}

Analyse chaque formateur et retourne les 3 meilleurs avec:
- Score de pertinence (0-100)
- Justification détaillée
- Points forts spécifiques
- Points d'attention éventuels`;

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
              name: "recommend_formateurs",
              description: "Retourne les 3 meilleurs formateurs recommandés",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        formateur_id: { type: "string" },
                        score: { 
                          type: "number",
                          minimum: 0,
                          maximum: 100
                        },
                        justification: { type: "string" },
                        points_forts: {
                          type: "array",
                          items: { type: "string" }
                        },
                        points_attention: {
                          type: "array",
                          items: { type: "string" }
                        },
                        adequation_specialites: { type: "number" },
                        adequation_experience: { type: "number" },
                        adequation_performance: { type: "number" }
                      },
                      required: [
                        "formateur_id",
                        "score",
                        "justification",
                        "points_forts",
                        "adequation_specialites",
                        "adequation_experience",
                        "adequation_performance"
                      ],
                      additionalProperties: false,
                    },
                    minItems: 1,
                    maxItems: 3
                  },
                  analyse_globale: { type: "string" }
                },
                required: ["recommendations", "analyse_globale"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_formateurs" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    // Enrichir les recommandations avec les données complètes des formateurs
    const enrichedRecommendations = recommendations.recommendations.map((rec: any) => {
      const formateur = formateurs?.find((f: FormateurData) => f.id === rec.formateur_id);
      return {
        ...rec,
        formateur: formateur ? {
          id: formateur.id,
          nom: formateur.nom,
          prenom: formateur.prenom,
          specialites: formateur.specialites,
          note_moyenne: formateur.note_moyenne,
          nb_formations_donnees: formateur.nb_formations_donnees,
        } : null,
      };
    });

    return new Response(
      JSON.stringify({
        recommendations: enrichedRecommendations,
        analyse_globale: recommendations.analyse_globale,
        total_formateurs_analyses: formateursDisponibles.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in recommend-formateurs:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue",
        recommendations: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
