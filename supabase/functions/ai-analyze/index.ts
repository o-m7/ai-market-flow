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
    let openaiApiKey =
      Deno.env.get('OPENAI_API_KEY') ||
      Deno.env.get('OPEN_AI_API_KEY') ||
      Deno.env.get('OPENAI') ||
      Deno.env.get('OPENAI_KEY') || '';

    const headerKey = req.headers.get('x-openai-api-key') || req.headers.get('x-openai-key');
    if (!openaiApiKey && headerKey) openaiApiKey = headerKey as string;
    console.log('OpenAI API Key available:', !!openaiApiKey);

    // Parse body early to support debug mode without requiring an API key
    const body = await req.json().catch(() => ({}));
    const { symbol, timeframe, market, candles, debug } = body || {};
    const bars = sanitizeCandles(candles);

    // Debug endpoint: returns diagnostic info without calling OpenAI
    if (debug === true) {
      const envKeyRaw =
        Deno.env.get('OPENAI_API_KEY') ||
        Deno.env.get('OPEN_AI_API_KEY') ||
        Deno.env.get('OPENAI') ||
        Deno.env.get('OPENAI_KEY') || '';

      const payload = {
        envKeyPresent: !!envKeyRaw,
        headerKeyPresent: !!headerKey,
        keyThatWillBeUsedPresent: !!openaiApiKey,
        symbol: symbol || null,
        timeframe: timeframe || null,
        candleCount: bars.length,
        firstBar: bars[0] || null,
        lastBar: bars[bars.length - 1] || null,
        analyzed_at: new Date().toISOString(),
      };
      console.log('[ai-analyze] Debug payload:', payload);
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const client = new OpenAI({ apiKey: openaiApiKey });

    if (!symbol || bars.length < 20) {
      return new Response(JSON.stringify({ error: "symbol and >=20 candles required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log(`Analyzing ${symbol} (${timeframe}) with ${bars.length} candles`);

    const prompt =
      "You are a professional technical analyst. " +
      "Use price action plus EMA20/50/200, RSI, MACD, ATR, Bollinger conceptually. " +
      "Be concise and numeric. Return ONLY valid JSON to the schema.\n" +
      "Columns: t,o,h,l,c,v (t=epoch seconds).\n" +
      "Data:\n" + JSON.stringify(bars.slice(-100)); // Use less data for faster processing

    const r = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const out = r.choices?.[0]?.message?.content || "";
    let parsed: any = null;
    try {
      parsed = typeof out === "string" ? JSON.parse(out) : out;
    } catch (_e) {
      const start = out.indexOf('{');
      const end = out.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(out.slice(start, end + 1));
        } catch (e2) {
          console.error("[ai-analyze] JSON parse failed slice:", out.slice(0, 200));
          return new Response(JSON.stringify({ error: "Model did not return valid JSON" }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        console.error("[ai-analyze] No JSON in response:", out);
        return new Response(JSON.stringify({ error: "Model did not return JSON" }), {
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? 500;
    const body = (e?.response && typeof e.response.text === "function")
      ? await e.response.text().catch(() => "")
      : (e?.message || "");
    console.error("[ai-analyze] OpenAI error", status, body);
    return new Response(JSON.stringify({ error: body || "OpenAI call failed" }), { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
