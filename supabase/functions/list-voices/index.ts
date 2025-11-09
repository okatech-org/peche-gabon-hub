import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ELEVEN_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ELEVEN_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('Fetching voices from ElevenLabs...');
    
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVEN_API_KEY }
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API error: ${res.status}`);
    }

    const json = await res.json();
    
    // Return only useful fields
    const voices = (json?.voices ?? []).map((v: any) => ({ 
      id: v.voice_id, 
      name: v.name, 
      labels: v.labels,
      preview_url: v.preview_url
    }));

    console.log(`Found ${voices.length} voices`);

    return new Response(
      JSON.stringify({ voices }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching voices:', error);
    
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
