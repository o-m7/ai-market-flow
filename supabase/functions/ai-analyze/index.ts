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
      console.warn('[ai-analyze] OPENAI_API_KEY missing - using local heuristic analysis');
      // Heuristic fallback using provided candles (no external API)
      const closes = bars.map(b => b.c);
      const highs = bars.map(b => b.h);
      const lows = bars.map(b => b.l);
      const last = closes[closes.length - 1];
      const sma = (n: number) => closes.slice(-n).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(n, closes.length));
      const ema = (n: number) => {
        const k = 2 / (n + 1);
        let emaVal = closes[0];
        for (let i = 1; i < closes.length; i++) emaVal = closes[i] * k + emaVal * (1 - k);
        return emaVal;
      };
      const rsi = (period = 14) => {
        let gains = 0, losses = 0;
        for (let i = closes.length - period; i < closes.length; i++) {
          const diff = closes[i] - closes[i - 1];
          if (diff >= 0) gains += diff; else losses -= diff;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
      };
      const pickLevels = (arr: number[], lookback = 30, count = 3, mode: 'min'|'max' = 'min') => {
        const segment = arr.slice(-lookback);
        const levels: number[] = [];
        for (let i = 0; i < count; i++) {
          if (!segment.length) break;
          const val = mode === 'min' ? Math.min(...segment) : Math.max(...segment);
          levels.push(val);
          // remove a neighborhood around the found level to avoid duplicates
          const idx = segment.indexOf(val);
          const radius = Math.max(1, Math.floor(lookback / (count * 3)));
          segment.splice(Math.max(0, idx - radius), radius * 2 + 1);
        }
        return levels.sort((a,b) => a - b);
      };
      const ma20 = sma(20), ma50 = sma(50), ma200 = sma(200);
      const ema20 = ema(20);
      const curRsi = rsi(14);
      const supports = pickLevels(lows, 60, 3, 'min');
      const resistances = pickLevels(highs, 60, 3, 'max');

      let outlook: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (last > ma50 && ma50 >= ma200) outlook = 'bullish';
      else if (last < ma50 && ma50 <= ma200) outlook = 'bearish';

      const direction: 'long' | 'short' | 'none' = outlook === 'bullish' ? 'long' : outlook === 'bearish' ? 'short' : 'none';
      const entry = last;
      const stop = direction === 'long' ? last * 0.98 : direction === 'short' ? last * 1.02 : last;
      const targets = direction === 'long' ? [last * 1.02, last * 1.04] : direction === 'short' ? [last * 0.98, last * 0.96] : [];

      const result = {
        symbol,
        timeframe,
        summary: `Local analysis: price ${last.toFixed(2)} vs MA20 ${ma20.toFixed(2)}, MA50 ${ma50.toFixed(2)}, MA200 ${ma200.toFixed(2)}. RSI ${curRsi.toFixed(1)}.`,
        outlook,
        levels: { support: supports, resistance: resistances, vwap: null },
        trade_idea: { direction, entry, stop, targets, rationale: 'Heuristic analysis used (no OpenAI key). Manage risk accordingly.' },
        confidence: Math.max(0.3, Math.min(0.75, Math.abs((last - ma50) / (ma50 || 1)) + (Math.abs(curRsi - 50) / 100))),
        risks: 'This is a heuristic estimate without AI; validate with your strategy.',
        json_version: '1.0.0',
        analyzed_at: new Date().toISOString(),
        candles_analyzed: bars.length
      } as const;

      return new Response(JSON.stringify(result), {
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
    const rawStatus = e?.status ?? e?.response?.status ?? 500;
    // Normalize statuses to avoid ambiguous 500/403 surfacing to clients
    // - Map 401/403 from upstream auth errors to 401
    // - Map any 5xx to 502 (bad upstream)
    let status = rawStatus;
    if (rawStatus === 401 || rawStatus === 403) status = 401;
    else if (rawStatus >= 500) status = 502;

    const body = (e?.response && typeof e.response.text === "function")
      ? await e.response.text().catch(() => "")
      : (e?.message || "");

    console.error("[ai-analyze] OpenAI error", { rawStatus, mappedStatus: status, body });
    return new Response(JSON.stringify({ error: body || "OpenAI call failed" }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
