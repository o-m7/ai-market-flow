import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!polygonApiKey) {
      return new Response(JSON.stringify({
        error: 'POLYGON_API_KEY not configured',
        hasApiKey: false
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(req.url);
    const sym = searchParams.get('symbol') || 'AAPL';
    const route = searchParams.get('route');
    
    // NEW: /inputs-for-ai route for AI debugging
    if (route === 'inputs-for-ai') {
      return await handleAIInputsDebug(sym);
    }
    
    console.log(`Debug comparison for ${sym}`);

    const urlPrev = `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${polygonApiKey}`;
    const urlSnap = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${polygonApiKey}`;

    const [p, s] = await Promise.all([
      fetch(urlPrev, { headers: { "Cache-Control": "no-store" } }),
      fetch(urlSnap, { headers: { "Cache-Control": "no-store" } })
    ]);

    let prev: any = {};
    let snap: any = {};

    try {
      prev = await p.json();
    } catch (e) {
      console.error("Failed to parse prev response:", e);
    }

    try {
      snap = await s.json();
    } catch (e) {
      console.error("Failed to parse snapshot response:", e);
    }

    const result = {
      symbol: sym,
      okPrev: p.ok,
      okSnap: s.ok,
      hasApiKey: Boolean(polygonApiKey),
      prevClose: prev?.results?.[0]?.c ?? null,
      prevTimestampUTC: prev?.results?.[0]?.t ? new Date(prev.results[0].t).toISOString() : null,
      lastTradePrice: snap?.results?.last_trade?.price ?? snap?.results?.lastTrade?.p ?? null,
      lastTradeTimestampUTC: snap?.results?.last_trade?.sip_timestamp 
        ? new Date(snap.results.last_trade.sip_timestamp).toISOString() 
        : snap?.results?.lastTrade?.t 
        ? new Date(snap.results.lastTrade.t).toISOString() 
        : null,
      note: "Equities may be delayed on your plan.",
      rawResponses: {
        prev: p.ok ? prev : `Error ${p.status}`,
        snap: s.ok ? snap : `Error ${s.status}`
      }
    };

    console.log('Debug result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-debug function:', error);
    
    return new Response(JSON.stringify({
      error: error.message || "debug_failed",
      hasApiKey: Boolean(polygonApiKey)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// NEW: Debug handler for AI inputs
async function handleAIInputsDebug(symbol: string) {
  try {
    console.log(`[DEBUG] Generating AI inputs debug for ${symbol}`);
    
    // Get enriched features
    const featuresResponse = await fetch('http://localhost:54321/functions/v1/polygon-market-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        market: 'forex',
        tf: '1h'
      })
    });
    
    const features = featuresResponse.ok ? await featuresResponse.json() : null;
    
    // Get news risk
    const [base, quote] = symbol.split('/');
    const newsResponse = await fetch('http://localhost:54321/functions/v1/news-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base: base || 'USD',
        quote: quote || 'USD',
        lookback_minutes: 30
      })
    });
    
    const news = newsResponse.ok ? await newsResponse.json() : null;
    
    // Construct exact payload that would be sent to ai-analyze
    const aiPayload = {
      symbol,
      timeframe: '1h',
      market: 'forex',
      features,
      news,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      debug_type: 'ai_inputs',
      symbol,
      payload: aiPayload,
      features_available: !!features,
      news_available: !!news,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[DEBUG] AI inputs error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      debug_type: 'ai_inputs',
      symbol
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}