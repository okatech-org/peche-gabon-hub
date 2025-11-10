import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SortieEnAttente {
  id: string;
  pecheur_id: string;
  pirogue_id: string;
  date_retour: string;
  heure_retour: string;
  pirogues: { nom: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Vérification des sorties sans déclaration...');

    // 1. Trouver toutes les sorties retournées depuis plus de 2 heures sans captures déclarées
    const deuxHeuresAgo = new Date();
    deuxHeuresAgo.setHours(deuxHeuresAgo.getHours() - 2);

    const { data: sortiesEnAttente, error: sortiesError } = await supabase
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
      console.error('Erreur récupération sorties:', sortiesError);
      throw sortiesError;
    }

    if (!sortiesEnAttente || sortiesEnAttente.length === 0) {
      console.log('Aucune sortie en attente trouvée');
      return new Response(
        JSON.stringify({ message: 'Aucune sortie en attente', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let notificationsEnvoyees = 0;

    for (const sortie of sortiesEnAttente as unknown as SortieEnAttente[]) {
      // Vérifier que la sortie est retournée depuis plus de 2 heures
      const dateRetour = new Date(`${sortie.date_retour}T${sortie.heure_retour}`);
      
      if (dateRetour > deuxHeuresAgo) {
        continue; // Pas encore 2 heures
      }

      // Vérifier s'il y a des captures déclarées pour cette sortie
      const { data: captures } = await supabase
        .from('captures_pa')
        .select('id')
        .eq('pirogue_id', sortie.pirogue_id)
        .gte('date_capture', sortie.date_retour)
        .limit(1);

      if (captures && captures.length > 0) {
        continue; // Des captures ont été déclarées
      }

      // Vérifier si un rappel a déjà été envoyé pour cette sortie
      const { data: rappelExistant } = await supabase
        .from('rappels_declaration_captures')
        .select('id')
        .eq('sortie_id', sortie.id)
        .limit(1);

      if (rappelExistant && rappelExistant.length > 0) {
        continue; // Rappel déjà envoyé
      }

      // Créer le rappel dans la table
      const { error: rappelError } = await supabase
        .from('rappels_declaration_captures')
        .insert({
          sortie_id: sortie.id,
          pecheur_id: sortie.pecheur_id,
          date_retour: `${sortie.date_retour}T${sortie.heure_retour}`,
        });

      if (rappelError) {
        console.error('Erreur création rappel:', rappelError);
        continue;
      }

      // Créer la notification pour le pêcheur
      const heuresDepuisRetour = Math.floor(
        (new Date().getTime() - dateRetour.getTime()) / (1000 * 60 * 60)
      );

      const { error: notifError } = await supabase
        .from('notifications_pecheurs')
        .insert({
          user_id: sortie.pecheur_id,
          titre: 'Rappel : Déclarez vos captures',
          message: `Vous êtes de retour au port depuis ${heuresDepuisRetour}h avec la pirogue ${sortie.pirogues.nom}. N'oubliez pas de déclarer vos captures !`,
          type_notification: 'rappel_declaration',
          metadata: {
            sortie_id: sortie.id,
            pirogue_nom: sortie.pirogues.nom,
            heures_depuis_retour: heuresDepuisRetour,
          },
        });

      if (notifError) {
        console.error('Erreur création notification:', notifError);
      } else {
        notificationsEnvoyees++;
        console.log(`Notification envoyée au pêcheur ${sortie.pecheur_id}`);
      }
    }

    console.log(`Traitement terminé. ${notificationsEnvoyees} notification(s) envoyée(s)`);

    return new Response(
      JSON.stringify({
        message: 'Vérification terminée',
        sortiesVerifiees: sortiesEnAttente.length,
        notificationsEnvoyees,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur globale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});