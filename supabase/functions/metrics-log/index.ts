import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== METRICS LOG REQUEST ===');
    
    const { type, input, output, metadata } = await req.json();
    
    if (!type || !input) {
      return new Response(JSON.stringify({ 
        error: "type and input are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log the AI analysis for walk-forward evaluation
    const logEntry = {
      type, // 'ai_analysis', 'news_gate', etc.
      input: typeof input === 'string' ? input : JSON.stringify(input),
      output: typeof output === 'string' ? output : JSON.stringify(output),
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    console.log(`Logging ${type} metrics entry`);

    // Store in a simple metrics table (create if needed)
    const { data, error } = await supabase
      .from('ai_metrics_log')
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      console.error('Failed to log metrics:', error);
      
      // Don't fail the request if logging fails
      return new Response(JSON.stringify({
        logged: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      logged: true,
      entry_id: data?.id,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in metrics-log function:', error);
    
    return new Response(JSON.stringify({ 
      logged: false,
      error: error.message || 'Failed to log metrics',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});