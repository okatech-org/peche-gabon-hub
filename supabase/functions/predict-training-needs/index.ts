import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BesoinfFormation {
  indicateur: string;
  type_formation: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  urgence: number;
  raison: string;
  formateurs_recommandes: {
    formateur_id: string;
    formateur_nom: string;
    score_adequation: number;
    specialites_matching: string[];
    historique_succes: number;
    disponibilite_estimee: boolean;
    justification: string;
  }[];
}

interface Prediction {
  periode_analyse: string;
  tendances_identifiees: string[];
  besoins_prioritaires: BesoinfFormation[];
  recommandations_strategiques: string[];
  score_confiance: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const { horizon_mois } = await req.json();
    const horizonMois = horizon_mois || 6;

    console.log(`Predicting training needs for next ${horizonMois} months`);

    // Récupérer les données historiques
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Évaluations des formations
    const { data: evaluations, error: evalError } = await supabase
      .from('formations_evaluations')
      .select(`
        *,
        formations_planifiees (
          type_formation,
          formateur_id
        )
      `)
      .gte('date_evaluation', sixMonthsAgo.toISOString().split('T')[0])
      .order('date_evaluation', { ascending: false });

    if (evalError) throw evalError;

    // Captures récentes pour identifier les tendances
    const { data: captures, error: capturesError } = await supabase
      .from('captures_pa')
      .select('date_capture, poids_kg, cpue, espece_id')
      .gte('date_capture', sixMonthsAgo.toISOString().split('T')[0])
      .order('date_capture', { ascending: false })
      .limit(1000);

    if (capturesError) throw capturesError;

    // Formateurs avec leurs performances
    const { data: formateurs, error: formateursError } = await supabase
      .from('formateurs')
      .select(`
        *,
        formateurs_evaluations (
          note_globale,
          note_expertise,
          note_pedagogie,
          formation_id
        )
      `)
      .eq('statut', 'actif');

    if (formateursError) throw formateursError;

