import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key, x-openai-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const analysisSchema = {
  name: "TaResult",
  schema: {
    type: "object",
    properties: {
      symbol: { type: "string" },
      timeframe: { type: "string" },
      summary: { type: "string" },
      outlook: { type: "string", enum: ["bullish","bearish","neutral"] },
      levels: {
        type: "object",
        properties: {
          support: { type: "array", items: { type: "number" } },
          resistance: { type: "array", items: { type: "number" } },
          vwap: { type: ["number","null"] }
        },
        required: ["support","resistance"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long","short","none"] },
          entry: { type: "number" },
          stop: { type: "number" },
          targets: { type: "array", items: { type: "number" } },
          rationale: { type: "string" }
        },
        required: ["direction","rationale"]
      },
      confidence: { type: "number" },
      risks: { type: "string" },
      json_version: { type: "string" }
    },
    required: ["summary","outlook","levels","trade_idea","confidence","risks"]
  },
  strict: true
};

function sanitizeCandles(raw: any[], max = 200) {
  const bars = (raw ?? []).slice(-max).map((b) => ({
    t: Number(b.t), o: Number(b.o), h: Number(b.h),
    l: Number(b.l), c: Number(b.c), v: Number(b.v ?? 0)
  })).filter((b) =>
    Number.isFinite(b.t) && Number.isFinite(b.o) &&
    Number.isFinite(b.h) && Number.isFinite(b.l) &&
    Number.isFinite(b.c) && Number.isFinite(b.v)
  );
  return bars;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body first
    const body = await req.json().catch(() => ({}));
    const { symbol, timeframe, market, candles, debug } = body || {};
    const bars = sanitizeCandles(candles);

    // Debug endpoint
    if (debug === true) {
      const envKeys = {
        OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
        OPEN_AI_API_KEY: !!Deno.env.get('OPEN_AI_API_KEY'),
        OPENAI: !!Deno.env.get('OPENAI'),
        OPENAI_KEY: !!Deno.env.get('OPENAI_KEY'),
      };
      const headerKey = req.headers.get('x-openai-api-key') || req.headers.get('x-openai-key');
      
      return new Response(JSON.stringify({
        envKeys,
        headerKeyPresent: !!headerKey,
        symbol: symbol || null,
        timeframe: timeframe || null,
        candleCount: bars.length,
        analyzed_at: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OpenAI API key - try multiple sources
    let openaiApiKey =
      Deno.env.get('OPENAI_API_KEY') ||
      Deno.env.get('OPEN_AI_API_KEY') ||
      Deno.env.get('OPENAI') ||
      Deno.env.get('OPENAI_KEY') || '';

    // Allow header override
    const headerKey = req.headers.get('x-openai-api-key') || req.headers.get('x-openai-key');
    if (headerKey) openaiApiKey = headerKey as string;

    console.log('[ai-analyze] Key sources:', {
      env_OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
      header_override: !!headerKey,
      final_key_available: !!openaiApiKey
    });

    if (!openaiApiKey) {
      console.error('[ai-analyze] No OpenAI API key found in environment or headers');
      return new Response(JSON.stringify({ 
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase secrets or provide via x-openai-api-key header." 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!symbol || bars.length < 20) {
      return new Response(JSON.stringify({ error: "symbol and >=20 candles required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ai-analyze] Starting AI analysis for ${symbol} (${timeframe}) with ${bars.length} candles`);

    const client = new OpenAI({ apiKey: openaiApiKey });

    const prompt =
      "You are a professional technical analyst. " +
      "Analyze the provided OHLCV data using technical indicators like RSI, MACD, moving averages, and price patterns. " +
      "Provide a comprehensive analysis with specific entry/exit levels and rationale. " +
      "Return ONLY valid JSON matching this schema:\n" +
      JSON.stringify({
        summary: "string - detailed technical analysis",
        outlook: "bullish|bearish|neutral", 
        levels: {
          support: ["number array"],
          resistance: ["number array"],
          vwap: "number or null"
        },
        trade_idea: {
          direction: "long|short|none",
          entry: "number",
          stop: "number", 
          targets: ["number array"],
          rationale: "string"
        },
        confidence: "number 0-1",
        risks: "string"
      }) + "\n\nOHLCV Data (t=timestamp_ms,o=open,h=high,l=low,c=close,v=volume):\n" + 
      JSON.stringify(bars.slice(-150));

    console.log('[ai-analyze] Calling OpenAI API...');
    const r = await client.chat.completions.create({
      model: "gpt-5-2025-08-07",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const out = r.choices?.[0]?.message?.content || "";
    console.log('[ai-analyze] OpenAI response length:', out.length);

    let parsed: any = null;
    try {
      parsed = JSON.parse(out);
    } catch (e1) {
      console.warn('[ai-analyze] JSON parse failed, attempting cleanup');
      const start = out.indexOf('{');
      const end = out.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(out.slice(start, end + 1));
        } catch (e2) {
          console.error('[ai-analyze] JSON cleanup failed:', out.slice(0, 200));
          return new Response(JSON.stringify({ error: "AI returned invalid JSON format" }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        console.error('[ai-analyze] No valid JSON found in response');
        return new Response(JSON.stringify({ error: "AI did not return JSON" }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    const result = { 
      ...parsed, 
      symbol, 
      timeframe, 
      json_version: "1.0.0",
      analyzed_at: new Date().toISOString(),
      candles_analyzed: bars.length
    };

    console.log('[ai-analyze] Analysis completed successfully');
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[ai-analyze] Error:', e);
    const rawStatus = e?.status ?? e?.response?.status ?? 500;
    let status = rawStatus;
    if (rawStatus === 401 || rawStatus === 403) status = 401;
    else if (rawStatus >= 500) status = 502;

    const body = (e?.response && typeof e.response.text === "function")
      ? await e.response.text().catch(() => "")
      : (e?.message || "");

    return new Response(JSON.stringify({ error: body || "Analysis failed" }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
