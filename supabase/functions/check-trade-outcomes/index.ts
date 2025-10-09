import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[check-trade-outcomes] Starting trade outcome check...');
    
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get polygon API key
    const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
    if (!polygonApiKey) {
      throw new Error('POLYGON_API_KEY not configured');
    }

    // Find analyses that are pending and were created more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: pendingAnalyses, error: fetchError } = await supabase
      .from('trade_analyses')
      .select('*')
      .or('outcome.is.null,outcome.eq.PENDING')
      .lt('created_at', oneHourAgo)
      .order('created_at', { ascending: true })
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('[check-trade-outcomes] Error fetching analyses:', fetchError);
      throw fetchError;
    }

    console.log(`[check-trade-outcomes] Found ${pendingAnalyses?.length || 0} pending analyses to check`);

    if (!pendingAnalyses || pendingAnalyses.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pending analyses to check',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    let targetHits = 0;
    let stopHits = 0;
    let expired = 0;

    for (const analysis of pendingAnalyses) {
      try {
        console.log(`[check-trade-outcomes] Checking analysis ${analysis.id} for ${analysis.symbol}`);
        
        // Get candles from analysis creation time to now (max 7 days)
        const createdTime = new Date(analysis.created_at).getTime();
        const nowTime = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        // If more than 7 days old, mark as expired
        if (nowTime - createdTime > sevenDaysMs) {
          await supabase
            .from('trade_analyses')
            .update({
              outcome: 'EXPIRED',
              checked_at: new Date().toISOString()
            })
            .eq('id', analysis.id);
          
          expired++;
          processed++;
          console.log(`[check-trade-outcomes] Analysis ${analysis.id} expired (>7 days old)`);
          continue;
        }

        // Fetch price data from creation time to now
        let symbol = analysis.symbol;
        const marketType = (analysis.market || '').toUpperCase();
        
        console.log(`[check-trade-outcomes] DEBUG: analysis.market="${analysis.market}", marketType="${marketType}", original symbol="${symbol}"`);
        
        if (marketType === 'CRYPTO') {
          symbol = `X:${analysis.symbol.replace('/', '')}`;
          console.log(`[check-trade-outcomes] DEBUG: Converted to CRYPTO symbol: ${symbol}`);
        } else if (marketType === 'FOREX') {
          symbol = `C:${analysis.symbol}`;
          console.log(`[check-trade-outcomes] DEBUG: Converted to FOREX symbol: ${symbol}`);
        } else {
          console.log(`[check-trade-outcomes] DEBUG: Using stock symbol as-is: ${symbol}`);
        }
        
        const timeframe = analysis.timeframe || '60m';
        
        // Map timeframe to Polygon format
        let multiplier = 1;
        let timespan = 'hour';
        if (timeframe === '1m') { multiplier = 1; timespan = 'minute'; }
        else if (timeframe === '5m') { multiplier = 5; timespan = 'minute'; }
        else if (timeframe === '15m') { multiplier = 15; timespan = 'minute'; }
        else if (timeframe === '30m') { multiplier = 30; timespan = 'minute'; }
        else if (timeframe === '60m' || timeframe === '1h') { multiplier = 1; timespan = 'hour'; }
        else if (timeframe === '4h') { multiplier = 4; timespan = 'hour'; }
        else if (timeframe === '1d') { multiplier = 1; timespan = 'day'; }

        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${createdTime}/${nowTime}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonApiKey}`;
        
        console.log(`[check-trade-outcomes] Fetching price data: ${url.replace(polygonApiKey, '[API_KEY]')}`);
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.results || data.results.length === 0) {
          console.warn(`[check-trade-outcomes] No price data for ${analysis.symbol}`);
          continue;
        }

        // Check each candle to see if target or stop was hit
        const candles = data.results;
        let outcome = null;
        let outcomePrice = null;
        let outcomeTime = null;
        let targetHit = null;
        let hoursToOutcome = null;

        for (const candle of candles) {
          const candleTime = new Date(candle.t);
          
          // For LONG trades
          if (analysis.direction.toLowerCase() === 'long') {
            // Check if stop was hit (low went below stop)
            if (candle.l <= analysis.stop_price) {
              outcome = 'STOP_HIT';
              outcomePrice = analysis.stop_price;
              outcomeTime = candleTime.toISOString();
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            }
            
            // Check if any target was hit (high went above target)
            if (analysis.target3_price && candle.h >= analysis.target3_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target3_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 3;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            } else if (analysis.target2_price && candle.h >= analysis.target2_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target2_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 2;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            } else if (analysis.target1_price && candle.h >= analysis.target1_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target1_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 1;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            }
          } 
          // For SHORT trades
          else if (analysis.direction.toLowerCase() === 'short') {
            // Check if stop was hit (high went above stop)
            if (candle.h >= analysis.stop_price) {
              outcome = 'STOP_HIT';
              outcomePrice = analysis.stop_price;
              outcomeTime = candleTime.toISOString();
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            }
            
            // Check if any target was hit (low went below target)
            if (analysis.target3_price && candle.l <= analysis.target3_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target3_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 3;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            } else if (analysis.target2_price && candle.l <= analysis.target2_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target2_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 2;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            } else if (analysis.target1_price && candle.l <= analysis.target1_price) {
              outcome = 'TARGET_HIT';
              outcomePrice = analysis.target1_price;
              outcomeTime = candleTime.toISOString();
              targetHit = 1;
              hoursToOutcome = (candle.t - createdTime) / (1000 * 60 * 60);
              break;
            }
          }
        }

        // If outcome determined, update database
        if (outcome) {
          // Calculate PnL percentage
          let pnlPercentage = 0;
          if (analysis.direction.toLowerCase() === 'long') {
            pnlPercentage = ((outcomePrice - analysis.entry_price) / analysis.entry_price) * 100;
          } else {
            pnlPercentage = ((analysis.entry_price - outcomePrice) / analysis.entry_price) * 100;
          }

          await supabase
            .from('trade_analyses')
            .update({
              outcome,
              outcome_price: outcomePrice,
              outcome_time: outcomeTime,
              target_hit: targetHit,
              hours_to_outcome: hoursToOutcome,
              pnl_percentage: pnlPercentage,
              checked_at: new Date().toISOString()
            })
            .eq('id', analysis.id);

          if (outcome === 'TARGET_HIT') targetHits++;
          else if (outcome === 'STOP_HIT') stopHits++;
          
          console.log(`[check-trade-outcomes] Analysis ${analysis.id}: ${outcome} at ${outcomePrice} (${pnlPercentage.toFixed(2)}% PnL)`);
        } else {
          // Still pending, update checked_at
          await supabase
            .from('trade_analyses')
            .update({
              checked_at: new Date().toISOString()
            })
            .eq('id', analysis.id);
          
          console.log(`[check-trade-outcomes] Analysis ${analysis.id}: Still PENDING`);
        }

        processed++;
      } catch (error) {
        console.error(`[check-trade-outcomes] Error processing analysis ${analysis.id}:`, error);
      }
    }

    console.log(`[check-trade-outcomes] Completed. Processed: ${processed}, Targets: ${targetHits}, Stops: ${stopHits}, Expired: ${expired}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      targetHits,
      stopHits,
      expired
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[check-trade-outcomes] Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to check trade outcomes'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