    // Disponibilités futures
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + horizonMois);

    const { data: disponibilites, error: dispoError } = await supabase
      .from('formateurs_disponibilites')
      .select('*')
      .eq('disponible', true)
      .lte('date_debut', futureDate.toISOString().split('T')[0]);

    if (dispoError) throw dispoError;

    console.log('Preparing data for AI analysis...');

    // Préparer les statistiques pour l'IA
    const evalStats = evaluations?.map((e: any) => ({
      type_formation: e.formations_planifiees?.type_formation,
      efficacite_avant: e.efficacite_avant,
      efficacite_apres: e.efficacite_apres,
      amelioration_pct: e.amelioration_pct,
      indicateurs_impactes: e.indicateurs_impactes,
      formateur_id: e.formations_planifiees?.formateur_id,
    })) || [];

    const capturesStats = {
      total_captures: captures?.reduce((sum: number, c: any) => sum + (c.poids_kg || 0), 0) || 0,
      cpue_moyen: captures?.reduce((sum: number, c: any) => sum + (c.cpue || 0), 0) / (captures?.length || 1) || 0,
      tendance: captures?.length || 0,
    };

    const formateursData = formateurs?.map((f: any) => ({
      id: f.id,
      nom: `${f.prenom} ${f.nom}`,
      specialites: f.specialites,
      note_moyenne: f.note_moyenne,
      nb_formations_donnees: f.nb_formations_donnees,
      evaluations: f.formateurs_evaluations?.map((e: any) => ({
        note_globale: e.note_globale,
        note_expertise: e.note_expertise,
        note_pedagogie: e.note_pedagogie,
      })) || [],
      disponibilites_futures: disponibilites?.filter((d: any) => d.formateur_id === f.id).length || 0,
    })) || [];

    const systemPrompt = `Tu es un expert en analyse prédictive des besoins en formation dans le secteur de la pêche.

Ton rôle est d'analyser les données historiques et les tendances actuelles pour:
1. Identifier les besoins futurs en formation
2. Prioriser ces besoins selon leur urgence et impact
3. Recommander les meilleurs formateurs pour chaque besoin
4. Fournir des recommandations stratégiques

Pour chaque besoin identifié, tu dois:
- Spécifier l'indicateur de pêche concerné (CPUE, captures, conformité, sécurité, etc.)
- Définir le type de formation nécessaire (technique, réglementaire, gestion, sécurité)
- Évaluer la priorité (haute, moyenne, basse) et l'urgence (score 0-100)
- Expliquer clairement la raison du besoin
- Recommander les 3 meilleurs formateurs avec:
  * Score d'adéquation (0-100)
  * Spécialités correspondantes
  * Historique de succès (amélioration moyenne obtenue)
  * Disponibilité estimée
  * Justification du choix

Analyse les données et fournis des prédictions concrètes et actionnables.`;

    const userPrompt = `Analyse les données suivantes pour prédire les besoins en formation des ${horizonMois} prochains mois:

ÉVALUATIONS HISTORIQUES (${evaluations?.length || 0} formations):
${JSON.stringify(evalStats, null, 2)}

STATISTIQUES CAPTURES RÉCENTES:
${JSON.stringify(capturesStats, null, 2)}

FORMATEURS DISPONIBLES (${formateurs?.length || 0}):
${JSON.stringify(formateursData, null, 2)}

Identifie les besoins prioritaires et recommande les meilleurs formateurs pour chaque besoin.`;

    console.log('Calling Lovable AI for predictive analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'predict_training_needs',
              description: 'Prédire les besoins en formation et recommander les formateurs',
              parameters: {
                type: 'object',
                properties: {
                  periode_analyse: {
                    type: 'string',
                    description: 'Description de la période analysée',
                  },
                  tendances_identifiees: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Liste des tendances observées dans les données',
                  },
                  besoins_prioritaires: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        indicateur: { type: 'string' },
                        type_formation: {
                          type: 'string',
                          enum: ['technique', 'reglementaire', 'gestion', 'securite'],
                        },
                        priorite: {
                          type: 'string',
                          enum: ['haute', 'moyenne', 'basse'],
                        },
                        urgence: {
                          type: 'number',
                          description: 'Score d\'urgence entre 0 et 100',
                        },
                        raison: { type: 'string' },
                        formateurs_recommandes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              formateur_id: { type: 'string' },
                              formateur_nom: { type: 'string' },
                              score_adequation: {
                                type: 'number',
                                description: 'Score entre 0 et 100',
                              },
                              specialites_matching: {
                                type: 'array',
                                items: { type: 'string' },
                              },
                              historique_succes: {
                                type: 'number',
                                description: 'Amélioration moyenne obtenue (%)',
                              },
                              disponibilite_estimee: { type: 'boolean' },
                              justification: { type: 'string' },
                            },
                            required: [
                              'formateur_id',
                              'formateur_nom',
                              'score_adequation',
                              'specialites_matching',
                              'historique_succes',
                              'disponibilite_estimee',
                              'justification',
                            ],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: [
                        'indicateur',
                        'type_formation',
                        'priorite',
                        'urgence',
                        'raison',
                        'formateurs_recommandes',
                      ],
                      additionalProperties: false,
                    },
                  },
                  recommandations_strategiques: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Recommandations stratégiques générales',
                  },
                  score_confiance: {
                    type: 'number',
                    description: 'Score de confiance de la prédiction (0-100)',
                  },
                },
                required: [
                  'periode_analyse',
                  'tendances_identifiees',
                  'besoins_prioritaires',
                  'recommandations_strategiques',
                  'score_confiance',
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'predict_training_needs' },
        },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI API request failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const prediction: Prediction = JSON.parse(toolCall.function.arguments);

    console.log(`Generated prediction with ${prediction.besoins_prioritaires.length} priority needs`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        horizon_mois: horizonMois,
        nb_evaluations_analysees: evaluations?.length || 0,
        nb_formateurs_disponibles: formateurs?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error predicting training needs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
