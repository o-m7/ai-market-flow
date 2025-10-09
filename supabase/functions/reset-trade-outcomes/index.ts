import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Reset all trade outcomes to start fresh tracking
 * This will clear outcome, outcome_price, outcome_time, target_hit, hours_to_outcome, pnl_percentage, checked_at
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[reset-trade-outcomes] Starting trade outcome reset...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset all trades that have outcomes
    const { data: updatedTrades, error } = await supabase
      .from('trade_analyses')
      .update({
        outcome: null,
        outcome_price: null,
        outcome_time: null,
        target_hit: null,
        hours_to_outcome: null,
        pnl_percentage: null,
        checked_at: null
      })
      .not('outcome', 'is', null)
      .select('id, symbol, created_at');

    if (error) {
      console.error('[reset-trade-outcomes] Error resetting trades:', error);
      throw error;
    }

    const resetCount = updatedTrades?.length || 0;
    console.log(`[reset-trade-outcomes] Successfully reset ${resetCount} trades`);

    return new Response(JSON.stringify({
      success: true,
      message: `Reset ${resetCount} trade outcomes`,
      resetCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[reset-trade-outcomes] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
