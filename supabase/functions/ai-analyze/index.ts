import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key, x-openai-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Deterministic rules and thresholds
const THRESHOLDS = {
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,
  RSI_BULLISH_MIN: 35,
  RSI_BEARISH_MIN: 65,
  MACD_BULLISH_MIN: 0.00005,
  MACD_BEARISH_MAX: -0.00005,
  LEVEL_PROXIMITY_ATR_MULTIPLIER: 0.15,
  STOP_ATR_MULTIPLIER: 0.25,
  TARGET1_ATR_MULTIPLIER: 1,
  TARGET2_ATR_MULTIPLIER: 2,
  MIN_RR_RATIO: 1.5,
  HIGH_ATR_PERCENTILE: 0.8,
  LOW_ATR_PERCENTILE: 0.2,
  ATR_VOLATILITY_MULTIPLIER: 1.5,
  WIDE_SPREAD_PERCENTILE: 0.8,
  IMBALANCE_STRONG_BUY_MAX: 0.35,
  IMBALANCE_STRONG_SELL_MIN: 0.65,
  BASE_CONFIDENCE: 50,
  CONFLUENCE_BONUS: 10,
  MAX_CONFLUENCE_BONUS: 30,
  CONFLICT_PENALTY: 10,
  HIGH_ATR_PENALTY: 15,
  MAX_CONFIDENCE: 88
} as const;

function round5(n: number): number {
  return Number(n.toFixed(5));
}

