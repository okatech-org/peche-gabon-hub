import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaxePayment {
  id: string;
  montant: number;
  pecheur_email: string;
  pecheur_nom: string;
  espece: string;
  poids: number;
  date_capture: string;
}

interface RequestBody {
  cooperative_id: string;
  cooperative_nom: string;
  taxes: TaxePayment[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { cooperative_id, cooperative_nom, taxes }: RequestBody = await req.json();

    console.log(`Traitement de ${taxes.length} taxes pour ${cooperative_nom}`);

    const results = {
      success: 0,
      failed: 0,
      quittances: [] as any[],
    };

    // Traiter chaque taxe
    for (const taxe of taxes) {
      try {
        const datePaiement = new Date().toISOString();
        const annee = new Date().getFullYear();

        // Générer un numéro de quittance
        const { data: lastQuittance } = await supabase
          .from("quittances")
          .select("numero_quittance")
          .like("numero_quittance", `QT-${annee}-%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let numeroSequence = 1;
        if (lastQuittance?.numero_quittance) {
          const lastNum = parseInt(lastQuittance.numero_quittance.split("-")[2]);
          numeroSequence = lastNum + 1;
        }

        const numeroQuittance = `QT-${annee}-${numeroSequence.toString().padStart(6, "0")}`;

        // Mettre à jour la taxe
        const { error: updateError } = await supabase
          .from("taxes_captures")
          .update({
            statut_paiement: "paye",
            date_paiement: datePaiement,
            quittance_numero: numeroQuittance,
          })
          .eq("id", taxe.id);

        if (updateError) throw updateError;

        // Créer la quittance
        const { data: quittance, error: quittanceError } = await supabase
          .from("quittances")
          .insert({
            numero_quittance: numeroQuittance,
            type_paiement: "taxe_capture",
            montant: taxe.montant,
            date_paiement: datePaiement,
            mode_paiement: "cooperative",
            statut: "validee",
            payeur_nom: taxe.pecheur_nom,
            cooperative_id: cooperative_id,
            notes: `Paiement groupé via ${cooperative_nom} - Espèce: ${taxe.espece}, Poids: ${taxe.poids}kg`,
          })
          .select()
          .single();

        if (quittanceError) throw quittanceError;

        results.quittances.push(quittance);

        // Envoyer l'email si l'adresse est valide
        if (taxe.pecheur_email && taxe.pecheur_email.includes("@")) {
          try {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .quittance { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e5e7eb; }
                    .field { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .field:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #6b7280; font-size: 0.875rem; }
                    .value { color: #111827; font-size: 1rem; margin-top: 4px; }
                    .montant { font-size: 1.5rem; font-weight: bold; color: #059669; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.875rem; }
                    .button { background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0;">Quittance de Paiement</h1>
                      <p style="margin: 10px 0 0 0;">Taxe de Capture</p>
                    </div>
                    <div class="content">
                      <p>Bonjour ${taxe.pecheur_nom},</p>
                      <p>Votre coopérative <strong>${cooperative_nom}</strong> a effectué le paiement de votre taxe de capture. Voici les détails de votre quittance :</p>
                      
                      <div class="quittance">
                        <div class="field">
                          <div class="label">NUMÉRO DE QUITTANCE</div>
                          <div class="value" style="font-family: monospace; font-size: 1.25rem; color: #0ea5e9;">${numeroQuittance}</div>
                        </div>
                        <div class="field">
                          <div class="label">DATE DE PAIEMENT</div>
                          <div class="value">${new Date(datePaiement).toLocaleDateString("fr-FR", { 
                            day: "2-digit", 
                            month: "long", 
                            year: "numeric" 
                          })}</div>
                        </div>
                        <div class="field">
                          <div class="label">ESPÈCE</div>
                          <div class="value">${taxe.espece}</div>
                        </div>
                        <div class="field">
                          <div class="label">POIDS CAPTURÉ</div>
                          <div class="value">${taxe.poids.toLocaleString()} kg</div>
                        </div>
                        <div class="field">
                          <div class="label">DATE DE CAPTURE</div>
                          <div class="value">${new Date(taxe.date_capture).toLocaleDateString("fr-FR")}</div>
                        </div>
                        <div class="field">
                          <div class="label">MONTANT PAYÉ</div>
                          <div class="montant">${taxe.montant.toLocaleString()} FCFA</div>
                        </div>
                        <div class="field">
                          <div class="label">MODE DE PAIEMENT</div>
                          <div class="value">Paiement groupé via coopérative</div>
                        </div>
                        <div class="field">
                          <div class="label">STATUT</div>
                          <div class="value" style="color: #059669; font-weight: bold;">✓ VALIDÉE</div>
                        </div>
                      </div>

                      <p style="margin-top: 30px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                        <strong>Important :</strong> Conservez cette quittance comme preuve de paiement. Elle pourra vous être demandée lors des contrôles.
                      </p>

                      <div class="footer">
                        <p>Ce document a été généré automatiquement par le système de gestion des pêches.</p>
                        <p style="margin-top: 10px;">Pour toute question, contactez votre coopérative : <strong>${cooperative_nom}</strong></p>
                        <p style="margin-top: 20px; color: #9ca3af;">© ${new Date().getFullYear()} - Ministère des Pêches et de l'Aquaculture</p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `;

            await resend.emails.send({
              from: "Pêches Gabon <onboarding@resend.dev>",
              to: [taxe.pecheur_email],
              subject: `Quittance ${numeroQuittance} - Paiement de taxe`,
              html: emailHtml,
            });

            console.log(`Email envoyé à ${taxe.pecheur_email}`);
          } catch (emailError) {
            console.error(`Erreur envoi email à ${taxe.pecheur_email}:`, emailError);
            // Ne pas bloquer pour les erreurs d'email
          }
        }

        results.success++;
      } catch (taxeError) {
        console.error(`Erreur traitement taxe ${taxe.id}:`, taxeError);
        results.failed++;
      }
    }

    console.log(`Résultat: ${results.success} succès, ${results.failed} échecs`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `${results.success} quittance(s) générée(s) et envoyée(s)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
