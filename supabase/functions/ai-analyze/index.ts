import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const client = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function sanitizeCandles(raw: any[], max = 400) {
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
    const { symbol, timeframe, market, candles } = await req.json();
    const bars = sanitizeCandles(candles);
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
      "Data:\n" + JSON.stringify(bars);

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,

      // ✅ NEW PARAM (replaces deprecated response_format)
      text_format: {
        type: "json_schema",
        json_schema: analysisSchema
      }
      // In some SDKs this may be nested as:
      // text: { format: { type: "json_schema", json_schema: analysisSchema } }
    });

    const out =
      (r as any).output_text ??
      (r as any).output?.[0]?.content?.[0]?.text ??
      (r as any).content?.[0]?.text ??
      r;

    const parsed = typeof out === "string" ? JSON.parse(out) : out;
    
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
