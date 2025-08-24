import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key, x-openai-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const analysisSchema = {
  name: "InstitutionalTaResult",
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      action: { type: "string", enum: ["buy","sell","hold"] },
      action_text: { type: "string" },
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
      fibonacci: {
        type: "object",
        properties: {
          pivot_high: { type: "number" },
          pivot_low: { type: "number" },
          retracements: {
            type: "object",
            properties: {
              "23.6": { type: "number" },
              "38.2": { type: "number" },
              "50.0": { type: "number" },
              "61.8": { type: "number" },
              "78.6": { type: "number" }
            }
          },
          extensions: {
            type: "object", 
            properties: {
              "127.2": { type: "number" },
              "161.8": { type: "number" }
            }
          },
          direction: { type: "string", enum: ["up","down"] }
        },
        required: ["pivot_high","pivot_low","retracements","extensions","direction"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long","short","none"] },
          entry: { type: "number" },
          stop: { type: "number" },
          targets: { type: "array", items: { type: "number" } },
          rationale: { type: "string" },
          time_horizon: { type: "string", enum: ["scalp","intraday","swing","position"] },
          setup_type: { type: "string", enum: ["breakout","pullback","mean_reversion","range","other"] },
          rr_estimate: { type: "number" }
        },
        required: ["direction","entry","stop","targets","rationale","time_horizon","setup_type","rr_estimate"]
      },
      technical: {
        type: "object",
        properties: {
          ema20: { type: "number" },
          ema50: { type: "number" },
          ema200: { type: "number" },
          rsi14: { type: "number" },
          macd: {
            type: "object",
            properties: {
              line: { type: "number" },
              signal: { type: "number" },
              hist: { type: "number" }
            }
          },
          atr14: { type: "number" },
          bb: {
            type: "object",
            properties: {
              mid: { type: "number" },
              upper: { type: "number" },
              lower: { type: "number" }
            }
          }
        },
        required: ["ema20","ema50","ema200","rsi14","macd","atr14","bb"]
      },
      confidence_model: { type: "number" },
      confidence_calibrated: { type: "number" },
      evidence: { type: "array", items: { type: "string" } },
      risks: { type: "string" },
      timeframe_profile: {
        type: "object",
        properties: {
          scalp: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } }
            }
          },
          intraday: {
            type: "object", 
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } }
            }
          },
          swing: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } }
            }
          }
        }
      },
      json_version: { type: "string" }
    },
    required: ["summary","action","action_text","outlook","levels","fibonacci","trade_idea","technical","confidence_model","confidence_calibrated","evidence","risks","timeframe_profile","json_version"]
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

    // Last-resort: scan all env vars for any OPENAI-like key
    if (!openaiApiKey) {
      try {
        // @ts-ignore Deno.env.toObject may not be typed in some runtimes
        const envObj = (Deno.env as any)?.toObject?.() || {};
        for (const [k, v] of Object.entries(envObj)) {
          const K = k.toUpperCase();
          if ((K.includes('OPENAI') && K.includes('KEY')) || K === 'OPENAI') {
            if (typeof v === 'string' && v.trim()) {
              openaiApiKey = v.trim();
              console.log('[ai-analyze] Found OpenAI key in env var:', k);
              break;
            }
          }
        }
      } catch (scanErr) {
        console.log('[ai-analyze] Env scan not available:', (scanErr as any)?.message || scanErr);
      }
    }

    console.log('[ai-analyze] Key sources:', {
      env_OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
      header_override: !!headerKey,
      scanned_any: !!openaiApiKey,
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

    const institutionalPrompt = `You are an institutional-grade technical analysis engine.
Use only the numeric data provided by the backend (symbol, timeframe, OHLCV candles, and any precomputed indicators).
Be deterministic and consistent: given the same inputs, return the same outputs.
Return ONLY JSON that matches the schema below — no extra prose.

Requirements

Action words & decision
Must produce an explicit decision and wording that starts with BUY, SELL, or HOLD.
Use both directional terms and trader lingo: "action": "buy|sell|hold", "trade_idea.direction": "long|short|none", and an action_text that begins with BUY/SELL/HOLD followed by a one-line reason (e.g., BUY — Pullback to EMA50 with bullish RSI divergence).

Detailed, efficient, number-driven analysis
Base everything on the actual numbers provided. Never invent data.
Include price action structure (HH/HL or LH/LL), EMA(20/50/200), SMA(50/200), RSI(14), MACD (line/signal/cross), ATR(14), Bollinger(20,2), VWAP (if provided), and volume cues (if provided).

Fibonacci: compute retracements 23.6/38.2/50/61.8/78.6 and extensions 127.2/161.8 from the most recent valid swing:
Identify the swing using the last N bars for the current timeframe:
scalp (1m–15m): N=100,
intraday (30m–4h): N=150, 
swing (1D–1W): N=200.
For an up-swing: pivotLow = min(low), pivotHigh = max(high) over N; retracements off that move.
For a down-swing: pivotHigh then pivotLow similarly.

Entries/stops/targets must be numeric, realistic, and tied to ATR, recent highs/lows, Fibs, or clear S/R.
Provide why with concise bullet-style rationale that references concrete levels (e.g., "Close > EMA200 and EMA20>EMA50; RSI 62; MACD cross up; ATR supports 1.2× risk with 2.0× target").

Confidence that's real (no 1%)
Output two fields:
confidence_model (0–100): your internal estimate based on signals.
confidence_calibrated (0–100): apply this rubric to avoid trivial values:
Start at 50.
+8–12 each independent confluence (trend alignment across EMAs; momentum confirmation via RSI>60 or MACD cross with rising histogram; breakout close beyond structure; bounce off EMA50/200 with confirming candle; location vs. Bollinger bands). Max +30.
−10 if conflicting signals (e.g., price > EMA20 but < EMA200).
−10–20 if ATR is elevated vs. 30-bar median and stop would exceed 1×ATR.
Cap at 88 unless backtest metadata explicitly authorizes 90–99.
Never default to 1%. If mixed, return 55–65 or "action":"hold".

Consistency
Deterministic decisions: do not use randomness.
Given identical inputs, produce identical outputs (same levels ± rounding).
Prefer rule-based selection of swings/levels per the rules above.

Timeframe-aware profiles
Tailor analysis to the provided timeframe and produce a profile for trader types:
scalp (1–15m): tighter stops (0.5–1.0× ATR), smaller targets (1.0–1.5× ATR), quick invalidation.
intraday (30m–4h): stops ~1.0–1.5× ATR, targets 1.5–2.5× ATR.
swing (1D–1W): stops ~1.5–2.5× ATR, targets 2–4× ATR; give Fib confluence with higher-TF EMAs/SR.
If only one timeframe is provided, still include a short note on how the setup scales to other horizons.

Symbol: ${symbol}
Timeframe: ${timeframe}
Market: ${market}

OHLCV Data (t=timestamp_ms,o=open,h=high,l=low,c=close,v=volume):
${JSON.stringify(bars.slice(-200))}

Return ONLY JSON matching this exact schema:
{
  "summary": "string",
  "action": "buy|sell|hold",
  "action_text": "string starting with BUY/SELL/HOLD",
  "outlook": "bullish|bearish|neutral",
  "levels": {
    "support": [number],
    "resistance": [number],
    "vwap": null
  },
  "fibonacci": {
    "pivot_high": number,
    "pivot_low": number,
    "retracements": {
      "23.6": number,
      "38.2": number,
      "50.0": number,
      "61.8": number,
      "78.6": number
    },
    "extensions": {
      "127.2": number,
      "161.8": number
    },
    "direction": "up|down"
  },
  "trade_idea": {
    "direction": "long|short|none",
    "entry": number,
    "stop": number,
    "targets": [number],
    "rationale": "string with bullet-like reasons",
    "time_horizon": "scalp|intraday|swing|position",
    "setup_type": "breakout|pullback|mean_reversion|range|other",
    "rr_estimate": number
  },
  "technical": {
    "ema20": number,
    "ema50": number,
    "ema200": number,
    "rsi14": number,
    "macd": { "line": number, "signal": number, "hist": number },
    "atr14": number,
    "bb": { "mid": number, "upper": number, "lower": number }
  },
  "confidence_model": number,
  "confidence_calibrated": number,
  "evidence": ["list confluences used"],
  "risks": "string (e.g., news risk, mixed signals, high ATR)",
  "timeframe_profile": {
    "scalp": { "entry": number, "stop": number, "targets": [number] },
    "intraday": { "entry": number, "stop": number, "targets": [number] },
    "swing": { "entry": number, "stop": number, "targets": [number] }
  },
  "json_version": "1.0.0"
}`;

    console.log('[ai-analyze] Calling OpenAI API with institutional-grade prompt...');
    const r = await client.chat.completions.create({
      model: "gpt-5-2025-08-07",
      messages: [
        { 
          role: "system", 
          content: "You are an institutional-grade technical analysis engine. Analyze OHLCV data using strict numerical methods and return ONLY valid JSON with no additional text, explanations, or formatting. Be deterministic and consistent." 
        },
        { 
          role: "user", 
          content: institutionalPrompt 
        }
      ],
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const out = r.choices?.[0]?.message?.content || "";
    console.log('[ai-analyze] OpenAI response length:', out.length);
    console.log('[ai-analyze] OpenAI raw response:', out.slice(0, 500) + (out.length > 500 ? '...' : ''));

    let parsed: any = null;
    try {
      parsed = JSON.parse(out);
      console.log('[ai-analyze] JSON parsed successfully');
    } catch (e1) {
      console.warn('[ai-analyze] JSON parse failed, attempting cleanup');
      console.error('[ai-analyze] Parse error:', e1.message);
      const start = out.indexOf('{');
      const end = out.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          const jsonStr = out.slice(start, end + 1);
          console.log('[ai-analyze] Attempting to parse extracted JSON:', jsonStr.slice(0, 200));
          parsed = JSON.parse(jsonStr);
          console.log('[ai-analyze] JSON cleanup succeeded');
        } catch (e2) {
          console.error('[ai-analyze] JSON cleanup failed:', e2.message);
          console.error('[ai-analyze] Problematic content:', out.slice(0, 300));
          return new Response(JSON.stringify({ 
            error: "AI returned invalid JSON format",
            details: out.slice(0, 200),
            parseError: e2.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        console.error('[ai-analyze] No valid JSON found in response');
        console.error('[ai-analyze] Full response:', out);
        return new Response(JSON.stringify({ 
          error: "AI did not return JSON",
          response: out.slice(0, 200)
        }), {
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
