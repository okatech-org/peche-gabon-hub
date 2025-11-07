import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoAccount {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}

const demoAccounts: DemoAccount[] = [
  { email: 'pecheur@demo.ga', password: 'Demo2025!', firstName: 'Jean', lastName: 'Pêcheur', role: 'pecheur' },
  { email: 'agent@demo.ga', password: 'Demo2025!', firstName: 'Marie', lastName: 'Collecte', role: 'agent_collecte' },
  { email: 'coop@demo.ga', password: 'Demo2025!', firstName: 'Paul', lastName: 'Gestionnaire', role: 'gestionnaire_coop' },
  { email: 'inspecteur@demo.ga', password: 'Demo2025!', firstName: 'Pierre', lastName: 'Inspecteur', role: 'inspecteur' },
  { email: 'province@demo.ga', password: 'Demo2025!', firstName: 'Sophie', lastName: 'Province', role: 'direction_provinciale' },
  { email: 'centrale@demo.ga', password: 'Demo2025!', firstName: 'André', lastName: 'Centrale', role: 'direction_centrale' },
  { email: 'armateur@demo.ga', password: 'Demo2025!', firstName: 'Michel', lastName: 'Armateur', role: 'armateur_pi' },
  { email: 'observateur@demo.ga', password: 'Demo2025!', firstName: 'Claire', lastName: 'Observateur', role: 'observateur_pi' },
  { email: 'analyste@demo.ga', password: 'Demo2025!', firstName: 'Thomas', lastName: 'Analyste', role: 'analyste' },
  { email: 'ministre@demo.ga', password: 'Demo2025!', firstName: 'Honorable', lastName: 'Ministre', role: 'ministre' },
  { email: 'admin@demo.ga', password: 'Demo2025!', firstName: 'Super', lastName: 'Admin', role: 'admin' },
]

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

    const results = []

    for (const account of demoAccounts) {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUser?.users?.some(u => u.email === account.email)

      if (!userExists) {
        // Create user
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.firstName,
            last_name: account.lastName
          }
        })

        if (userError) {
          results.push({ email: account.email, status: 'error', message: userError.message })
          continue
        }

        // Assign role using the helper function
        const { error: roleError } = await supabaseAdmin.rpc('assign_demo_role', {
          user_email: account.email,
          user_role: account.role
        })

        if (roleError) {
          results.push({ email: account.email, status: 'partial', message: `User created but role assignment failed: ${roleError.message}` })
        } else {
          results.push({ email: account.email, status: 'created', role: account.role })
        }
      } else {
        results.push({ email: account.email, status: 'exists' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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