// OpenAI Function Schema for deterministic output
const InstitutionalTaResultSchema = {
  name: "InstitutionalTaResult",
  description: "Institutional-grade technical analysis result with deterministic signals",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Brief technical analysis summary" },
      action: { type: "string", enum: ["buy", "sell", "hold"], description: "Trading action" },
      action_text: { type: "string", description: "Action description starting with BUY/SELL/HOLD" },
      outlook: { type: "string", enum: ["bullish", "bearish", "neutral"], description: "Market outlook" },
      levels: {
        type: "object",
        properties: {
          support: { type: "array", items: { type: "number" }, description: "Support levels" },
          resistance: { type: "array", items: { type: "number" }, description: "Resistance levels" },
          vwap: { type: ["number", "null"], description: "VWAP level" }
        },
        required: ["support", "resistance"]
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
            },
            required: ["23.6", "38.2", "50.0", "61.8", "78.6"]
          },
          extensions: {
            type: "object",
            properties: {
              "127.2": { type: "number" },
              "161.8": { type: "number" }
            },
            required: ["127.2", "161.8"]
          },
          direction: { type: "string", enum: ["up", "down"] }
        },
        required: ["pivot_high", "pivot_low", "retracements", "extensions", "direction"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long", "short", "none"] },
          entry: { type: "number" },
          stop: { type: "number" },
          targets: { type: "array", items: { type: "number" } },
          rationale: { type: "string" },
          time_horizon: { type: "string", enum: ["scalp", "intraday", "swing", "position"] },
          setup_type: { type: "string", enum: ["breakout", "pullback", "mean_reversion", "range", "other"] },
          rr_estimate: { type: "number" }
        },
        required: ["direction", "entry", "stop", "targets", "rationale", "time_horizon", "setup_type", "rr_estimate"]
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
            },
            required: ["line", "signal", "hist"]
          },
          atr14: { type: "number" },
          bb: {
            type: "object",
            properties: {
              mid: { type: "number" },
              upper: { type: "number" },
              lower: { type: "number" }
            },
            required: ["mid", "upper", "lower"]
          }
        },
        required: ["ema20", "ema50", "ema200", "rsi14", "macd", "atr14", "bb"]
      },
      confidence_model: { type: "number", minimum: 0, maximum: 100 },
      confidence_calibrated: { type: "number", minimum: 0, maximum: 100 },
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
            },
            required: ["entry", "stop", "targets"]
          },
          intraday: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } }
            },
            required: ["entry", "stop", "targets"]
          },
          swing: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } }
            },
            required: ["entry", "stop", "targets"]
          }
        },
        required: ["scalp", "intraday", "swing"]
      },
      json_version: { type: "string" }
    },
    required: [
      "summary", "action", "action_text", "outlook", "levels", "fibonacci", 
      "trade_idea", "technical", "confidence_model", "confidence_calibrated", 
      "evidence", "risks", "timeframe_profile", "json_version"
    ]
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { symbol, timeframe, market, features, news, debug } = body || {};

    console.log(`[ai-analyze] NEW DETERMINISTIC ANALYSIS: ${symbol} (${timeframe}, ${market})`);

    // Debug endpoint
    if (debug === true) {
      return new Response(JSON.stringify({
        hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
        symbol: symbol || null,
        timeframe: timeframe || null,
        market: market || null,
        hasFeatures: !!features,
        hasNews: !!news,
        analyzed_at: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OpenAI API key
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const headerKey = req.headers.get('x-openai-api-key') || req.headers.get('x-openai-key');
    if (headerKey) openaiApiKey = headerKey as string;

    if (!openaiApiKey) {
      console.error('[ai-analyze] No OpenAI API key found');
      return new Response(JSON.stringify({ 
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase secrets." 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!symbol || !features || !features.technical) {
      return new Response(JSON.stringify({ 
        error: "symbol, features, and features.technical are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ai-analyze] Processing with deterministic rules for ${symbol}`);

    const client = new OpenAI({ apiKey: openaiApiKey });

    // Create deterministic analysis prompt
    const deterministicPrompt = `You are an institutional-grade technical analysis engine using STRICT deterministic rules.

CRITICAL INSTRUCTIONS:
- Use ONLY the provided numerical data
- Apply rules in EXACT order specified
- Return ONLY JSON matching the function schema
- Round all prices to 5 decimal places
- Use temperature=0 and top_p=0 for consistency

MARKET DATA:
Symbol: ${symbol}
Timeframe: ${timeframe}
Market: ${market}

FEATURES:
${JSON.stringify(features, null, 2)}

NEWS RISK:
${JSON.stringify(news || { event_risk: false, headline_hits_30m: 0 }, null, 2)}

DETERMINISTIC RULE ORDER (apply sequentially):

1. TREND ANALYSIS:
   - Bullish: ema20 > ema50 > ema200
   - Bearish: ema20 < ema50 < ema200
   - Neutral: Otherwise

2. MOMENTUM GATES:
   - RSI: Overbought ≥70, Oversold ≤30
   - MACD: Bullish >+0.00005, Bearish <-0.00005
   - If atr_percentile_60d ≥0.8: multiply MACD thresholds by 1.5

3. VWAP/BB BIAS:
   - Above VWAP & BB mid: Bullish bias
   - Below both: Bearish bias

4. LEVEL PROXIMITY (within 0.15×ATR):
   - Near support: |current - nearest_support| ≤ 0.15×atr14
   - Near resistance: |current - nearest_resistance| ≤ 0.15×atr14

5. SESSION/VOLATILITY FILTERS:
   - Asia session + low ATR percentile (≤0.2): Suppress breakouts → HOLD
   - High spread percentile (≥0.8) or stale=true: → HOLD

6. ORDER FLOW FILTERS:
   - quote_imbalance <0.35 (against buys) or >0.65 (against sells): → HOLD

7. NEWS RISK GATE:
   - event_risk=true: → HOLD

8. SIGNAL DECISION:
   - BUY: (trend not bearish) AND (MACD bullish OR RSI ≤35) AND near_support
   - SELL: (trend not bullish) AND (MACD bearish OR RSI ≥65) AND near_resistance
   - HOLD: Otherwise

9. STOPS/TARGETS (mandatory):
   - BUY stop: min(support) - 0.25×atr14
   - SELL stop: max(resistance) + 0.25×atr14
   - Targets: current ± {1×atr14, 2×atr14} in trade direction
   - If RR to Target1 < 1.5: Override to HOLD

10. CONFIDENCE CALCULATION:
    - Start: 50
    - +10 per confluence (trend+momentum+level alignment)
    - -10 for conflicts, -15 for high ATR
    - Cap at 88

Apply these rules EXACTLY as specified. Generate Fibonacci levels from recent swing highs/lows.`;

    console.log('[ai-analyze] Calling OpenAI with function calling...');
    
    const response = await client.chat.completions.create({
      model: "gpt-5-2025-08-07",
      messages: [
        { 
          role: "system", 
          content: "You are an institutional-grade technical analysis engine. Use ONLY provided data. Apply deterministic rules in exact order. Return ONLY JSON with no extra text. Be consistent - same inputs must produce same outputs." 
        },
        { 
          role: "user", 
          content: deterministicPrompt 
        }
      ],
      tools: [{ type: "function", function: InstitutionalTaResultSchema }],
      tool_choice: { type: "function", function: { name: "InstitutionalTaResult" } },
      max_completion_tokens: 2000
    });

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "InstitutionalTaResult") {
      console.error('[ai-analyze] No valid function call returned');
      return new Response(JSON.stringify({ 
        error: "AI did not return valid function call" 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
      console.log('[ai-analyze] Function call parsed successfully');
    } catch (e) {
      console.error('[ai-analyze] Function arguments parse failed:', e);
      return new Response(JSON.stringify({ 
        error: "AI returned invalid function arguments",
        details: toolCall.function.arguments.slice(0, 200)
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate and ensure all required fields
    const result = {
      ...parsed,
      symbol,
      timeframe,
      market,
      json_version: "1.0.0",
      analyzed_at: new Date().toISOString(),
      input_features: features,
      input_news: news || { event_risk: false, headline_hits_30m: 0 }
    };

    console.log(`[ai-analyze] Deterministic analysis completed: ${result.action} (${result.confidence_calibrated}% confidence)`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[ai-analyze] Error:', e);
    const status = e?.status === 401 || e?.status === 403 ? 401 : 502;

    return new Response(JSON.stringify({ 
      error: e?.message || "Analysis failed",
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});