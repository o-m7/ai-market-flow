// Institutional Technical Analysis Engine v2.1 - Fixed Signal Inversion Bug
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const FUNCTION_VERSION = "2.6.2"; // Using gpt-4o model

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
          direction: { type: "string", enum: ["long", "short"], description: "REQUIRED: Must choose long or short based on technical bias. Never return none." },
          entry: { type: "number", description: "Entry price based on CURRENT price, not historical levels" },
          stop: { type: "number", description: "Stop loss calculated from CURRENT price" },
          targets: { type: "array", items: { type: "number" }, description: "Target prices calculated from CURRENT price" },
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
    const { symbol, timeframe, market, candles, currentPrice, news, debug } = body || {};

    console.log(`[ai-analyze v${FUNCTION_VERSION}] Processing analysis request: ${symbol} (${timeframe}, ${market})`);
    if (currentPrice) {
      console.log(`[ai-analyze] Live price provided: ${currentPrice}`);
    }

    // Debug endpoint
    if (debug === true) {
      return new Response(JSON.stringify({
        version: FUNCTION_VERSION,
        hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
        hasPolygon: !!Deno.env.get('POLYGON_API_KEY'),
        symbol: symbol || null,
        timeframe: timeframe || null,
        market: market || null,
        hasCandles: !!candles,
        currentPrice: currentPrice || null,
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

    if (!symbol || !candles || candles.length === 0) {
      return new Response(JSON.stringify({ 
        error: "symbol and candles are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch technical indicators from Polygon API
    console.log(`[ai-analyze] Fetching technical indicators from Polygon for ${symbol}`);
    const features = await fetchTechnicalIndicators(symbol, timeframe, market, candles, currentPrice);
    console.log(`[ai-analyze] Technical indicators fetched:`, JSON.stringify(features.technical, null, 2));

    const client = new OpenAI({ apiKey: openaiApiKey });

    // Create comprehensive institutional analysis prompt
    const livePrice = currentPrice || features.technical.current;
    const comprehensivePrompt = `You are an elite institutional trading desk providing multi-strategy quantitative analysis.

MARKET DATA:
Symbol: ${symbol} | Timeframe: ${timeframe} | Asset: ${market}
CURRENT LIVE PRICE: ${livePrice}

🚨 CRITICAL RULES - MUST FOLLOW:
1. ALL entry prices MUST be within 2% of CURRENT LIVE PRICE: ${livePrice}
2. You MUST choose either "long" or "short" direction - NEVER "none"
3. If technical indicators are mixed, pick the direction with STRONGER evidence
4. Calculate ALL prices (entry/stop/targets) relative to ${livePrice}, not historical levels
5. All timeframe_profile entries (scalp/intraday/swing) MUST use prices near ${livePrice}

TECHNICAL FEATURES:
${JSON.stringify(features, null, 2)}

NEWS/EVENT CONTEXT:
${JSON.stringify(news || { event_risk: false, headline_hits_30m: 0 }, null, 2)}

ANALYSIS REQUIREMENTS - Provide COMPREHENSIVE institutional-grade analysis:

1. MARKET STRUCTURE: Identify trend direction (EMA 20/50/200 alignment), market phase (trending/range/consolidation/breakout), volatility regime (low/normal/high based on ATR), and session liquidity context.

2. TECHNICAL ANALYSIS: Analyze RSI divergence patterns, MACD crossovers and histogram strength, Bollinger Band position and squeeze/expansion signals, VWAP deviation for mean reversion probability, and volume profile for institutional order flow.

3. FIBONACCI RETRACEMENT: Calculate precise Fibonacci levels from significant swing high/low. Identify key retracement zones (23.6%, 38.2%, 50%, 61.8%, 78.6%) and extension targets (127.2%, 161.8%, 261.8%) for breakout scenarios. Note confluence with other technical levels.

4. MULTIPLE TRADING STRATEGIES: 
   A) TREND FOLLOWING: EMA alignment with momentum confirmation, breakout setups above resistance with volume, pullback entries to moving averages in trends.
   B) MEAN REVERSION: Oversold/overbought RSI conditions, Bollinger Band touch reversals, VWAP mean reversion trades.
   C) MOMENTUM: MACD bullish/bearish crossovers, RSI breakouts above 70 or below 30, volume confirmation on directional moves.
   D) RANGE TRADING: Support/resistance level trades, range-bound oscillator signals, mean reversion within established ranges.

5. MULTI-TIMEFRAME SETUPS: 
   🚨 CRITICAL: ALL entries must be calculated from current price ${livePrice}
   - SCALP: Entry within 0.3% of ${livePrice}, tight ATR-based stops
   - INTRADAY: Entry within 1% of ${livePrice}, wider targets
   - SWING: Entry within 2% of ${livePrice}, widest targets
   DO NOT use old historical levels like 119500 when current price is ${livePrice}!

6. DIRECTIONAL BIAS: You MUST pick long or short. If indicators conflict:
   - Check EMA alignment: Price above EMAs = LONG bias, below = SHORT bias  
   - Check RSI: <40 = consider LONG, >60 = consider SHORT
   - Check MACD: Positive histogram = LONG bias, negative = SHORT bias
   - Pick the direction with MOST supporting evidence

7. RISK-REWARD ANALYSIS: Calculate precise stop-loss levels using ATR multiples, multiple profit targets with percentage allocations, position sizing based on volatility, and probability estimates for worst-case and best-case scenarios.

8. QUANTITATIVE METRICS: Include probability estimates for directional moves, expected value calculations for trade setups, historical win rates for similar market conditions, and risk-adjusted return expectations.

9. INSTITUTIONAL PERSPECTIVE: Analyze smart money flow indicators, level significance and institutional interest, market maker positioning insights, and liquidity/slippage considerations.

CRITICAL: You MUST provide a trade_idea with direction "long" or "short" (never "none"). All entry prices across all timeframes MUST be within 2% of current live price ${livePrice}. Return analysis in the exact JSON structure defined by the function schema.`;

    console.log('[ai-analyze] Calling OpenAI with function calling...');
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an institutional-grade technical analysis engine. Use ONLY provided data. Apply deterministic rules. Return ONLY JSON." 
        },
        { 
          role: "user", 
          content: comprehensivePrompt 
        }
      ],
      tools: [{ type: "function", function: InstitutionalTaResultSchema }],
      tool_choice: { type: "function", function: { name: "InstitutionalTaResult" } },
      max_tokens: 4096,
      temperature: 0.7,
    });

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
    
    console.log('[ai-analyze] OpenAI response:', JSON.stringify({
      hasChoices: !!response.choices?.[0],
      hasMessage: !!response.choices?.[0]?.message,
      hasToolCalls: !!response.choices?.[0]?.message?.tool_calls,
      toolCallsLength: response.choices?.[0]?.message?.tool_calls?.length,
      finishReason: response.choices?.[0]?.finish_reason,
      messageContent: response.choices?.[0]?.message?.content?.slice(0, 200),
      toolCallName: toolCall?.function?.name,
      toolCallArgsPreview: toolCall?.function?.arguments?.slice(0, 200)
    }));
    
    if (!toolCall) {
      console.error('[ai-analyze] No tool call in response. Full response:', JSON.stringify(response, null, 2));
      return new Response(JSON.stringify({ 
        error: "AI did not return function call. This may be due to model constraints or prompt issues.",
        debug: {
          finishReason: response.choices?.[0]?.finish_reason,
          hasContent: !!response.choices?.[0]?.message?.content,
          contentPreview: response.choices?.[0]?.message?.content?.slice(0, 500)
        }
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (toolCall.function.name !== "InstitutionalTaResult") {
      console.error('[ai-analyze] Wrong function name returned:', toolCall.function.name);
      return new Response(JSON.stringify({ 
        error: `AI returned wrong function: ${toolCall.function.name} instead of InstitutionalTaResult` 
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
      currentPrice: currentPrice || null,
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

// Simple in-memory cache for indicator values (30 second TTL)
const indicatorCache = new Map<string, { data: any; expires: number }>();

function getCacheKey(symbol: string, timeframe: string): string {
  return `${symbol}-${timeframe}`;
}

function getCachedIndicators(symbol: string, timeframe: string): any | null {
  const key = getCacheKey(symbol, timeframe);
  const cached = indicatorCache.get(key);
  if (cached && Date.now() < cached.expires) {
    console.log(`[ai-analyze] Using cached indicators for ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedIndicators(symbol: string, timeframe: string, data: any): void {
  const key = getCacheKey(symbol, timeframe);
  indicatorCache.set(key, { data, expires: Date.now() + 30000 }); // 30 second TTL
  console.log(`[ai-analyze] Cached indicators for ${key}`);
}

// Fetch technical indicators from Polygon API with timeout
async function fetchTechnicalIndicators(symbol: string, timeframe: string, market: string, candles: any[], currentPrice?: number) {
  const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!polygonApiKey) {
    console.warn('[ai-analyze] POLYGON_API_KEY not set, using calculated indicators');
    return calculateTechnicalIndicators(candles, currentPrice);
  }

  // Check cache first
  const cached = getCachedIndicators(symbol, timeframe);
  if (cached) return cached;

  try {
    const providerSymbol = 
      market === "CRYPTO" ? (symbol.startsWith('X:') ? symbol : `X:${symbol}`)
      : market === "FOREX" ? (symbol.startsWith('C:') ? symbol : `C:${symbol}`)
      : symbol.toUpperCase();

    const tfMap: Record<string, string> = {
      '1m': 'minute', '5m': 'minute', '15m': 'minute', '30m': 'minute',
      '1h': 'hour', '60m': 'hour', '4h': 'hour', '240m': 'hour',
      '1d': 'day', 'D': 'day'
    };
    const timespan = tfMap[timeframe] || 'hour';

    console.log(`[ai-analyze] Fetching Polygon indicators for ${providerSymbol}, timespan=${timespan}`);

    // Phase 2: Add 3-second timeout for Polygon calls
    const timeout = 3000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const [rsiRes, ema20Res, ema50Res, ema200Res, macdRes] = await Promise.all([
        fetch(`https://api.polygon.io/v1/indicators/rsi/${providerSymbol}?timespan=${timespan}&adjusted=true&window=14&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`, { signal: controller.signal }),
        fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=20&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`, { signal: controller.signal }),
        fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=50&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`, { signal: controller.signal }),
        fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=200&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`, { signal: controller.signal }),
        fetch(`https://api.polygon.io/v1/indicators/macd/${providerSymbol}?timespan=${timespan}&adjusted=true&short_window=12&long_window=26&signal_window=9&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`, { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!rsiRes.ok) console.warn(`[ai-analyze] RSI fetch failed: ${rsiRes.status}`);
      if (!ema20Res.ok) console.warn(`[ai-analyze] EMA20 fetch failed: ${ema20Res.status}`);
      if (!macdRes.ok) console.warn(`[ai-analyze] MACD fetch failed: ${macdRes.status}`);

      const [rsiData, ema20Data, ema50Data, ema200Data, macdData] = await Promise.all([
        rsiRes.json(), ema20Res.json(), ema50Res.json(), ema200Res.json(), macdRes.json()
      ]);

      const closes = candles.map((c: any) => c.c);
      const highs = candles.map((c: any) => c.h);
      const lows = candles.map((c: any) => c.l);
      const priceRef = currentPrice || closes[closes.length - 1] || 0;

      const result = {
        technical: {
          ema20: ema20Data?.results?.values?.[0]?.value || 0,
          ema50: ema50Data?.results?.values?.[0]?.value || 0,
          ema200: ema200Data?.results?.values?.[0]?.value || 0,
          rsi14: rsiData?.results?.values?.[0]?.value || 50,
          macd: {
            line: macdData?.results?.values?.[0]?.value || 0,
            signal: macdData?.results?.values?.[0]?.signal || 0,
            hist: (macdData?.results?.values?.[0]?.value || 0) - (macdData?.results?.values?.[0]?.signal || 0)
          },
          atr14: calculateATR(highs, lows, closes, 14),
          bb: calculateBollingerBands(closes, 20, 2),
          vwap: calculateVWAP(candles),
          support: findSupportLevels(lows, priceRef),
          resistance: findResistanceLevels(highs, priceRef),
          lastClose: priceRef,
          current: priceRef
        },
        market: { session: getMarketSession(), spread: 0.001, stale: false }
      };

      // Cache the result
      setCachedIndicators(symbol, timeframe, result);
      return result;
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn('[ai-analyze] Polygon request timed out after 3s, using calculated indicators');
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('[ai-analyze] Error fetching Polygon indicators:', error);
  }
  
  return calculateTechnicalIndicators(candles, currentPrice);
}

function calculateTechnicalIndicators(candles: any[], currentPrice?: number) {
  const closes = candles.map((c: any) => c.c);
  const highs = candles.map((c: any) => c.h);
  const lows = candles.map((c: any) => c.l);
  const priceRef = currentPrice || closes[closes.length - 1] || 0;
  return {
    technical: {
      ema20: calculateEMA(closes, 20), ema50: calculateEMA(closes, 50), ema200: calculateEMA(closes, 200),
      rsi14: calculateRSI(closes, 14), macd: calculateMACD(closes), atr14: calculateATR(highs, lows, closes, 14),
      bb: calculateBollingerBands(closes, 20, 2), vwap: calculateVWAP(candles),
      support: findSupportLevels(lows, priceRef), resistance: findResistanceLevels(highs, priceRef),
      lastClose: priceRef, current: priceRef
    },
    market: { session: getMarketSession(), spread: 0.001, stale: false }
  };
}

function calculateEMA(values: number[], period: number): number {
  if (!values.length) return 0;
  const multiplier = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) ema = (values[i] * multiplier) + (ema * (1 - multiplier));
  return ema;
}

function calculateRSI(values: number[], period: number = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change; else losses -= change;
  }
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

function calculateMACD(values: number[]): { line: number; signal: number; hist: number } {
  const line = calculateEMA(values, 12) - calculateEMA(values, 26);
  const signal = line * 0.1;
  return { line, signal, hist: line - signal };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

function calculateBollingerBands(values: number[], period: number = 20, multiplier: number = 2) {
  if (values.length < period) {
    const last = values[values.length - 1] || 0;
    return { upper: last, mid: last, lower: last };
  }
  const recentValues = values.slice(-period);
  const mid = recentValues.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(recentValues.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period);
  return { upper: mid + (stdDev * multiplier), mid, lower: mid - (stdDev * multiplier) };
}

function calculateVWAP(candles: any[]): number {
  if (!candles.length) return 0;
  let totalVolumePrice = 0, totalVolume = 0;
  for (const c of candles.slice(-30)) {
    const typical = (c.h + c.l + c.c) / 3;
    totalVolumePrice += typical * (c.v || 1);
    totalVolume += (c.v || 1);
  }
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

function findSupportLevels(lows: number[], currentPrice?: number): number[] {
  if (lows.length < 10) return [];
  
  // Focus on recent 30 bars for more current levels
  const recentLows = lows.slice(-30);
  const refPrice = currentPrice || lows[lows.length - 1];
  
  // Find pivot lows (local minimums where price bounced)
  const pivots: number[] = [];
  for (let i = 2; i < recentLows.length - 2; i++) {
    if (recentLows[i] < recentLows[i-1] && 
        recentLows[i] < recentLows[i-2] && 
        recentLows[i] < recentLows[i+1] && 
        recentLows[i] < recentLows[i+2]) {
      // Only include if it's below current price
      if (recentLows[i] < refPrice * 0.999) {
        pivots.push(recentLows[i]);
      }
    }
  }
  
  // If no pivots, use recent lows below current price
  if (pivots.length === 0) {
    const belowPrice = recentLows.filter(l => l < refPrice * 0.999).sort((a, b) => b - a);
    return belowPrice.slice(0, 2);
  }
  
  // Return most recent/strongest pivots
  return pivots.slice(-3).sort((a, b) => b - a).slice(0, 2);
}

function findResistanceLevels(highs: number[], currentPrice?: number): number[] {
  if (highs.length < 10) return [];
  
  // Focus on recent 30 bars for more current levels
  const recentHighs = highs.slice(-30);
  const refPrice = currentPrice || highs[highs.length - 1];
  
  // Find pivot highs (local maximums where price rejected)
  const pivots: number[] = [];
  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && 
        recentHighs[i] > recentHighs[i-2] && 
        recentHighs[i] > recentHighs[i+1] && 
        recentHighs[i] > recentHighs[i+2]) {
      // Only include if it's above current price
      if (recentHighs[i] > refPrice * 1.001) {
        pivots.push(recentHighs[i]);
      }
    }
  }
  
  // If no pivots, use recent highs above current price
  if (pivots.length === 0) {
    const abovePrice = recentHighs.filter(h => h > refPrice * 1.001).sort((a, b) => a - b);
    return abovePrice.slice(0, 2);
  }
  
  // Return most recent/strongest pivots
  return pivots.slice(-3).sort((a, b) => a - b).slice(0, 2);
}

function getMarketSession(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return 'ASIA';
  if (hour >= 8 && hour < 16) return 'EUROPE'; 
  return 'US';
}