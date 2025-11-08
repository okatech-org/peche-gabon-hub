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
  formateur_id: string;
  statut: string;
}

interface Suggestion {
  formation_id: string;
  formation_titre: string;
  date_debut_actuelle: string;
  date_fin_actuelle: string;
  suggestions_dates: {
    date_debut: string;
    date_fin: string;
    score: number;
    raison: string;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { conflict_formateur_id } = await req.json();

    console.log('Resolving conflicts for formateur:', conflict_formateur_id);

    // Récupérer toutes les formations du formateur
    const { data: formations, error: formationsError } = await supabase
      .from('formations_planifiees')
      .select('*')
      .eq('formateur_id', conflict_formateur_id)
      .order('date_debut');

    if (formationsError) {
      throw formationsError;
    }

    console.log(`Found ${formations.length} formations for formateur`);

    // Récupérer les disponibilités du formateur
    const { data: disponibilites, error: dispoError } = await supabase
      .from('formateurs_disponibilites')
      .select('*')
      .eq('formateur_id', conflict_formateur_id)
      .eq('disponible', true);

    if (dispoError) {
      throw dispoError;
    }

    console.log(`Found ${disponibilites?.length || 0} availabilities`);

    // Identifier les conflits
    const conflictingFormations: Formation[] = [];
    for (let i = 0; i < formations.length; i++) {
      for (let j = i + 1; j < formations.length; j++) {
        const f1 = formations[i];
        const f2 = formations[j];
        
        const start1 = new Date(f1.date_debut);
        const end1 = new Date(f1.date_fin);
        const start2 = new Date(f2.date_debut);
        const end2 = new Date(f2.date_fin);
        
        if (start1 <= end2 && start2 <= end1) {
          if (!conflictingFormations.some(f => f.id === f1.id)) {
            conflictingFormations.push(f1);
          }
          if (!conflictingFormations.some(f => f.id === f2.id)) {
            conflictingFormations.push(f2);
          }
        }
      }
    }

    console.log(`Found ${conflictingFormations.length} conflicting formations`);

    // Générer des suggestions pour chaque formation en conflit
    const suggestions: Suggestion[] = [];

    for (const formation of conflictingFormations) {
      const formationStart = new Date(formation.date_debut);
      const formationEnd = new Date(formation.date_fin);
      const durationMs = formationEnd.getTime() - formationStart.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      const alternativeDates: {
        date_debut: string;
        date_fin: string;
        score: number;
        raison: string;
      }[] = [];

      // Stratégie 1: Chercher dans les disponibilités du formateur
      if (disponibilites && disponibilites.length > 0) {
        for (const dispo of disponibilites) {
          const dispoStart = new Date(dispo.date_debut);
          const dispoEnd = new Date(dispo.date_fin);
          const dispoLengthDays = Math.ceil(
            (dispoEnd.getTime() - dispoStart.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dispoLengthDays >= durationDays) {
            const newEnd = new Date(dispoStart);
            newEnd.setDate(newEnd.getDate() + durationDays - 1);

            // Vérifier qu'il n'y a pas de conflit avec cette nouvelle date
            const hasConflict = formations.some(f => {
              if (f.id === formation.id) return false;
              const fStart = new Date(f.date_debut);
              const fEnd = new Date(f.date_fin);
              return dispoStart <= fEnd && newEnd >= fStart;
            });

            if (!hasConflict) {
              alternativeDates.push({
                date_debut: dispoStart.toISOString().split('T')[0],
                date_fin: newEnd.toISOString().split('T')[0],
                score: 95,
                raison: 'Période de disponibilité confirmée du formateur',
              });
            }
          }
        }
      }

      // Stratégie 2: Déplacer d'une semaine avant
      const oneWeekBefore = new Date(formationStart);
      oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
      const oneWeekBeforeEnd = new Date(oneWeekBefore);
      oneWeekBeforeEnd.setDate(oneWeekBeforeEnd.getDate() + durationDays - 1);

      const hasConflictWeekBefore = formations.some(f => {
        if (f.id === formation.id) return false;
        const fStart = new Date(f.date_debut);
        const fEnd = new Date(f.date_fin);
        return oneWeekBefore <= fEnd && oneWeekBeforeEnd >= fStart;
      });

      if (!hasConflictWeekBefore && oneWeekBefore >= new Date()) {
        alternativeDates.push({
          date_debut: oneWeekBefore.toISOString().split('T')[0],
          date_fin: oneWeekBeforeEnd.toISOString().split('T')[0],
          score: 80,
          raison: 'Décalage d\'une semaine avant la date initiale',
        });
      }

      // Stratégie 3: Déplacer d'une semaine après
      const oneWeekAfter = new Date(formationStart);
      oneWeekAfter.setDate(oneWeekAfter.getDate() + 7);
      const oneWeekAfterEnd = new Date(oneWeekAfter);
      oneWeekAfterEnd.setDate(oneWeekAfterEnd.getDate() + durationDays - 1);

      const hasConflictWeekAfter = formations.some(f => {
        if (f.id === formation.id) return false;
        const fStart = new Date(f.date_debut);
        const fEnd = new Date(f.date_fin);
        return oneWeekAfter <= fEnd && oneWeekAfterEnd >= fStart;
      });

      if (!hasConflictWeekAfter) {
        alternativeDates.push({
          date_debut: oneWeekAfter.toISOString().split('T')[0],
          date_fin: oneWeekAfterEnd.toISOString().split('T')[0],
          score: 75,
          raison: 'Décalage d\'une semaine après la date initiale',
        });
      }

      // Stratégie 4: Chercher le prochain créneau libre
      let searchDate = new Date();
      searchDate.setDate(searchDate.getDate() + 1);
      let foundSlot = false;
      let attempts = 0;

      while (!foundSlot && attempts < 90) {
        const searchEnd = new Date(searchDate);
        searchEnd.setDate(searchEnd.getDate() + durationDays - 1);

        const hasConflictSearch = formations.some(f => {
          if (f.id === formation.id) return false;
          const fStart = new Date(f.date_debut);
          const fEnd = new Date(f.date_fin);
          return searchDate <= fEnd && searchEnd >= fStart;
        });

        if (!hasConflictSearch) {
          alternativeDates.push({
            date_debut: searchDate.toISOString().split('T')[0],
            date_fin: searchEnd.toISOString().split('T')[0],
            score: 60,
            raison: 'Prochain créneau disponible sans conflit',
          });
          foundSlot = true;
        } else {
          searchDate.setDate(searchDate.getDate() + 1);
          attempts++;
        }
      }

      // Trier par score décroissant et garder les 3 meilleures
      alternativeDates.sort((a, b) => b.score - a.score);
      const topSuggestions = alternativeDates.slice(0, 3);

      suggestions.push({
        formation_id: formation.id,
        formation_titre: formation.titre,
        date_debut_actuelle: formation.date_debut,
        date_fin_actuelle: formation.date_fin,
        suggestions_dates: topSuggestions,
      });
    }

    console.log(`Generated ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error resolving conflicts:', error);
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
