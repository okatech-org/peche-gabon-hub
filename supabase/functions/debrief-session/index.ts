import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    console.log(`Generating debrief for session ${sessionId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch messages from session
    const { data: msgs, error } = await supabase
      .from("conversation_messages")
      .select("role,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!msgs || msgs.length === 0) {
      throw new Error('No messages found for this session');
    }

    const debriefPrompt = `Rédigez un débrief synthétique pour le Ministre de la Pêche et de l'Économie Maritime du Gabon.

Format requis:
- 3 à 6 puces avec faits clés et actions proposées
- 1 court paragraphe "Risques / Points de vigilance"
- 1 liste "Prochaines étapes" (2-4 items)

Style : direct, orienté décision. Pas d'auto-références.`;

    console.log(`Calling OpenAI with ${msgs.length} messages`);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${OPENAI_API_KEY}` 
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { 
            role: "system", 
            content: "Vous êtes un rédacteur de débrief décisionnel pour le Ministre de la Pêche et de l'Économie Maritime." 
          },
          { 
            role: "user", 
            content: debriefPrompt + "\n\nHistorique de conversation:\n" + JSON.stringify(msgs, null, 2)
          }
        ],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`OpenAI API error: ${res.status} - ${error}`);
    }

    const json = await res.json();
    const debrief = json.choices?.[0]?.message?.content ?? "";

    console.log('Debrief generated successfully');

    // Update session with debrief
    await supabase
      .from("conversation_sessions")
      .update({ 
        memory_summary: debrief,
        memory_updated_at: new Date().toISOString() 
      })
      .eq("id", sessionId);

    return new Response(
      JSON.stringify({ debrief }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating debrief:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
