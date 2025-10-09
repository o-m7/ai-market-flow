import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Trigger function to call check-trade-outcomes periodically
 * This should be invoked via cron or manually to check pending trades
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[trigger-trade-checks] Starting automated trade outcome check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Call the check-trade-outcomes function
    const response = await fetch(`${supabaseUrl}/functions/v1/check-trade-outcomes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[trigger-trade-checks] Error calling check-trade-outcomes:', errorText);
      throw new Error(`check-trade-outcomes failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[trigger-trade-checks] Check complete:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'Trade checks triggered successfully',
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[trigger-trade-checks] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
