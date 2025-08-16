import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('News test function called');
    
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        NEWS_API_KEY: newsApiKey ? 'Present' : 'Missing',
        OPENAI_API_KEY: openaiKey ? 'Present' : 'Missing'
      },
      function: 'news-test working correctly'
    };

    console.log('Test result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in news-test function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Test function failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});