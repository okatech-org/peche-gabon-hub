import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentDeadline {
  user_id: string
  user_email: string
  user_phone: string
  user_name: string
  type_taxe: string
  montant: number
  date_echeance: string
  jours_restants: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Vérification des échéances de paiement...')

    // Récupérer les échéances à J-5
    const { data: deadlines, error: deadlinesError } = await supabaseAdmin
      .rpc('get_upcoming_payment_deadlines')

    if (deadlinesError) {
      console.error('❌ Erreur lors de la récupération des échéances:', deadlinesError)
      throw deadlinesError
    }

    console.log(`📋 ${deadlines?.length || 0} échéance(s) trouvée(s)`)

    const results = []

    for (const deadline of (deadlines as PaymentDeadline[] || [])) {
      console.log(`📧 Traitement: ${deadline.user_name} - ${deadline.type_taxe} - ${deadline.montant} FCFA`)

      // Mode démo: simuler l'envoi d'email/SMS
      const isDemoMode = true // Activer le vrai envoi en configurant RESEND_API_KEY

      if (isDemoMode) {
        // Simulation: enregistrer la notification comme "simulée"
        const { error: notifError } = await supabaseAdmin
          .from('notifications_paiements')
          .insert({
            type_notification: 'email',
            destinataire_email: deadline.user_email,
            destinataire_telephone: deadline.user_phone,
            destinataire_nom: deadline.user_name,
            type_taxe: deadline.type_taxe,
            montant: deadline.montant,
            date_echeance: deadline.date_echeance,
            jours_restants: deadline.jours_restants,
            statut: 'simule',
            user_id: deadline.user_id
          })

        if (notifError) {
          console.error('❌ Erreur lors de l\'enregistrement:', notifError)
          results.push({
            user: deadline.user_name,
            status: 'error',
            message: notifError.message
          })
        } else {
          console.log('✅ Notification simulée enregistrée')
          results.push({
            user: deadline.user_name,
            status: 'simulated',
            message: 'Notification simulée (mode démo)'
          })
        }
      } else {
        // TODO: Intégration réelle avec Resend pour email
        // TODO: Intégration avec service SMS
        results.push({
          user: deadline.user_name,
          status: 'pending',
          message: 'Envoi réel non configuré'
        })
      }
    }

    console.log('✅ Traitement terminé')

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Erreur globale:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
