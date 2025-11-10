import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SortieNonDeclaree {
  id: string;
  pecheur_id: string;
  pirogue_id: string;
  date_retour: string;
  heure_retour: string;
  pirogues: {
    nom: string;
  } | {
    nom: string;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Vérification des sorties non déclarées...');

    // Calculer le seuil de temps (maintenant - 2 heures)
    const deuxHeuresEnArriere = new Date();
    deuxHeuresEnArriere.setHours(deuxHeuresEnArriere.getHours() - 2);

    // 1. Trouver toutes les sorties où le pêcheur est revenu au port depuis plus de 2 heures
    const { data: sortiesNonDeclarees, error: sortiesError } = await supabase
      .from('sorties_peche')
      .select(`
        id,
        pecheur_id,
        pirogue_id,
        date_retour,
        heure_retour,
        pirogues!inner(nom)
      `)
      .not('date_retour', 'is', null)
      .not('heure_retour', 'is', null);

    if (sortiesError) {
      console.error('❌ Erreur récupération sorties:', sortiesError);
      throw sortiesError;
    }

    console.log(`📊 ${sortiesNonDeclarees?.length || 0} sorties trouvées avec retour`);

    const sortiesATraiter: SortieNonDeclaree[] = [];

    // Filtrer les sorties retournées depuis plus de 2 heures
    for (const sortie of sortiesNonDeclarees || []) {
      const dateRetour = new Date(`${sortie.date_retour}T${sortie.heure_retour}`);
      
      if (dateRetour < deuxHeuresEnArriere) {
        // Vérifier si des captures ont été déclarées pour cette sortie
        const { data: captures, error: capturesError } = await supabase
          .from('captures_pa')
          .select('id')
          .eq('declare_par', sortie.pecheur_id)
          .gte('date_capture', sortie.date_retour)
          .limit(1);

        if (capturesError) {
          console.error('❌ Erreur vérification captures:', capturesError);
          continue;
        }

        // Si aucune capture déclarée après le retour
        if (!captures || captures.length === 0) {
          // Vérifier qu'on n'a pas déjà envoyé un rappel pour cette sortie
          const { data: rappelExistant, error: rappelError } = await supabase
            .from('rappels_declaration_captures')
            .select('id')
            .eq('sortie_id', sortie.id)
            .limit(1);

          if (rappelError) {
            console.error('❌ Erreur vérification rappel:', rappelError);
            continue;
          }

          if (!rappelExistant || rappelExistant.length === 0) {
            sortiesATraiter.push(sortie as SortieNonDeclaree);
          }
        }
      }
    }

    console.log(`📬 ${sortiesATraiter.length} sorties nécessitent un rappel`);

    let notificationsEnvoyees = 0;

    // Envoyer les notifications pour chaque sortie
    for (const sortie of sortiesATraiter) {
      const dateRetour = new Date(`${sortie.date_retour}T${sortie.heure_retour}`);
      const heuresDepuis = Math.floor((new Date().getTime() - dateRetour.getTime()) / (1000 * 60 * 60));
      
      const pirogueNom = Array.isArray(sortie.pirogues) 
        ? sortie.pirogues[0]?.nom || 'Inconnue'
        : sortie.pirogues.nom;

      // Créer la notification
      const { error: notifError } = await supabase
        .from('notifications_pecheurs')
        .insert({
          user_id: sortie.pecheur_id,
          titre: '⚠️ Rappel : Déclarez vos captures',
          message: `Vous êtes de retour au port depuis ${heuresDepuis}h. N'oubliez pas de déclarer vos captures pour la sortie avec la pirogue ${pirogueNom}.`,
          type_notification: 'rappel_declaration',
          metadata: {
            sortie_id: sortie.id,
            pirogue_nom: pirogueNom,
            heures_depuis_retour: heuresDepuis,
          }
        });

      if (notifError) {
        console.error('❌ Erreur création notification:', notifError);
        continue;
      }

      // Enregistrer le rappel envoyé
      const { error: rappelError } = await supabase
        .from('rappels_declaration_captures')
        .insert({
          sortie_id: sortie.id,
          pecheur_id: sortie.pecheur_id,
          date_retour: dateRetour.toISOString(),
        });

      if (rappelError) {
        console.error('❌ Erreur enregistrement rappel:', rappelError);
      } else {
        notificationsEnvoyees++;
        console.log(`✅ Notification envoyée pour sortie ${sortie.id}`);
      }
    }

    const result = {
      success: true,
      sortiesVerifiees: sortiesNonDeclarees?.length || 0,
      notificationsEnvoyees,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Vérification terminée:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur dans check-captures-declaration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});