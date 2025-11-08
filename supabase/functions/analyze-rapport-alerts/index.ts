import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rapportId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Récupérer le nouveau rapport
    const { data: rapport, error: rapportError } = await supabaseClient
      .from('rapports_zones')
      .select('*')
      .eq('id', rapportId)
      .single();

    if (rapportError || !rapport) {
      throw new Error('Rapport non trouvé');
    }

    // Récupérer les seuils d'alertes actifs
    const { data: seuils, error: seuilsError } = await supabaseClient
      .from('seuils_alertes_rapports')
      .select('*')
      .eq('actif', true);

    if (seuilsError) throw seuilsError;

    if (!seuils || seuils.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun seuil actif', alertes: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trouver les rapports similaires (même région et/ou catégorie)
    let query = supabaseClient
      .from('rapports_zones')
      .select('*')
      .neq('id', rapportId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (rapport.region) {
      query = query.eq('region', rapport.region);
    }
    if (rapport.categorie_id) {
      query = query.eq('categorie_id', rapport.categorie_id);
    }

    const { data: rapportsPrecedents, error: precedentsError } = await query;

    if (precedentsError) throw precedentsError;

    if (!rapportsPrecedents || rapportsPrecedents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun rapport précédent pour comparaison', alertes: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alertesCreees = [];

    // Comparer avec le rapport le plus récent
    const rapportReference = rapportsPrecedents[0];
    
    for (const seuil of seuils) {
      // Vérifier si le seuil s'applique à cette région
      if (seuil.region && seuil.region !== rapport.region) {
        continue;
      }

      // Vérifier si le seuil s'applique à cette catégorie
      if (seuil.categorie_id && seuil.categorie_id !== rapport.categorie_id) {
        continue;
      }

      let valeurActuelle: number;
      let valeurPrecedente: number;

      // Extraire les valeurs selon l'indicateur
      switch (seuil.indicateur) {
        case 'captures_totales':
          valeurActuelle = rapport.statistiques.totalCaptures || 0;
          valeurPrecedente = rapportReference.statistiques.totalCaptures || 0;
          break;
        case 'cpue_moyen':
          valeurActuelle = rapport.statistiques.moyenneCPUE || 0;
          valeurPrecedente = rapportReference.statistiques.moyenneCPUE || 0;
          break;
        case 'nombre_sites':
          valeurActuelle = rapport.statistiques.nombreSites || 0;
          valeurPrecedente = rapportReference.statistiques.nombreSites || 0;
          break;
        default:
          continue;
      }

      if (valeurPrecedente === 0) continue;

      // Calculer la variation en pourcentage
      const variationPourcentage = ((valeurActuelle - valeurPrecedente) / valeurPrecedente) * 100;
      const variationAbsolue = Math.abs(variationPourcentage);
      const typeVariation = variationPourcentage > 0 ? 'hausse' : 'baisse';

      // Vérifier si le seuil est dépassé
      const seuilDepasse = 
        variationAbsolue >= seuil.seuil_pourcentage &&
        (seuil.type_variation === 'tout' || seuil.type_variation === typeVariation);

      if (seuilDepasse) {
        // Déterminer la sévérité
        let severite = 'moyenne';
        if (variationAbsolue >= seuil.seuil_pourcentage * 2) {
          severite = 'elevee';
        } else if (variationAbsolue < seuil.seuil_pourcentage * 1.5) {
          severite = 'faible';
        }

        // Créer l'alerte
        const { data: alerte, error: alerteError } = await supabaseClient
          .from('alertes_rapports')
          .insert({
            rapport_nouveau_id: rapportId,
            rapport_reference_id: rapportReference.id,
            seuil_id: seuil.id,
            indicateur: seuil.indicateur,
            valeur_precedente: valeurPrecedente,
            valeur_actuelle: valeurActuelle,
            variation_pourcentage: variationPourcentage,
            type_variation: typeVariation,
            severite: severite
          })
          .select()
          .single();

        if (!alerteError && alerte) {
          alertesCreees.push(alerte);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `${alertesCreees.length} alerte(s) créée(s)`,
        alertes: alertesCreees 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-rapport-alerts function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
