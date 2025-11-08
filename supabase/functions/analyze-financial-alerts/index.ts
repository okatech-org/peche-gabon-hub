import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertConfig {
  id: string;
  nom: string;
  actif: boolean;
  seuil: number;
  severite: 'info' | 'warning' | 'critical';
  type_alerte: string;
}

interface Alert {
  type_alerte: string;
  severite: string;
  message: string;
  details: any;
  valeur_actuelle: number;
  valeur_reference: number;
  recommandation_ia?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { configs, includeAI } = await req.json();
    const alerts: Alert[] = [];

    // Charger les données financières récentes
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. Analyser les recettes
    const { data: quittancesCurrent } = await supabase
      .from('quittances')
      .select('*')
      .eq('annee', currentYear)
      .eq('mois', currentMonth);

    const { data: quittancesLast } = await supabase
      .from('quittances')
      .select('*')
      .eq('annee', lastMonthYear)
      .eq('mois', lastMonth);

    const recettesCurrent = quittancesCurrent?.reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
    const recettesLast = quittancesLast?.reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
    const variationRecettes = recettesLast > 0 ? ((recettesCurrent - recettesLast) / recettesLast) * 100 : 0;

    // Vérifier la baisse des recettes
    const baisseConfig = configs.find((c: AlertConfig) => c.type_alerte === 'baisse_recettes' && c.actif);
    if (baisseConfig && variationRecettes < -baisseConfig.seuil) {
      alerts.push({
        type_alerte: 'baisse_recettes',
        severite: baisseConfig.severite,
        message: `Baisse significative des recettes détectée: ${Math.abs(variationRecettes).toFixed(1)}%`,
        details: {
          recettes_actuelles: recettesCurrent,
          recettes_precedentes: recettesLast,
          variation: variationRecettes
        },
        valeur_actuelle: variationRecettes,
        valeur_reference: -baisseConfig.seuil
      });
    }

    // 2. Analyser le taux de recouvrement
    const recettesPayees = quittancesCurrent?.filter(q => q.statut === 'paye')
      .reduce((sum, q) => sum + (q.montant || 0), 0) || 0;
    const tauxRecouvrement = recettesCurrent > 0 ? (recettesPayees / recettesCurrent) * 100 : 0;

    const tauxConfig = configs.find((c: AlertConfig) => c.type_alerte === 'taux_faible' && c.actif);
    if (tauxConfig && tauxRecouvrement < tauxConfig.seuil) {
      alerts.push({
        type_alerte: 'taux_faible',
        severite: tauxConfig.severite,
        message: `Taux de recouvrement critique: ${tauxRecouvrement.toFixed(1)}%`,
        details: {
          recettes_attendues: recettesCurrent,
          recettes_payees: recettesPayees,
          taux: tauxRecouvrement
        },
        valeur_actuelle: tauxRecouvrement,
        valeur_reference: tauxConfig.seuil
      });
    }

    // 3. Analyser les retards de paiement
    const { data: quittancesRetard } = await supabase
      .from('quittances')
      .select('*')
      .eq('annee', currentYear)
      .eq('statut', 'en_retard');

    const nbRetards = quittancesRetard?.length || 0;
    const nbTotal = quittancesCurrent?.length || 0;
    const tauxRetard = nbTotal > 0 ? (nbRetards / nbTotal) * 100 : 0;

    const retardConfig = configs.find((c: AlertConfig) => c.type_alerte === 'augmentation_retards' && c.actif);
    if (retardConfig && tauxRetard > retardConfig.seuil) {
      alerts.push({
        type_alerte: 'augmentation_retards',
        severite: retardConfig.severite,
        message: `Taux élevé de retards de paiement: ${tauxRetard.toFixed(1)}%`,
        details: {
          nb_retards: nbRetards,
          nb_total: nbTotal,
          taux: tauxRetard
        },
        valeur_actuelle: tauxRetard,
        valeur_reference: retardConfig.seuil
      });
    }

    // 4. Analyser les taxes
    const { data: taxesData } = await supabase
      .from('taxes_calculees')
      .select('*')
      .gte('created_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
      .lt('created_at', new Date(currentYear, currentMonth, 1).toISOString());

    const taxesTotal = taxesData?.reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0) || 0;
    const taxesPayees = taxesData?.filter(t => t.statut_paiement === 'paye')
      .reduce((sum, t) => sum + parseFloat(t.montant_taxe.toString()), 0) || 0;
    const tauxCollecteTaxes = taxesTotal > 0 ? (taxesPayees / taxesTotal) * 100 : 0;

    const taxesConfig = configs.find((c: AlertConfig) => c.type_alerte === 'taxes_non_collectees' && c.actif);
    if (taxesConfig && (100 - tauxCollecteTaxes) > taxesConfig.seuil) {
      alerts.push({
        type_alerte: 'taxes_non_collectees',
        severite: taxesConfig.severite,
        message: `Taux élevé de taxes non collectées: ${(100 - tauxCollecteTaxes).toFixed(1)}%`,
        details: {
          taxes_calculees: taxesTotal,
          taxes_payees: taxesPayees,
          taux_collecte: tauxCollecteTaxes
        },
        valeur_actuelle: 100 - tauxCollecteTaxes,
        valeur_reference: taxesConfig.seuil
      });
    }

    // 5. Analyse IA si activée
    if (includeAI && alerts.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        try {
          for (const alert of alerts) {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: "Tu es un expert en analyse financière. Fournis des recommandations concrètes et actionnables en 2-3 phrases maximum."
                  },
                  {
                    role: "user",
                    content: `Analyse cette alerte financière et donne une recommandation concrète:\n\n` +
                      `Type: ${alert.type_alerte}\n` +
                      `Message: ${alert.message}\n` +
                      `Détails: ${JSON.stringify(alert.details, null, 2)}\n\n` +
                      `Quelle action immédiate recommandes-tu pour résoudre ce problème?`
                  }
                ],
                max_tokens: 200
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              alert.recommandation_ia = aiData.choices[0]?.message?.content || null;
            }
          }
        } catch (aiError) {
          console.error("Error getting AI recommendations:", aiError);
          // Continue sans les recommandations IA
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        alerts,
        analyzed_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
