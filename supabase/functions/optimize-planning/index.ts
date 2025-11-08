import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Formation {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  formateur_id: string | null;
  type_formation: string;
  priorite: string;
  statut: string;
}

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  specialites: string[];
}

interface OptimizationSuggestion {
  formation_id: string;
  formation_titre: string;
  action: 'reassign' | 'reschedule' | 'keep';
  ancien_formateur_id: string | null;
  nouveau_formateur_id: string | null;
  ancien_formateur_nom: string;
  nouveau_formateur_nom: string;
  ancienne_date_debut: string;
  ancienne_date_fin: string;
  nouvelle_date_debut: string;
  nouvelle_date_fin: string;
  raison: string;
  impact_charge: number;
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

    const { date_debut, date_fin } = await req.json();

    console.log('Optimizing planning for period:', date_debut, 'to', date_fin);

    // Récupérer toutes les formations dans la période
    const { data: formations, error: formationsError } = await supabase
      .from('formations_planifiees')
      .select('*')
      .gte('date_fin', date_debut)
      .lte('date_debut', date_fin)
      .order('date_debut');

    if (formationsError) throw formationsError;

    // Récupérer tous les formateurs actifs
    const { data: formateurs, error: formateursError } = await supabase
      .from('formateurs')
      .select('*')
      .eq('statut', 'actif');

    if (formateursError) throw formateursError;

    // Récupérer les disponibilités
    const { data: disponibilites, error: dispoError } = await supabase
      .from('formateurs_disponibilites')
      .select('*')
      .eq('disponible', true)
      .gte('date_fin', date_debut)
      .lte('date_debut', date_fin);

    if (dispoError) throw dispoError;

    console.log(`Analyzing ${formations.length} formations and ${formateurs.length} formateurs`);

    // Préparer les données pour l'IA
    const formateursData = formateurs.map((f: Formateur) => ({
      id: f.id,
      nom: `${f.prenom} ${f.nom}`,
      specialites: f.specialites,
      formations_actuelles: formations.filter((form: Formation) => form.formateur_id === f.id).map((form: Formation) => ({
        titre: form.titre,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        type: form.type_formation,
        priorite: form.priorite,
      })),
      disponibilites: disponibilites?.filter((d: any) => d.formateur_id === f.id).map((d: any) => ({
        date_debut: d.date_debut,
        date_fin: d.date_fin,
      })) || [],
    }));

    const formationsData = formations.map((f: Formation) => ({
      id: f.id,
      titre: f.titre,
      date_debut: f.date_debut,
      date_fin: f.date_fin,
      formateur_id: f.formateur_id,
      formateur_nom: f.formateur_id
        ? formateurs.find((fmt: Formateur) => fmt.id === f.formateur_id)
          ? `${formateurs.find((fmt: Formateur) => fmt.id === f.formateur_id).prenom} ${formateurs.find((fmt: Formateur) => fmt.id === f.formateur_id).nom}`
          : 'Non assigné'
        : 'Non assigné',
      type: f.type_formation,
      priorite: f.priorite,
      statut: f.statut,
    }));

    // Appeler l'IA pour optimiser
    const systemPrompt = `Tu es un expert en optimisation de planification de formations. 
Ton objectif est d'analyser la charge de travail des formateurs et de proposer une réorganisation optimale qui:
1. Équilibre la charge entre tous les formateurs
2. Évite tous les conflits d'horaires
3. Respecte les spécialités des formateurs
4. Respecte les disponibilités déclarées
5. Priorise les formations selon leur priorité (haute > moyenne > basse)
6. Minimise les changements tout en maximisant l'efficacité

Pour chaque suggestion d'optimisation, tu dois fournir:
- L'action (reassign = changer de formateur, reschedule = changer de dates, keep = garder tel quel)
- L'ancien et le nouveau formateur (si reassign)
- Les anciennes et nouvelles dates (si reschedule)
- Une raison claire et concise
- L'impact estimé sur la charge de travail (en nombre de jours)

Analyse les données et propose des optimisations concrètes.`;

    const userPrompt = `Voici les données à analyser:

FORMATEURS (${formateurs.length}):
${JSON.stringify(formateursData, null, 2)}

FORMATIONS À PLANIFIER (${formations.length}):
${JSON.stringify(formationsData, null, 2)}

PÉRIODE D'ANALYSE: du ${date_debut} au ${date_fin}

Analyse la situation actuelle et propose des optimisations pour équilibrer la charge de travail et éviter les conflits.`;

    console.log('Calling Lovable AI for optimization analysis...');

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
              name: 'suggest_optimizations',
              description: 'Retourner les suggestions d\'optimisation de planning',
              parameters: {
                type: 'object',
                properties: {
                  analyse_globale: {
                    type: 'string',
                    description: 'Analyse générale de la situation actuelle',
                  },
                  taux_equilibre_actuel: {
                    type: 'number',
                    description: 'Score d\'équilibre actuel entre 0 et 100',
                  },
                  taux_equilibre_optimise: {
                    type: 'number',
                    description: 'Score d\'équilibre estimé après optimisation',
                  },
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        formation_id: { type: 'string' },
                        formation_titre: { type: 'string' },
                        action: {
                          type: 'string',
                          enum: ['reassign', 'reschedule', 'keep'],
                        },
                        ancien_formateur_id: { type: 'string' },
                        nouveau_formateur_id: { type: 'string' },
                        ancien_formateur_nom: { type: 'string' },
                        nouveau_formateur_nom: { type: 'string' },
                        ancienne_date_debut: { type: 'string' },
                        ancienne_date_fin: { type: 'string' },
                        nouvelle_date_debut: { type: 'string' },
                        nouvelle_date_fin: { type: 'string' },
                        raison: { type: 'string' },
                        impact_charge: { type: 'number' },
                      },
                      required: [
                        'formation_id',
                        'formation_titre',
                        'action',
                        'raison',
                        'impact_charge',
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  'analyse_globale',
                  'taux_equilibre_actuel',
                  'taux_equilibre_optimise',
                  'suggestions',
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'suggest_optimizations' },
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

    const result = JSON.parse(toolCall.function.arguments);

    console.log(`Generated ${result.suggestions.length} optimization suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        analyse_globale: result.analyse_globale,
        taux_equilibre_actuel: result.taux_equilibre_actuel,
        taux_equilibre_optimise: result.taux_equilibre_optimise,
        suggestions: result.suggestions,
        nb_formations_total: formations.length,
        nb_formateurs_total: formateurs.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error optimizing planning:', error);
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
