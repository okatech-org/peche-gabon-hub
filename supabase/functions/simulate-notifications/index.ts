import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Document {
  id: string
  titre: string
  type_document: string
  numero_reference: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId } = await req.json()

    if (!documentId) {
      throw new Error('Document ID is required')
    }

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

    // Récupérer le document
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents_ministeriels')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError) throw docError

    const doc = document as Document

    // Trouver les abonnements correspondants
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('notification_subscriptions')
      .select('*')
      .eq('active', true)

    if (subError) throw subError

    const notificationsSent = []

    // Pour chaque abonnement, vérifier si le document correspond aux intérêts
    for (const subscription of subscriptions || []) {
      const interests = subscription.interests as Array<{ type: string }>
      const matchesInterest = interests.some(
        (interest: { type: string }) => interest.type === doc.type_document
      )

      if (matchesInterest) {
        const channels = subscription.notification_channels as string[]
        
        for (const channel of channels) {
          let recipient = ''
          
          switch (channel) {
            case 'email':
              recipient = subscription.email
              break
            case 'sms':
              recipient = subscription.phone || subscription.email
              break
            case 'whatsapp':
              recipient = subscription.whatsapp_number || subscription.phone || subscription.email
              break
          }

          const message = `📢 Nouveau document publié: "${doc.titre}" (${doc.numero_reference}). Consultez le registre public pour plus de détails.`

          // Insérer dans l'historique (simulation d'envoi)
          const { error: historyError } = await supabaseAdmin
            .from('notification_history')
            .insert({
              subscription_id: subscription.id,
              document_id: doc.id,
              document_titre: doc.titre,
              channel,
              recipient,
              status: 'sent',
              message,
            })

          if (historyError) {
            console.error('Error inserting notification history:', historyError)
          } else {
            notificationsSent.push({ channel, recipient })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${notificationsSent.length} notifications simulées avec succès`,
        notifications: notificationsSent,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
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