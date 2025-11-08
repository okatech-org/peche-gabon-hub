import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentRequest {
  type_document: string;
  titre: string;
  objet: string;
  contexte?: string;
  destinataires?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !authData.user) {
      throw new Error("Unauthorized");
    }

    const { type_document, titre, objet, contexte, destinataires }: DocumentRequest = await req.json();

    console.log("Generating document:", { type_document, titre, objet });

    // Récupérer les données contextuelles pour générer le document
    const [statsResult, alertesResult, rapportsResult, financesResult] = await Promise.all([
      // Stats captures des 12 derniers mois
      supabase
        .from("captures_pa")
        .select("espece_id, poids_kg, date_capture, site_id")
        .gte("date_capture", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000),
      
      // Alertes récentes
      supabase
        .from("alertes_rapports")
        .select("*")
        .eq("statut", "nouvelle")
        .order("created_at", { ascending: false })
        .limit(20),
      
      // Rapports zones récents
      supabase
        .from("rapports_zones")
        .select("*")
        .order("date_rapport", { ascending: false })
        .limit(10),
      
      // Stats financières
      supabase
        .from("quittances")
        .select("montant, statut, annee, mois")
        .gte("annee", new Date().getFullYear())
    ]);

    // Calculer les statistiques agrégées
    const totalCaptures = statsResult.data?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0;
    const nbAlertes = alertesResult.data?.length || 0;
    const nbRapports = rapportsResult.data?.length || 0;
    
    const financesData = financesResult.data || [];
    const totalAttendu = financesData.reduce((sum, q) => sum + (q.montant || 0), 0);
    const totalPaye = financesData.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0);
    const tauxRecouvrement = totalAttendu > 0 ? (totalPaye / totalAttendu * 100).toFixed(1) : 0;

    // Construire le contexte pour l'IA
    const contextData = {
      statistiques: {
        total_captures_kg: totalCaptures,
        nombre_alertes_actives: nbAlertes,
        nombre_rapports_recents: nbRapports,
        finances: {
          montant_attendu: totalAttendu,
          montant_recouvre: totalPaye,
          taux_recouvrement: tauxRecouvrement
        }
      },
      alertes: alertesResult.data?.slice(0, 5).map(a => ({
        indicateur: a.indicateur,
        valeur_actuelle: a.valeur_actuelle,
        severite: a.severite
      })),
      contexte_utilisateur: contexte
    };

    // Déterminer le prompt système selon le type de document
    const systemPrompts: { [key: string]: string } = {
      arrete: `Tu es un expert juridique spécialisé dans la rédaction d'arrêtés ministériels. 
      Rédige un arrêté ministériel formel avec:
      - Un préambule avec les visas juridiques appropriés (lois, décrets, etc.)
      - Des considérants expliquant les motifs de l'arrêté
      - Des articles numérotés et clairement structurés
      - Une formule de notification et de publication
      Utilise un langage juridique précis et formel.`,
      
      circulaire: `Tu es un expert en administration publique spécialisé dans la rédaction de circulaires.
      Rédige une circulaire ministérielle avec:
      - Un objet clair
      - Une introduction expliquant le contexte et les objectifs
      - Des sections numérotées détaillant les instructions
      - Des références aux textes applicables
      - Une conclusion avec les modalités de mise en œuvre
      Utilise un ton directif mais pédagogique.`,
      
      rapport: `Tu es un expert en analyse et reporting spécialisé dans les rapports ministériels.
      Rédige un rapport ministériel détaillé avec:
      - Un résumé exécutif
      - Une analyse de la situation basée sur les données fournies
      - Des constats et observations
      - Des recommandations concrètes et actionnables
      - Une conclusion
      Utilise un ton professionnel et analytique avec des données chiffrées.`,
      
      communique: `Tu es un expert en communication institutionnelle.
      Rédige un communiqué de presse officiel avec:
      - Un titre accrocheur
      - Un chapeau résumant l'information principale
      - Le corps du communiqué avec les détails
      - Une citation du ministre si approprié
      - Les informations de contact
      Utilise un ton officiel mais accessible au grand public.`,
      
      decision: `Tu es un expert juridique spécialisé dans les décisions administratives.
      Rédige une décision ministérielle avec:
      - Les visas des textes fondant la compétence
      - Les considérants justifiant la décision
      - Le dispositif (la décision elle-même) clair et précis
      - Les voies et délais de recours
      Utilise un langage juridique rigoureux.`,
      
      projet_loi: `Tu es un expert législatif.
      Rédige un projet de loi avec:
      - Un exposé des motifs détaillé
      - Des articles de loi numérotés et structurés
      - Des dispositions transitoires si nécessaire
      - Une étude d'impact
      Utilise la formulation législative appropriée.`
    };

    const systemPrompt = systemPrompts[type_document] || systemPrompts.rapport;

    const userPrompt = `
Génère un ${type_document} avec les informations suivantes:

**Titre:** ${titre}

**Objet:** ${objet}

**Données contextuelles du secteur de la pêche:**
${JSON.stringify(contextData, null, 2)}

${contexte ? `**Contexte additionnel fourni:**\n${contexte}` : ''}

${destinataires?.length ? `**Destinataires:** ${destinataires.join(', ')}` : ''}

Génère un document complet, professionnel et formellement correct selon les normes de l'administration publique gabonaise.
Le document doit être structuré, numéroté et prêt à être utilisé.
Intègre les données chiffrées de manière pertinente dans le document.
`;

    // Appeler Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez recharger votre espace Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Erreur lors de la génération du document");
    }

    const aiData = await aiResponse.json();
    const contenuGenere = aiData.choices[0].message.content;

    console.log("Document generated successfully");

    // Sauvegarder le document dans la base de données
    const { data: documentData, error: insertError } = await supabase
      .from("documents_ministeriels")
      .insert({
        type_document,
        titre,
        objet,
        contenu_genere: contenuGenere,
        created_by: authData.user.id,
        metadata: contextData,
        destinataires: destinataires || [],
        statut: "brouillon"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving document:", insertError);
      throw insertError;
    }

    console.log("Document saved to database:", documentData.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        document: documentData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in generate-ministerial-document:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors de la génération du document"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
