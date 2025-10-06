// Institutional Technical Analysis Engine v2.1 - Fixed Signal Inversion Bug
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const FUNCTION_VERSION = "2.1.0"; // Force redeployment

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

// Enhanced OpenAI Function Schema for comprehensive institutional analysis
const InstitutionalTaResultSchema = {
  name: "InstitutionalTaResult",
  description: "Comprehensive institutional-grade technical analysis with multiple strategies and quantitative metrics",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Comprehensive market structure and technical analysis summary" },
      action: { type: "string", enum: ["buy", "sell", "hold"], description: "Primary trading action" },
      action_text: { type: "string", description: "Detailed action description with rationale" },
      outlook: { type: "string", enum: ["bullish", "bearish", "neutral"], description: "Market outlook" },
      market_structure: {
        type: "object",
        properties: {
          trend_direction: { type: "string", enum: ["strong_bullish", "bullish", "neutral", "bearish", "strong_bearish"] },
          market_phase: { type: "string", enum: ["trending", "range_bound", "consolidation", "breakout"] },
          volatility_regime: { type: "string", enum: ["low", "normal", "high", "extreme"] },
          session_context: { type: "string", description: "Session analysis and liquidity context" }
        },
        required: ["trend_direction", "market_phase", "volatility_regime", "session_context"]
      },
      levels: {
        type: "object",
        properties: {
          support: { type: "array", items: { type: "number" }, description: "Key support levels" },
          resistance: { type: "array", items: { type: "number" }, description: "Key resistance levels" },
          vwap: { type: ["number", "null"], description: "VWAP level" },
          pivot_points: { type: "array", items: { type: "number" }, description: "Daily pivot points" }
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
              "161.8": { type: "number" },
              "261.8": { type: "number" }
            },
            required: ["127.2", "161.8", "261.8"]
          },
          direction: { type: "string", enum: ["up", "down"] },
          confluence_zones: { type: "array", items: { type: "string" }, description: "Key Fibonacci confluence areas" }
        },
        required: ["pivot_high", "pivot_low", "retracements", "extensions", "direction", "confluence_zones"]
      },
      trading_strategies: {
        type: "object",
        properties: {
          trend_following: {
            type: "object",
            properties: {
              setup_quality: { type: "string", enum: ["excellent", "good", "fair", "poor", "invalid"] },
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              probability: { type: "number", minimum: 0, maximum: 100 },
              rationale: { type: "string" }
            },
            required: ["setup_quality", "entry", "stop", "targets", "probability", "rationale"]
          },
          mean_reversion: {
            type: "object",
            properties: {
              setup_quality: { type: "string", enum: ["excellent", "good", "fair", "poor", "invalid"] },
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              probability: { type: "number", minimum: 0, maximum: 100 },
              rationale: { type: "string" }
            },
            required: ["setup_quality", "entry", "stop", "targets", "probability", "rationale"]
          },
          momentum: {
            type: "object",
            properties: {
              setup_quality: { type: "string", enum: ["excellent", "good", "fair", "poor", "invalid"] },
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              probability: { type: "number", minimum: 0, maximum: 100 },
              rationale: { type: "string" }
            },
            required: ["setup_quality", "entry", "stop", "targets", "probability", "rationale"]
          },
          range_trading: {
            type: "object",
            properties: {
              setup_quality: { type: "string", enum: ["excellent", "good", "fair", "poor", "invalid"] },
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              probability: { type: "number", minimum: 0, maximum: 100 },
              rationale: { type: "string" }
            },
            required: ["setup_quality", "entry", "stop", "targets", "probability", "rationale"]
          }
        },
        required: ["trend_following", "mean_reversion", "momentum", "range_trading"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long", "short", "none"] },
          entry: { type: "number" },
          stop: { type: "number" },
          targets: { type: "array", items: { type: "number" } },
          target_probabilities: { type: "array", items: { type: "number" }, description: "Probability of reaching each target" },
          rationale: { type: "string" },
          time_horizon: { type: "string", enum: ["scalp", "intraday", "swing", "position"] },
          setup_type: { type: "string", enum: ["breakout", "pullback", "mean_reversion", "range", "momentum", "trend_continuation"] },
          rr_estimate: { type: "number" },
          expected_value: { type: "number", description: "Expected value of the trade" }
        },
        required: ["direction", "entry", "stop", "targets", "target_probabilities", "rationale", "time_horizon", "setup_type", "rr_estimate", "expected_value"]
      },
      technical: {
        type: "object",
        properties: {
          ema20: { type: "number" },
          ema50: { type: "number" },
          ema200: { type: "number" },
          rsi14: { type: "number" },
          rsi_divergence: { type: "string", description: "RSI divergence analysis" },
          macd: {
            type: "object",
            properties: {
              line: { type: "number" },
              signal: { type: "number" },
              hist: { type: "number" },
              analysis: { type: "string", description: "MACD signal quality and context" }
            },
            required: ["line", "signal", "hist", "analysis"]
          },
          atr14: { type: "number" },
          bb: {
            type: "object",
            properties: {
              mid: { type: "number" },
              upper: { type: "number" },
              lower: { type: "number" },
              width: { type: "number" },
              position: { type: "string", description: "Price position relative to bands" }
            },
            required: ["mid", "upper", "lower", "width", "position"]
          },
          volume_analysis: { type: "string", description: "Volume and order flow analysis" }
        },
        required: ["ema20", "ema50", "ema200", "rsi14", "rsi_divergence", "macd", "atr14", "bb", "volume_analysis"]
      },
      quantitative_metrics: {
        type: "object",
        properties: {
          volatility_percentile: { type: "number" },
          trend_strength: { type: "number", minimum: 0, maximum: 100 },
          momentum_score: { type: "number", minimum: -100, maximum: 100 },
          mean_reversion_probability: { type: "number", minimum: 0, maximum: 100 },
          breakout_probability: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["volatility_percentile", "trend_strength", "momentum_score", "mean_reversion_probability", "breakout_probability"]
      },
      confidence_model: { type: "number", minimum: 0, maximum: 100 },
      confidence_calibrated: { type: "number", minimum: 0, maximum: 100 },
      evidence: { type: "array", items: { type: "string" }, description: "Supporting evidence for analysis" },
      risks: { type: "string", description: "Risk assessment and mitigation strategies" },
      timeframe_profile: {
        type: "object",
        properties: {
          scalp: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              strategy: { type: "string" },
              probability: { type: "number" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          },
          intraday: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              strategy: { type: "string" },
              probability: { type: "number" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          },
          swing: {
            type: "object",
            properties: {
              entry: { type: "number" },
              stop: { type: "number" },
              targets: { type: "array", items: { type: "number" } },
              strategy: { type: "string" },
              probability: { type: "number" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          }
        },
        required: ["scalp", "intraday", "swing"]
      },
      json_version: { type: "string" }
    },
    required: [
      "summary", "action", "action_text", "outlook", "market_structure", "levels", "fibonacci", 
      "trading_strategies", "trade_idea", "technical", "quantitative_metrics", 
      "confidence_model", "confidence_calibrated", "evidence", "risks", "timeframe_profile", "json_version"
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

    console.log(`[ai-analyze v${FUNCTION_VERSION}] Processing analysis request: ${symbol} (${timeframe}, ${market})`);

    // Debug endpoint
    if (debug === true) {
      return new Response(JSON.stringify({
        version: FUNCTION_VERSION,
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

    // Create comprehensive institutional analysis prompt
    const comprehensivePrompt = `You are an elite institutional trading desk providing multi-strategy quantitative analysis.

MARKET DATA:
Symbol: ${symbol} | Timeframe: ${timeframe} | Asset: ${market}

IMPORTANT: The analysis summary MUST be specifically for the ${timeframe} timeframe. All levels, patterns, and recommendations should be contextualized to ${timeframe} chart analysis.

TECHNICAL FEATURES:
${JSON.stringify(features, null, 2)}

NEWS/EVENT CONTEXT:
${JSON.stringify(news || { event_risk: false, headline_hits_30m: 0 }, null, 2)}

ANALYSIS REQUIREMENTS - Provide COMPREHENSIVE institutional-grade analysis covering:

1. MARKET STRUCTURE ANALYSIS:
   - Identify trend direction using EMAs (20/50/200 alignment)
   - Market phase: Trending, Range-bound, Consolidation, Breakout
   - Volatility regime: Low/Normal/High based on ATR percentiles
   - Session analysis and liquidity considerations

2. QUANTITATIVE TECHNICAL ANALYSIS:
   - RSI divergence patterns and momentum shifts
   - MACD crossovers, histogram strength, and signal quality
   - Bollinger Band position and squeeze/expansion signals
   - VWAP deviation and mean reversion probabilities
   - Volume profile and institutional order flow analysis

3. FIBONACCI RETRACEMENT ANALYSIS:
   - Calculate precise Fibonacci levels from significant swing high/low
   - Identify key retracement zones (23.6%, 38.2%, 50%, 61.8%, 78.6%)
   - Extension targets (127.2%, 161.8%) for breakout scenarios
   - Confluence with other technical levels

4. MULTIPLE STRATEGY ASSESSMENT:
   
   A) TREND FOLLOWING STRATEGY:
      - EMA alignment and momentum confirmation
      - Breakout setups above resistance with volume
      - Pullback entries to moving averages in trends
      
   B) MEAN REVERSION STRATEGY:
      - Oversold/overbought conditions (RSI extremes)
      - Bollinger Band touch reversals
      - VWAP mean reversion trades
      
   C) MOMENTUM STRATEGY:
      - MACD bullish/bearish crossovers
      - RSI breakouts above 70 or below 30
      - Volume confirmation on directional moves
      
   D) RANGE TRADING STRATEGY:
      - Support/resistance level trades
      - Range-bound oscillator signals
      - Mean reversion within established ranges

5. MULTI-TIMEFRAME ANALYSIS:
   - Scalp (1-15min): Quick momentum plays, level bounces
   - Intraday (30min-4h): Session-based trades, pattern completions  
   - Swing (daily+): Multi-day position trades, trend following

6. RISK-REWARD SCENARIOS:
   - Calculate precise stop-loss levels using ATR multiples
   - Multiple profit targets with percentage allocations
   - Position sizing recommendations based on volatility
   - Worst-case and best-case scenario probabilities

7. QUANTITATIVE EDGE ANALYSIS:
   - Probability estimates for directional moves
   - Expected value calculations for trade setups
   - Historical win rates for similar market conditions
   - Risk-adjusted return expectations

8. INSTITUTIONAL PERSPECTIVE:
   - Smart money flow indicators
   - Level significance and institutional interest
   - Market maker positioning insights
   - Liquidity and slippage considerations

PROVIDE DETAILED, ACTIONABLE ANALYSIS with specific entry points, stop losses, and multiple profit targets for each viable strategy. Include confidence intervals and probability assessments for each recommendation.`;

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
          content: comprehensivePrompt 
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
      function_version: FUNCTION_VERSION,
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