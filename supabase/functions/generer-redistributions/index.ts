import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuittanceData {
  id: string;
  montant: number;
  mois: number;
  annee: number;
  statut: string;
  date_paiement: string | null;
}

interface InstitutionData {
  id: string;
  nom_institution: string;
  type_institution: string;
  pourcentage_taxes: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Début de la génération des redistributions institutionnelles');

    // 1. Récupérer toutes les institutions actives avec leurs pourcentages
    const { data: institutions, error: instError } = await supabase
      .from('repartition_institutionnelle')
      .select('*')
      .eq('actif', true);

    if (instError) {
      console.error('❌ Erreur institutions:', instError);
      throw instError;
    }

    console.log(`✅ ${institutions?.length || 0} institutions actives trouvées`);

    // 2. Récupérer toutes les quittances payées
    const { data: quittances, error: quittError } = await supabase
      .from('quittances')
      .select('*')
      .eq('statut', 'paye')
      .not('date_paiement', 'is', null)
      .order('date_paiement', { ascending: false });

    if (quittError) {
      console.error('❌ Erreur quittances:', quittError);
      throw quittError;
    }

    console.log(`✅ ${quittances?.length || 0} quittances payées trouvées`);

    if (!quittances || quittances.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucune quittance payée à redistribuer',
          redistributions_creees: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. Pour chaque quittance, créer les redistributions
    let totalRedistributions = 0;
    let erreurs = 0;

    for (const quittance of quittances as QuittanceData[]) {
      // Vérifier si des redistributions existent déjà pour cette quittance
      const { data: existingRemontees } = await supabase
        .from('remontees_effectives')
        .select('id')
        .eq('quittance_id', quittance.id);

      if (existingRemontees && existingRemontees.length > 0) {
        console.log(`⏭️  Redistributions déjà existantes pour quittance ${quittance.id}`);
        continue;
      }

      // Créer une redistribution pour chaque institution
      for (const institution of institutions as InstitutionData[]) {
        const montantRedistribue = (quittance.montant * institution.pourcentage_taxes) / 100;

        const { error: insertError } = await supabase
          .from('remontees_effectives')
          .insert({
            quittance_id: quittance.id,
            institution_id: institution.id,
            montant_remonte: montantRedistribue,
            pourcentage_applique: institution.pourcentage_taxes,
            periode_mois: quittance.mois,
            periode_annee: quittance.annee,
            statut_virement: 'planifie',
            date_virement: null
          });

        if (insertError) {
          console.error(`❌ Erreur insertion redistribution:`, insertError);
          erreurs++;
        } else {
          totalRedistributions++;
          console.log(`✅ Redistribution créée: ${montantRedistribue} FCFA pour ${institution.nom_institution}`);
        }
      }
    }

    console.log(`🎉 Génération terminée: ${totalRedistributions} redistributions créées, ${erreurs} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalRedistributions} redistributions institutionnelles créées avec succès`,
        redistributions_creees: totalRedistributions,
        erreurs: erreurs,
        quittances_traitees: quittances.length,
        institutions: institutions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
