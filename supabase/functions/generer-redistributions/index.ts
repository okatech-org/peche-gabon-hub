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

    // Récupérer les paramètres de la requête
    const { montant_total, periode_mois, periode_annee } = await req.json();

    console.log('🚀 Début de la génération des redistributions institutionnelles');
    console.log(`💰 Montant total: ${montant_total} FCFA`);
    console.log(`📅 Période: ${periode_mois}/${periode_annee}`);

    if (!montant_total || !periode_mois || !periode_annee) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Paramètres manquants: montant_total, periode_mois et periode_annee requis'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    if (!institutions || institutions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Aucune institution active trouvée'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 2. Vérifier si des redistributions existent déjà pour cette période
    const { data: existingRemontees } = await supabase
      .from('remontees_effectives')
      .select('id')
      .eq('periode_mois', periode_mois)
      .eq('periode_annee', periode_annee)
      .is('quittance_id', null);

    if (existingRemontees && existingRemontees.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Des redistributions existent déjà pour la période ${periode_mois}/${periode_annee}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    // 3. Créer les redistributions pour chaque institution
    let totalRedistributions = 0;
    let erreurs = 0;
    const redistributions = [];

    for (const institution of institutions as InstitutionData[]) {
      const montantRedistribue = (montant_total * institution.pourcentage_taxes) / 100;

      const { data: inserted, error: insertError } = await supabase
        .from('remontees_effectives')
        .insert({
          institution_id: institution.id,
          montant_remonte: montantRedistribue,
          pourcentage_applique: institution.pourcentage_taxes,
          periode_mois: periode_mois,
          periode_annee: periode_annee,
          statut_virement: 'planifie',
          date_virement: null,
          quittance_id: null,
          taxe_id: null
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Erreur insertion redistribution:`, insertError);
        erreurs++;
      } else {
        totalRedistributions++;
        redistributions.push({
          institution: institution.nom_institution,
          montant: montantRedistribue,
          pourcentage: institution.pourcentage_taxes
        });
        console.log(`✅ Redistribution créée: ${montantRedistribue} FCFA pour ${institution.nom_institution}`);
      }
    }

    console.log(`🎉 Génération terminée: ${totalRedistributions} redistributions créées, ${erreurs} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalRedistributions} redistributions institutionnelles créées avec succès`,
        redistributions_creees: totalRedistributions,
        erreurs: erreurs,
        redistributions: redistributions,
        montant_total: montant_total,
        periode: `${periode_mois}/${periode_annee}`
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
