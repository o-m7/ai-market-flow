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
          support: { type: "array", items: { type: "number" }, description: "Key support levels from price action" },
          resistance: { type: "array", items: { type: "number" }, description: "Key resistance levels from price action" },
          vwap: { type: ["number", "null"], description: "VWAP level" },
          pivot_points: { type: "array", items: { type: "number" }, description: "Daily pivot points" },
          liquidity_zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                price: { type: "number" },
                type: { type: "string", enum: ["buy", "sell"] },
                strength: { type: "string", enum: ["weak", "moderate", "strong"] },
                description: { type: "string" }
              }
            },
            description: "Institutional liquidity zones where orders cluster"
          },
          breakout_zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                price: { type: "number" },
                type: { type: "string", enum: ["bullish", "bearish"] },
                strength: { type: "string", enum: ["weak", "moderate", "strong"] },
                description: { type: "string" }
              }
            },
            description: "Key psychological breakout levels"
          },
          order_blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                high: { type: "number" },
                low: { type: "number" },
                type: { type: "string", enum: ["bullish", "bearish"] },
                strength: { type: "string" },
                description: { type: "string" }
              }
            },
            description: "Institutional order block zones"
          }
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
          entry: { type: "number", description: "Optimal entry at key technical level - can be at support/resistance/EMA levels, not forced at current price" },
          stop: { type: "number", description: "Stop loss at structure invalidation point (recent swing + ATR buffer)" },
          targets: { type: "array", items: { type: "number" }, description: "Multiple targets at key resistance/support levels with minimum 2:1 R:R" },
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
      accuracy_metrics: {
        type: "object",
        properties: {
          data_freshness_score: { type: "number", minimum: 0, maximum: 100, description: "How recent/fresh the candle data is" },
          signal_clarity_score: { type: "number", minimum: 0, maximum: 100, description: "How clear the directional signal is" },
          level_precision_score: { type: "number", minimum: 0, maximum: 100, description: "How precise support/resistance levels are" },
          entry_validity_score: { type: "number", minimum: 0, maximum: 100, description: "How valid the entry price is relative to current price" },
          overall_accuracy: { type: "number", minimum: 0, maximum: 100, description: "Overall accuracy score of the analysis" },
          validation_notes: { type: "array", items: { type: "string" }, description: "Notes about analysis validation" }
        },
        required: ["data_freshness_score", "signal_clarity_score", "level_precision_score", "entry_validity_score", "overall_accuracy", "validation_notes"]
      },
      json_version: { type: "string" }
    },
    required: [
      "summary", "action", "action_text", "outlook", "market_structure", "levels", "fibonacci", 
      "trading_strategies", "trade_idea", "technical", "quantitative_metrics", 
      "confidence_model", "confidence_calibrated", "evidence", "risks", "timeframe_profile", 
      "accuracy_metrics", "json_version"
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
    const latestCandleTime = candles[candles.length - 1]?.t || Date.now();
    const candleAge = Math.round((Date.now() - latestCandleTime) / 1000); // seconds
    
    console.log(`[ai-analyze] Using ${candles.length} candles, latest from ${new Date(latestCandleTime).toISOString()} (${candleAge}s ago)`);
    
    const comprehensivePrompt = `You are an elite institutional trading desk providing multi-strategy quantitative analysis.

🎯 CRITICAL: ACCURACY IS PARAMOUNT - Provide PRECISE, DETAILED numbers for ALL metrics

MARKET DATA:
Symbol: ${symbol} | Timeframe: ${timeframe} | Asset: ${market}
🔴 CURRENT LIVE PRICE: ${livePrice}
📊 Latest Candle: ${new Date(latestCandleTime).toISOString()} (${candleAge} seconds ago)
📈 Total Candles Analyzed: ${candles.length}

⚠️ CRITICAL: ALL support/resistance/liquidity zones are calculated from LIVE CANDLES (most recent ${candles.length} bars)
⚠️ CRITICAL: ALL entries must reference CURRENT PRICE ${livePrice} not historical data
⚠️ CRITICAL: Provide EXACT numbers with 2 decimal precision for ALL price levels

🚨 CRITICAL RULES FOR PROFESSIONAL ENTRIES:
1. You MUST choose either "long" or "short" direction - NEVER "none"
2. Determine directional bias from:
   - EMA alignment: Price above 20/50/200 EMAs = LONG bias, below = SHORT bias
   - MACD: Positive histogram = LONG bias, negative = SHORT bias  
   - RSI: <40 + bullish divergence = LONG, >60 + bearish divergence = SHORT
   - Pick the direction with MOST confluence of supporting indicators

2. SUPPORT & RESISTANCE LEVELS:
   - Use the support and resistance arrays provided in technical features
   - These are calculated from LIVE candle data (last ${candles.length} candles)
   - Support levels MUST be BELOW current price ${livePrice}
   - Resistance levels MUST be ABOVE current price ${livePrice}
   - Include these exact levels in your "levels" response
   - Provide AT LEAST 2-3 support and 2-3 resistance levels

3. LIQUIDITY & ORDER BLOCKS:
   - Use liquidity_zones, breakout_zones, and order_blocks from technical features
   - These zones are calculated from actual price action in recent candles
   - Prioritize these institutional levels for entry placement
   - Liquidity zones show where institutional orders cluster
   - Order blocks show where smart money accumulated/distributed

4. ENTRY PRICES - CRITICAL PRICE RANGE VALIDATION:
   🚨 MANDATORY ENTRY PRICE RULES (AI MUST FOLLOW):
   
   FOR LONG TRADES:
   - Entry MUST be between ${(livePrice * 0.98).toFixed(2)} and ${(livePrice * 1.02).toFixed(2)} (±2% of current price ${livePrice})
   - OR at nearest support level within 3% of current price (${(livePrice * 0.97).toFixed(2)} - ${(livePrice * 1.03).toFixed(2)})
   - NEVER place LONG entry above current price + 2% unless at a critical support retest
   - Entry justification: buying dips, pullbacks to support, order blocks, or at current market price
   
   FOR SHORT TRADES:
   - Entry MUST be between ${(livePrice * 0.98).toFixed(2)} and ${(livePrice * 1.02).toFixed(2)} (±2% of current price ${livePrice})
   - OR at nearest resistance level within 3% of current price (${(livePrice * 0.97).toFixed(2)} - ${(livePrice * 1.03).toFixed(2)})
   - NEVER place SHORT entry below current price - 2% unless at a critical resistance retest
   - Entry justification: selling rallies, bounces to resistance, order blocks, or at current market price
   
   VALID ENTRY PLACEMENT (in order of priority):
   1. At current price ±0.5% (market entry with tight range)
   2. At order block level within 3% of current price
   3. At liquidity zone within 3% of current price  
   4. At support/resistance within 3% of current price
   5. At Fibonacci retracement level (38.2%, 50%, 61.8%) within 3% of current price
   6. At VWAP or major EMA (20/50/200) within 3% of current price
   
   ⚠️ If NO valid technical level exists within ±3% of current price ${livePrice}:
   - Place entry at current price ${livePrice} (market entry)
   - Provide EXACT entry price with 2 decimal precision

5. STOP LOSS placement:
   - LONG: Stop MUST be BELOW entry (at invalidation point: recent swing low - ATR buffer)
   - SHORT: Stop MUST be ABOVE entry (at invalidation point: recent swing high + ATR buffer)
   - Use ATR for buffer: Stop = structure ± (1-1.5 × ATR)
   - Provide EXACT stop price with 2 decimal precision

6. TARGET placement:
   - Provide AT LEAST 2-3 targets at key levels
   - LONG targets: Resistance levels, Fibonacci extensions, previous highs (MUST be ABOVE entry)
   - SHORT targets: Support levels, Fibonacci extensions, previous lows (MUST be BELOW entry)
   - Minimum 2:1 risk-reward ratio required
   - Provide EXACT target prices with 2 decimal precision
   - Provide probability estimates for each target (0-100)

7. ACCURACY METRICS - You MUST provide:
   - data_freshness_score: Rate how fresh the data is (0-100, consider candle age ${candleAge}s)
   - signal_clarity_score: Rate how clear the directional signal is (0-100)
   - level_precision_score: Rate how precise your support/resistance levels are (0-100)
   - entry_validity_score: Rate how valid your entry is relative to current price (0-100)
   - overall_accuracy: Overall confidence in analysis accuracy (0-100)
   - validation_notes: Array of strings noting validation points or warnings

TECHNICAL FEATURES (calculated from LIVE ${candles.length} candles):
${JSON.stringify(features, null, 2)}
   - LONG entries: Wait for pullbacks to support levels, liquidity zones, order blocks, EMA bounces, or breakout retests
   - SHORT entries: Wait for rallies to resistance levels, liquidity zones, order blocks, EMA rejections, or breakdown retests
   - DO NOT force market orders at current price ${livePrice}
   - Entries can be at key technical levels even if 3-5% away from current price
   - Priority zones: Order blocks > Liquidity zones > Support/Resistance > Fibonacci retracements > VWAP > Round numbers > EMA levels
   - Use the liquidity_zones, breakout_zones, and order_blocks provided in technical features for optimal entry placement

5. STOP LOSS placement:
   - LONG: Place stops below recent swing lows or support levels (invalidation point)
   - SHORT: Place stops above recent swing highs or resistance levels
   - Use ATR for buffer: Stop should be recent structure + (1-1.5 × ATR)

6. TARGET placement:
   - LONG: Resistance levels, Fibonacci extensions, previous highs
   - SHORT: Support levels, Fibonacci extensions, previous lows
   - Minimum 2:1 risk-reward ratio required

TECHNICAL FEATURES (calculated from LIVE ${candles.length} candles):
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

5. MULTI-TIMEFRAME SETUPS - **CRITICAL: YOU MUST PROVIDE ALL THREE SIGNAL TYPES**:
   
   🚨 MANDATORY: Your response MUST include timeframe_profile with ALL THREE signal types:
   - scalp (required)
   - intraday (required)  
   - swing (required)
   
   Each signal type MUST include:
   - entry: exact price (number)
   - stop: exact stop loss price (number)
   - targets: array of 2-3 target prices ([number, number, number])
   - strategy: strategy description (string)
   - probability: confidence percentage (number, 0-100)
   
   SCALP (1-15min timeframe) - REQUIRED:
   - Entry: Nearest support/resistance bounce or micro-breakout level
   - Look for: 5-15min chart patterns, VWAP touches, EMA bounces
   - Entry can be limit orders at key micro levels within 1-2% of current price ${livePrice}
   - Tight stop (0.3-0.7% of price), quick targets (0.5-1.5% moves)
   - Example LONG scalp: entry=${(livePrice * 0.995).toFixed(2)}, stop=${(livePrice * 0.990).toFixed(2)}, targets=[${(livePrice * 1.005).toFixed(2)}, ${(livePrice * 1.010).toFixed(2)}, ${(livePrice * 1.015).toFixed(2)}]
   
   INTRADAY (30min-4h timeframe) - REQUIRED:  
   - Entry: Session highs/lows, hourly chart patterns, major EMA levels
   - Look for: 1h/4h support/resistance, Fibonacci retracements, VWAP deviation
   - Entry can be 2-4% away waiting for pullback/rally to key level
   - Moderate stop (1-2% of price), same-day targets (2-5% moves)
   - Example LONG intraday: entry=${(livePrice * 0.98).toFixed(2)}, stop=${(livePrice * 0.97).toFixed(2)}, targets=[${(livePrice * 1.02).toFixed(2)}, ${(livePrice * 1.04).toFixed(2)}, ${(livePrice * 1.06).toFixed(2)}]
   
   SWING (Daily+ timeframe) - REQUIRED:
   - Entry: Daily support/resistance, weekly pivots, major Fibonacci levels
   - Look for: Daily chart patterns, multi-day consolidation breakouts
   - Entry can be 3-5% away waiting for ideal technical setup
   - Wider stop (2-4% of price), multi-day targets (5-15% moves)
   - Example LONG swing: entry=${(livePrice * 0.97).toFixed(2)}, stop=${(livePrice * 0.95).toFixed(2)}, targets=[${(livePrice * 1.05).toFixed(2)}, ${(livePrice * 1.10).toFixed(2)}, ${(livePrice * 1.15).toFixed(2)}]
   
   ⚠️ CRITICAL: All three signal types must follow the same direction (long or short) but with different entry levels and targets appropriate to their holding period.

6. RISK-REWARD ANALYSIS: 
   - Stop loss at recent structure invalidation point (swing low/high + ATR buffer)
   - Minimum 2:1 reward:risk ratio required for all setups
   - Multiple targets: 1st target at 1R, 2nd at 2R, 3rd at 3R+
   - Position sizing based on stop distance and volatility

7. QUANTITATIVE METRICS: Include probability estimates for directional moves, expected value calculations for trade setups, historical win rates for similar market conditions, and risk-adjusted return expectations.

8. INSTITUTIONAL PERSPECTIVE: Analyze smart money flow indicators, level significance and institutional interest, market maker positioning insights, and liquidity/slippage considerations.

REMEMBER: Think like a professional trader - patience for optimal entries at key levels beats forcing entries at current price. Your entries should be where institutional traders would actually place their limit orders based on technical structure, not random prices near current market price.

CRITICAL: You MUST provide a trade_idea with direction "long" or "short" (never "none"). Return analysis in the exact JSON structure defined by the function schema.`;

    console.log('[ai-analyze] Calling OpenAI with function calling...');
    
    // Add timeout wrapper for OpenAI call
    const openaiTimeout = 60000; // 60 second timeout for OpenAI
    const openaiPromise = client.chat.completions.create({
      model: "gpt-4o-mini", // Use faster model to reduce latency
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

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 60 seconds')), openaiTimeout);
    });

    const response = await Promise.race([openaiPromise, timeoutPromise]);

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
      
      // Log timeframe_profile to debug missing signals
      console.log('[ai-analyze] timeframe_profile received:', JSON.stringify(parsed.timeframe_profile, null, 2));
      if (!parsed.timeframe_profile || !parsed.timeframe_profile.scalp || !parsed.timeframe_profile.intraday || !parsed.timeframe_profile.swing) {
        console.warn('[ai-analyze] ⚠️  Missing timeframe_profile signals!', {
          has_timeframe_profile: !!parsed.timeframe_profile,
          has_scalp: !!parsed.timeframe_profile?.scalp,
          has_intraday: !!parsed.timeframe_profile?.intraday,
          has_swing: !!parsed.timeframe_profile?.swing
        });
      }
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

    // ==================== VALIDATION PIPELINE START ====================
    const validationStartTime = Date.now();
    console.log(`[VALIDATION] ⏱️  Starting validation pipeline at ${new Date().toISOString()}`);
    
    // Validate and calculate accuracy metrics (reusing latestCandleTime from above)
    const dataAgeSeconds = Math.round((Date.now() - latestCandleTime) / 1000);
    const dataAgeMinutes = (dataAgeSeconds / 60).toFixed(2);
    
    console.log(`[VALIDATION] 📊 Data Freshness Check:`);
    console.log(`  - Latest candle: ${new Date(latestCandleTime).toISOString()}`);
    console.log(`  - Data age: ${dataAgeSeconds}s (${dataAgeMinutes} minutes)`);
    
    // TIMEFRAME-AWARE FRESHNESS CHECK
    // Adjust threshold based on timeframe (allow slightly more than the candle interval)
    const timeframeThresholds: Record<string, number> = {
      '1m': 120,    // 2 minutes
      '5m': 600,    // 10 minutes
      '15m': 1200,  // 20 minutes
      '30m': 2100,  // 35 minutes
      '1h': 3900,   // 65 minutes
      '4h': 15000,  // 250 minutes
      '1d': 90000   // 1500 minutes
    };
    
    const maxAgeSeconds = timeframeThresholds[timeframe] || 300; // default 5min for unknown
    const freshnessThreshold = maxAgeSeconds / 60;
    
    // Calculate freshness score relative to timeframe (lose 15 points per minute beyond half the threshold)
    const halfThreshold = maxAgeSeconds / 2;
    const freshness_score = Math.max(0, 100 - Math.max(0, (dataAgeSeconds - halfThreshold) / 60) * 15);
    console.log(`  - Freshness score: ${freshness_score.toFixed(2)}/100 (${timeframe} threshold: ${freshnessThreshold.toFixed(1)}min)`);
    
    // Critical: Block analysis only if data is VERY stale (exceeds timeframe threshold)
    if (dataAgeSeconds > maxAgeSeconds) {
      console.error(`[VALIDATION] ❌ CRITICAL: Data is ${dataAgeMinutes} minutes old (>${freshnessThreshold.toFixed(1)}min threshold for ${timeframe}). Analysis blocked.`);
      return new Response(JSON.stringify({ 
        error: "Data too stale for accurate analysis",
        data_age_seconds: dataAgeSeconds,
        data_age_minutes: parseFloat(dataAgeMinutes),
        freshness_score: Math.round(freshness_score),
        timeframe,
        max_age_minutes: freshnessThreshold,
        message: `Market data is ${dataAgeMinutes} minutes old. For ${timeframe} analysis, data must be less than ${freshnessThreshold.toFixed(1)} minutes old. Please refresh and try again.`,
        timestamp: new Date().toISOString()
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (freshness_score < 70) {
      console.warn(`[VALIDATION] ⚠️  DATA STALENESS WARNING: Score ${freshness_score.toFixed(2)} < 70 (data is ${dataAgeMinutes} minutes old for ${timeframe} timeframe)`);
    } else {
      console.log(`[VALIDATION] ✅ Data is fresh for ${timeframe} timeframe`);
    }
    
    // Reuse livePrice from earlier in the function
    console.log(`[VALIDATION] 💰 Live Price: ${livePrice.toFixed(2)}`);
    
    // Validate entry logic relative to direction and current price
    const validationNotes: string[] = [];
    let entry_validity = 100;
    console.log(`[VALIDATION] 🎯 Entry Validity Check (starting at 100)...`);
    
    const tradeDirection = parsed.trade_idea?.direction;
    const entryPrice = parsed.trade_idea?.entry;
    const stopPrice = parsed.trade_idea?.stop;
    const targetPrice = parsed.trade_idea?.target1;
    
    console.log(`[VALIDATION] 📈 Trade Setup:`);
    console.log(`  - Direction: ${tradeDirection?.toUpperCase()}`);
    console.log(`  - Entry: ${entryPrice?.toFixed(2)}`);
    console.log(`  - Stop: ${stopPrice?.toFixed(2)}`);
    console.log(`  - Target: ${targetPrice?.toFixed(2)}`);
    
    if (tradeDirection === 'long') {
      console.log(`[VALIDATION] 🔵 LONG Trade Validation:`);
      // LONG: Entry should be AT OR BELOW current price (buy dip or at market)
      const entryDistancePercent = ((entryPrice/livePrice - 1) * 100).toFixed(2);
      console.log(`  - Entry vs Current: ${entryPrice.toFixed(2)} vs ${livePrice.toFixed(2)} (${entryDistancePercent}% difference)`);
      
      if (entryPrice > livePrice * 1.02) {
        const penalty = 40;
        entry_validity -= penalty;
        const warning = `⚠️ LONG entry ${entryPrice.toFixed(2)} is ${entryDistancePercent}% above current price ${livePrice.toFixed(2)} - should be at or below for long trades`;
        validationNotes.push(warning);
        console.warn(`[VALIDATION] ❌ Entry Invalid (-${penalty} points): ${warning}`);
      } else {
        console.log(`[VALIDATION] ✅ Entry Valid: LONG entry is at or below current price`);
      }
      
      // Stop should be BELOW entry
      console.log(`  - Stop vs Entry: ${stopPrice.toFixed(2)} vs ${entryPrice.toFixed(2)}`);
      if (stopPrice >= entryPrice) {
        const penalty = 30;
        entry_validity -= penalty;
        const warning = `⚠️ LONG stop ${stopPrice.toFixed(2)} is above/equal to entry ${entryPrice.toFixed(2)} - invalid risk management`;
        validationNotes.push(warning);
        console.warn(`[VALIDATION] ❌ Stop Invalid (-${penalty} points): ${warning}`);
      } else {
        console.log(`[VALIDATION] ✅ Stop Valid: Stop is below entry`);
      }
    } else if (tradeDirection === 'short') {
      console.log(`[VALIDATION] 🔴 SHORT Trade Validation:`);
      // SHORT: Entry should be AT OR ABOVE current price (sell rally or at market)
      const entryDistancePercent = ((1 - entryPrice/livePrice) * 100).toFixed(2);
      console.log(`  - Entry vs Current: ${entryPrice.toFixed(2)} vs ${livePrice.toFixed(2)} (${entryDistancePercent}% difference)`);
      
      if (entryPrice < livePrice * 0.98) {
        const penalty = 40;
        entry_validity -= penalty;
        const warning = `⚠️ SHORT entry ${entryPrice.toFixed(2)} is ${entryDistancePercent}% below current price ${livePrice.toFixed(2)} - should be at or above for short trades`;
        validationNotes.push(warning);
        console.warn(`[VALIDATION] ❌ Entry Invalid (-${penalty} points): ${warning}`);
      } else {
        console.log(`[VALIDATION] ✅ Entry Valid: SHORT entry is at or above current price`);
      }
      
      // Stop should be ABOVE entry
      console.log(`  - Stop vs Entry: ${stopPrice.toFixed(2)} vs ${entryPrice.toFixed(2)}`);
      if (stopPrice <= entryPrice) {
        const penalty = 30;
        entry_validity -= penalty;
        const warning = `⚠️ SHORT stop ${stopPrice.toFixed(2)} is below/equal to entry ${entryPrice.toFixed(2)} - invalid risk management`;
        validationNotes.push(warning);
        console.warn(`[VALIDATION] ❌ Stop Invalid (-${penalty} points): ${warning}`);
      } else {
        console.log(`[VALIDATION] ✅ Stop Valid: Stop is above entry`);
      }
    }
    
    console.log(`[VALIDATION] 📊 Entry Validity Score: ${entry_validity}/100`);
    
    // Validate support levels are below current price
    console.log(`[VALIDATION] 🔽 Support Level Validation:`);
    const support = parsed.levels?.support || [];
    console.log(`  - Total support levels: ${support.length}`);
    console.log(`  - Support prices: [${support.map(s => s.toFixed(2)).join(', ')}]`);
    
    const invalidSupport = support.filter((s: number) => s > livePrice * 1.01);
    if (invalidSupport.length > 0) {
      const penalty = 20;
      entry_validity -= penalty;
      const warning = `⚠️ ${invalidSupport.length} support level(s) above current price - support should be below price`;
      validationNotes.push(warning);
      console.warn(`[VALIDATION] ❌ Invalid Support (-${penalty} points): ${warning}`);
      console.warn(`  - Invalid levels: [${invalidSupport.map(s => s.toFixed(2)).join(', ')}]`);
    } else {
      console.log(`[VALIDATION] ✅ All support levels valid (below price)`);
    }
    
    // Validate resistance levels are above current price
    console.log(`[VALIDATION] 🔼 Resistance Level Validation:`);
    const resistance = parsed.levels?.resistance || [];
    console.log(`  - Total resistance levels: ${resistance.length}`);
    console.log(`  - Resistance prices: [${resistance.map(r => r.toFixed(2)).join(', ')}]`);
    
    const invalidResistance = resistance.filter((r: number) => r < livePrice * 0.99);
    if (invalidResistance.length > 0) {
      const penalty = 20;
      entry_validity -= penalty;
      const warning = `⚠️ ${invalidResistance.length} resistance level(s) below current price - resistance should be above price`;
      validationNotes.push(warning);
      console.warn(`[VALIDATION] ❌ Invalid Resistance (-${penalty} points): ${warning}`);
      console.warn(`  - Invalid levels: [${invalidResistance.map(r => r.toFixed(2)).join(', ')}]`);
    } else {
      console.log(`[VALIDATION] ✅ All resistance levels valid (above price)`);
    }
    
    console.log(`[VALIDATION] 📊 Updated Entry Validity Score: ${entry_validity}/100`);
    
    // ==================== ENTRY PRICE CORRECTION ====================
    // Post-processing: Correct invalid entries that are outside acceptable ranges
    console.log(`[VALIDATION] 🔧 Entry Price Correction Check:`);
    const originalEntry = parsed.trade_idea?.entry;
    let correctedEntry = originalEntry;
    let entryCorrected = false;
    const entryCorrections: string[] = [];
    
    const minValidEntry = livePrice * 0.97; // 3% below
    const maxValidEntry = livePrice * 1.03; // 3% above
    const idealMinEntry = livePrice * 0.98; // 2% below (preferred range)
    const idealMaxEntry = livePrice * 1.02; // 2% above (preferred range)
    
    console.log(`  - Original Entry: ${originalEntry?.toFixed(2)}`);
    console.log(`  - Valid Range: ${minValidEntry.toFixed(2)} - ${maxValidEntry.toFixed(2)} (±3%)`);
    console.log(`  - Ideal Range: ${idealMinEntry.toFixed(2)} - ${idealMaxEntry.toFixed(2)} (±2%)`);
    
    if (originalEntry && (originalEntry < minValidEntry || originalEntry > maxValidEntry)) {
      console.warn(`[VALIDATION] ⚠️  Entry ${originalEntry.toFixed(2)} is OUTSIDE valid range!`);
      
      // Find nearest valid level
      const allLevels = [
        ...support.map((s: number) => ({ price: s, type: 'support' })),
        ...resistance.map((r: number) => ({ price: r, type: 'resistance' })),
        { price: livePrice, type: 'current_price' }
      ];
      
      // Filter levels within valid range and matching trade direction
      const validLevels = allLevels.filter(level => {
        if (level.price < minValidEntry || level.price > maxValidEntry) return false;
        
        if (tradeDirection === 'long') {
          // For LONG, prefer levels at or below current price
          return level.price <= livePrice * 1.01; // Allow 1% above for immediate entries
        } else if (tradeDirection === 'short') {
          // For SHORT, prefer levels at or above current price
          return level.price >= livePrice * 0.99; // Allow 1% below for immediate entries
        }
        return true;
      });
      
      if (validLevels.length > 0) {
        // Find closest level to original entry
        const nearest = validLevels.reduce((prev, curr) => {
          const prevDiff = Math.abs(prev.price - originalEntry);
          const currDiff = Math.abs(curr.price - originalEntry);
          return currDiff < prevDiff ? curr : prev;
        });
        
        correctedEntry = nearest.price;
        entryCorrected = true;
        const correction = `Entry corrected from ${originalEntry.toFixed(2)} to ${correctedEntry.toFixed(2)} (nearest valid ${nearest.type})`;
        entryCorrections.push(correction);
        console.log(`[VALIDATION] ✅ ${correction}`);
      } else {
        // No valid levels found, use current price
        correctedEntry = livePrice;
        entryCorrected = true;
        const correction = `Entry corrected from ${originalEntry.toFixed(2)} to ${correctedEntry.toFixed(2)} (market entry at current price)`;
        entryCorrections.push(correction);
        console.log(`[VALIDATION] ✅ ${correction}`);
      }
      
      // Update parsed data
      if (parsed.trade_idea) {
        parsed.trade_idea.entry = correctedEntry;
      }
      
      // Add to validation notes
      validationNotes.push(`🔧 AUTO-CORRECTED: ${entryCorrections[0]}`);
      
      // Recalculate entry validity with corrected entry
      entry_validity = Math.max(entry_validity, 80); // Boost score since we corrected it
      console.log(`[VALIDATION] 📊 Entry Validity boosted to ${entry_validity}/100 after correction`);
    } else if (originalEntry) {
      console.log(`[VALIDATION] ✅ Entry is within valid range - no correction needed`);
    }
    
    console.log(`[VALIDATION] 📊 Updated Entry Validity Score: ${entry_validity}/100`);
    
    // ==================== SIGNAL CONFIDENCE AGREEMENT SCORE ====================
    console.log(`[VALIDATION] 🎯 Signal Confidence Agreement Analysis:`);
    
    const ema20 = features.technical.ema20;
    const ema50 = features.technical.ema50;
    const ema200 = features.technical.ema200;
    const macd_hist = features.technical.macd.hist;
    const rsi = features.technical.rsi14;
    
    console.log(`  - Technical Indicators:`);
    console.log(`    • Current Price: ${livePrice.toFixed(2)}`);
    console.log(`    • EMA20: ${ema20.toFixed(2)}`);
    console.log(`    • EMA50: ${ema50.toFixed(2)}`);
    console.log(`    • EMA200: ${ema200.toFixed(2)}`);
    console.log(`    • MACD Hist: ${macd_hist.toFixed(4)}`);
    console.log(`    • RSI: ${rsi.toFixed(2)}`);
    console.log(`    • Trade Direction: ${tradeDirection?.toUpperCase()}`);
    
    // Define strict indicator agreement rules
    const indicatorChecks = [];
    const conflictingSignals = [];
    let agreementCount = 0;
    let totalChecks = 0;
    
    if (tradeDirection === 'long') {
      console.log(`  - Checking LONG signal validity against indicators:`);
      
      // RSI Check: Should be < 70 for valid LONG
      totalChecks++;
      if (rsi < 70) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'RSI', status: 'AGREE', detail: `RSI ${rsi.toFixed(2)} < 70 ✓`, weight: 1 });
        console.log(`    ✅ RSI: ${rsi.toFixed(2)} < 70 (valid for LONG)`);
      } else {
        indicatorChecks.push({ indicator: 'RSI', status: 'CONFLICT', detail: `RSI ${rsi.toFixed(2)} >= 70 (overbought)`, weight: 1 });
        conflictingSignals.push(`RSI ${rsi.toFixed(2)} is overbought (>= 70) for LONG entry`);
        console.warn(`    ❌ RSI: ${rsi.toFixed(2)} >= 70 (OVERBOUGHT - conflicts with LONG)`);
      }
      
      // MACD Check: Should be > -0.0001 for valid LONG
      totalChecks++;
      if (macd_hist > -0.0001) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'MACD', status: 'AGREE', detail: `MACD ${macd_hist.toFixed(4)} > -0.0001 ✓`, weight: 1 });
        console.log(`    ✅ MACD: ${macd_hist.toFixed(4)} > -0.0001 (valid for LONG)`);
      } else {
        indicatorChecks.push({ indicator: 'MACD', status: 'CONFLICT', detail: `MACD ${macd_hist.toFixed(4)} <= -0.0001 (bearish)`, weight: 1 });
        conflictingSignals.push(`MACD histogram ${macd_hist.toFixed(4)} is bearish (<= -0.0001) for LONG entry`);
        console.warn(`    ❌ MACD: ${macd_hist.toFixed(4)} <= -0.0001 (BEARISH - conflicts with LONG)`);
      }
      
      // EMA200 Check: Price should be above EMA200 for valid LONG
      totalChecks++;
      if (livePrice > ema200) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'EMA200', status: 'AGREE', detail: `Price ${livePrice.toFixed(2)} > EMA200 ${ema200.toFixed(2)} ✓`, weight: 1 });
        console.log(`    ✅ EMA200: Price ${livePrice.toFixed(2)} > EMA200 ${ema200.toFixed(2)} (valid for LONG)`);
      } else {
        indicatorChecks.push({ indicator: 'EMA200', status: 'CONFLICT', detail: `Price ${livePrice.toFixed(2)} <= EMA200 ${ema200.toFixed(2)} (bearish trend)`, weight: 1 });
        conflictingSignals.push(`Price ${livePrice.toFixed(2)} is below EMA200 ${ema200.toFixed(2)} (bearish long-term trend)`);
        console.warn(`    ❌ EMA200: Price ${livePrice.toFixed(2)} <= EMA200 ${ema200.toFixed(2)} (BEARISH TREND - conflicts with LONG)`);
      }
      
      // Additional momentum checks for LONG
      totalChecks++;
      if (livePrice > ema20 && livePrice > ema50) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'AGREE', detail: 'Price above both EMAs ✓', weight: 0.5 });
        console.log(`    ✅ EMA 20/50: Price above both (bullish short-term)`);
      } else if (livePrice < ema20 && livePrice < ema50) {
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'CONFLICT', detail: 'Price below both EMAs', weight: 0.5 });
        conflictingSignals.push(`Price is below EMA20 and EMA50 (bearish short-term momentum)`);
        console.warn(`    ❌ EMA 20/50: Price below both (BEARISH SHORT-TERM - conflicts with LONG)`);
      } else {
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'NEUTRAL', detail: 'Mixed EMA signals', weight: 0.5 });
        console.log(`    ⚠️  EMA 20/50: Mixed signals (neutral)`);
      }
      
    } else if (tradeDirection === 'short') {
      console.log(`  - Checking SHORT signal validity against indicators:`);
      
      // RSI Check: Should be > 30 for valid SHORT
      totalChecks++;
      if (rsi > 30) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'RSI', status: 'AGREE', detail: `RSI ${rsi.toFixed(2)} > 30 ✓`, weight: 1 });
        console.log(`    ✅ RSI: ${rsi.toFixed(2)} > 30 (valid for SHORT)`);
      } else {
        indicatorChecks.push({ indicator: 'RSI', status: 'CONFLICT', detail: `RSI ${rsi.toFixed(2)} <= 30 (oversold)`, weight: 1 });
        conflictingSignals.push(`RSI ${rsi.toFixed(2)} is oversold (<= 30) for SHORT entry`);
        console.warn(`    ❌ RSI: ${rsi.toFixed(2)} <= 30 (OVERSOLD - conflicts with SHORT)`);
      }
      
      // MACD Check: Should be < 0.0001 for valid SHORT
      totalChecks++;
      if (macd_hist < 0.0001) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'MACD', status: 'AGREE', detail: `MACD ${macd_hist.toFixed(4)} < 0.0001 ✓`, weight: 1 });
        console.log(`    ✅ MACD: ${macd_hist.toFixed(4)} < 0.0001 (valid for SHORT)`);
      } else {
        indicatorChecks.push({ indicator: 'MACD', status: 'CONFLICT', detail: `MACD ${macd_hist.toFixed(4)} >= 0.0001 (bullish)`, weight: 1 });
        conflictingSignals.push(`MACD histogram ${macd_hist.toFixed(4)} is bullish (>= 0.0001) for SHORT entry`);
        console.warn(`    ❌ MACD: ${macd_hist.toFixed(4)} >= 0.0001 (BULLISH - conflicts with SHORT)`);
      }
      
      // EMA200 Check: Price should be below EMA200 for valid SHORT
      totalChecks++;
      if (livePrice < ema200) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'EMA200', status: 'AGREE', detail: `Price ${livePrice.toFixed(2)} < EMA200 ${ema200.toFixed(2)} ✓`, weight: 1 });
        console.log(`    ✅ EMA200: Price ${livePrice.toFixed(2)} < EMA200 ${ema200.toFixed(2)} (valid for SHORT)`);
      } else {
        indicatorChecks.push({ indicator: 'EMA200', status: 'CONFLICT', detail: `Price ${livePrice.toFixed(2)} >= EMA200 ${ema200.toFixed(2)} (bullish trend)`, weight: 1 });
        conflictingSignals.push(`Price ${livePrice.toFixed(2)} is above EMA200 ${ema200.toFixed(2)} (bullish long-term trend)`);
        console.warn(`    ❌ EMA200: Price ${livePrice.toFixed(2)} >= EMA200 ${ema200.toFixed(2)} (BULLISH TREND - conflicts with SHORT)`);
      }
      
      // Additional momentum checks for SHORT
      totalChecks++;
      if (livePrice < ema20 && livePrice < ema50) {
        agreementCount++;
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'AGREE', detail: 'Price below both EMAs ✓', weight: 0.5 });
        console.log(`    ✅ EMA 20/50: Price below both (bearish short-term)`);
      } else if (livePrice > ema20 && livePrice > ema50) {
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'CONFLICT', detail: 'Price above both EMAs', weight: 0.5 });
        conflictingSignals.push(`Price is above EMA20 and EMA50 (bullish short-term momentum)`);
        console.warn(`    ❌ EMA 20/50: Price above both (BULLISH SHORT-TERM - conflicts with SHORT)`);
      } else {
        indicatorChecks.push({ indicator: 'EMA 20/50', status: 'NEUTRAL', detail: 'Mixed EMA signals', weight: 0.5 });
        console.log(`    ⚠️  EMA 20/50: Mixed signals (neutral)`);
      }
    }
    
    // Calculate signal confidence agreement score (0-100%)
    const signal_confidence_agreement = Math.round((agreementCount / totalChecks) * 100);
    console.log(`\n[VALIDATION] 📊 Signal Confidence Agreement: ${agreementCount}/${totalChecks} checks passed = ${signal_confidence_agreement}%`);
    
    // Determine signal quality
    let signalQuality = 'STRONG';
    if (signal_confidence_agreement < 50) {
      signalQuality = 'WEAK';
      console.warn(`[VALIDATION] ⚠️  WEAK SIGNAL: Only ${signal_confidence_agreement}% indicator agreement`);
    } else if (signal_confidence_agreement < 75) {
      signalQuality = 'MODERATE';
      console.log(`[VALIDATION] ⚠️  MODERATE SIGNAL: ${signal_confidence_agreement}% indicator agreement`);
    } else {
      console.log(`[VALIDATION] ✅ STRONG SIGNAL: ${signal_confidence_agreement}% indicator agreement`);
    }
    
    // Log conflicts
    if (conflictingSignals.length > 0) {
      console.warn(`[VALIDATION] ⚠️  ${conflictingSignals.length} CONFLICTING SIGNAL(S) DETECTED:`);
      conflictingSignals.forEach((conflict, i) => {
        console.warn(`  ${i + 1}. ${conflict}`);
      });
    }
    
    // Use signal_confidence_agreement as the signal_clarity score
    const signal_clarity = signal_confidence_agreement;
    console.log(`[VALIDATION] 📊 Signal Clarity Score (from agreement): ${signal_clarity}/100`);
    
    // Level precision score
    const totalLevels = support.length + resistance.length;
    const level_precision = Math.min(100, 50 + totalLevels * 10);
    console.log(`[VALIDATION] 📏 Level Precision: ${totalLevels} total levels → ${level_precision}/100`);
    
    // Overall accuracy
    console.log(`[VALIDATION] 🧮 Overall Accuracy Calculation:`);
    console.log(`  - Formula: (freshness×0.3) + (clarity×0.3) + (precision×0.2) + (entry×0.2)`);
    console.log(`  - Weighted scores:`);
    console.log(`    • Freshness: ${freshness_score.toFixed(2)} × 0.3 = ${(freshness_score * 0.3).toFixed(2)}`);
    console.log(`    • Clarity:   ${signal_clarity.toFixed(2)} × 0.3 = ${(signal_clarity * 0.3).toFixed(2)}`);
    console.log(`    • Precision: ${level_precision.toFixed(2)} × 0.2 = ${(level_precision * 0.2).toFixed(2)}`);
    console.log(`    • Entry:     ${entry_validity.toFixed(2)} × 0.2 = ${(entry_validity * 0.2).toFixed(2)}`);
    
    const overall_accuracy = Math.round(
      (freshness_score * 0.3) + 
      (signal_clarity * 0.3) + 
      (level_precision * 0.2) + 
      (entry_validity * 0.2)
    );
    
    console.log(`[VALIDATION] 🎯 OVERALL ACCURACY: ${overall_accuracy}/100`);
    
    if (validationNotes.length === 0) {
      validationNotes.push(`✓ All validation checks passed`);
      validationNotes.push(`✓ Data age: ${dataAgeSeconds}s`);
      validationNotes.push(`✓ Entry ${entryPrice.toFixed(2)} vs Current ${livePrice.toFixed(2)}: Valid for ${tradeDirection}`);
      console.log(`[VALIDATION] ✅ Perfect validation - no warnings`);
    } else {
      console.log(`[VALIDATION] ⚠️  ${validationNotes.length} validation warning(s):`);
      validationNotes.forEach((note, i) => {
        console.log(`  ${i + 1}. ${note}`);
      });
    }
    
    const validationEndTime = Date.now();
    const validationDuration = validationEndTime - validationStartTime;
    console.log(`[VALIDATION] ⏱️  Validation completed in ${validationDuration}ms at ${new Date().toISOString()}`);
    console.log(`[VALIDATION] ==================== PIPELINE END ====================`);
    
    console.log('[ai-analyze] 📊 ACCURACY METRICS SUMMARY:', {
      freshness_score: Math.round(freshness_score),
      signal_clarity: Math.round(signal_clarity),
      level_precision: Math.round(level_precision),
      entry_validity: Math.round(entry_validity),
      overall_accuracy,
      validation_duration_ms: validationDuration,
      warnings_count: validationNotes.length
    });

    // Add data staleness warning to result if needed
    const stalenessWarning = freshness_score < 70 ? {
      warning: "DATA_STALENESS",
      severity: freshness_score < 40 ? "HIGH" : "MEDIUM",
      message: `Market data is ${dataAgeMinutes} minutes old. For volatile crypto markets, fresher data (<2min) provides more accurate signals.`,
      data_age_seconds: dataAgeSeconds,
      freshness_score: Math.round(freshness_score),
      recommendation: "Consider refreshing data for more reliable analysis"
    } : null;
    
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
      data_staleness_warning: stalenessWarning,
      entry_correction_applied: entryCorrected,
      entry_correction_details: entryCorrected ? {
        original_entry: originalEntry,
        corrected_entry: correctedEntry,
        corrections: entryCorrections,
        reason: "Entry outside valid price range (±3% of current price)"
      } : null,
      input_features: features,
      input_news: news || { event_risk: false, headline_hits_30m: 0 },
      accuracy_metrics: {
        data_freshness_score: Math.round(freshness_score),
        signal_clarity_score: Math.round(signal_clarity),
        signal_confidence_agreement: signal_confidence_agreement,
        signal_quality: signalQuality,
        level_precision_score: Math.round(level_precision),
        entry_validity_score: Math.round(entry_validity),
        overall_accuracy,
        validation_notes: validationNotes,
        indicator_agreement: {
          checks: indicatorChecks,
          agreement_count: agreementCount,
          total_checks: totalChecks,
          agreement_percentage: signal_confidence_agreement,
          conflicting_signals: conflictingSignals
        },
        data_age_info: {
          age_seconds: dataAgeSeconds,
          age_minutes: parseFloat(dataAgeMinutes),
          latest_candle_time: new Date(latestCandleTime).toISOString(),
          current_time: new Date().toISOString()
        }
      }
    };
    
    if (stalenessWarning) {
      console.warn(`[VALIDATION] ⚠️  Adding staleness warning to response: ${stalenessWarning.severity} severity`);
    }
    
    if (entryCorrected) {
      console.log(`[VALIDATION] 🔧 Entry correction applied and logged in response`);
    }

    // ==================== STORE ANALYSIS FOR BACKTESTING ====================
    console.log(`[BACKTESTING] 💾 Storing analysis in database for historical tracking...`);
    
    try {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const tradeIdea = parsed.trade_idea;
        if (tradeIdea && tradeIdea.entry && tradeIdea.stop) {
          const { error: insertError } = await supabase
            .from('trade_analyses')
            .insert({
              symbol,
              timeframe,
              market,
              direction: tradeIdea.direction || 'long',
              entry_price: tradeIdea.entry,
              stop_price: tradeIdea.stop,
              target1_price: tradeIdea.target1 || null,
              target2_price: tradeIdea.target2 || null,
              target3_price: tradeIdea.target3 || null,
              current_price_at_analysis: livePrice,
              confidence: parsed.confidence_calibrated || 50,
              signal_confidence_agreement: signal_confidence_agreement,
              overall_accuracy: overall_accuracy,
              analysis_data: result,
              outcome: 'PENDING'
            });
          
          if (insertError) {
            console.error('[BACKTESTING] ❌ Failed to store analysis:', insertError);
          } else {
            console.log('[BACKTESTING] ✅ Analysis stored successfully for backtesting');
          }
        }
      }
    } catch (dbError) {
      console.error('[BACKTESTING] ❌ Error storing analysis:', dbError);
      // Don't fail the request if storage fails
    }

    console.log(`[ai-analyze] Deterministic analysis completed: ${result.action} (${result.confidence_calibrated}% confidence)`);
    
    // Verify timeframe_profile is in final response
    console.log('[ai-analyze] Final response includes timeframe_profile:', {
      has_timeframe_profile: !!result.timeframe_profile,
      has_scalp: !!result.timeframe_profile?.scalp,
      has_intraday: !!result.timeframe_profile?.intraday,
      has_swing: !!result.timeframe_profile?.swing
    });
    
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

      const vwap = calculateVWAP(candles);
      const support = findSupportLevels(candles, priceRef);
      const resistance = findResistanceLevels(candles, priceRef);
      const liquidityZones = findLiquidityZones(candles, priceRef, vwap);
      const breakoutZones = findBreakoutZones(candles, priceRef, support, resistance);
      const orderBlocks = findOrderBlocks(candles, priceRef);

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
          vwap,
          support,
          resistance,
          liquidity_zones: liquidityZones,
          breakout_zones: breakoutZones,
          order_blocks: orderBlocks,
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
  
  const vwap = calculateVWAP(candles);
  const support = findSupportLevels(candles, priceRef);
  const resistance = findResistanceLevels(candles, priceRef);
  const liquidityZones = findLiquidityZones(candles, priceRef, vwap);
  const breakoutZones = findBreakoutZones(candles, priceRef, support, resistance);
  const orderBlocks = findOrderBlocks(candles, priceRef);
  
  return {
    technical: {
      ema20: calculateEMA(closes, 20), ema50: calculateEMA(closes, 50), ema200: calculateEMA(closes, 200),
      rsi14: calculateRSI(closes, 14), macd: calculateMACD(closes), atr14: calculateATR(highs, lows, closes, 14),
      bb: calculateBollingerBands(closes, 20, 2), vwap,
      support, resistance,
      liquidity_zones: liquidityZones,
      breakout_zones: breakoutZones,
      order_blocks: orderBlocks,
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

// Enhanced support/resistance using full candle data (not just lows/highs arrays)
function findSupportLevels(candles: any[], currentPrice: number): number[] {
  if (candles.length < 10) return [];
  
  // Use last 50 candles for better accuracy
  const recentCandles = candles.slice(-50);
  const lows = recentCandles.map(c => c.l);
  
  // Find swing lows where price bounced with volume confirmation
  const pivots: Array<{price: number, strength: number}> = [];
  for (let i = 3; i < recentCandles.length - 3; i++) {
    const candle = recentCandles[i];
    const prevCandles = recentCandles.slice(i-3, i);
    const nextCandles = recentCandles.slice(i+1, i+4);
    
    // Check if it's a swing low
    if (candle.l < Math.min(...prevCandles.map(c => c.l)) && 
        candle.l < Math.min(...nextCandles.map(c => c.l)) &&
        candle.l < currentPrice * 0.995) {
      
      // Calculate strength based on volume and bounce
      const avgVolume = recentCandles.slice(i-5, i+5).reduce((sum, c) => sum + (c.v || 1), 0) / 10;
      const volumeStrength = (candle.v || 1) / avgVolume;
      const bounceSize = (nextCandles[0].c - candle.l) / candle.l;
      const strength = volumeStrength * (1 + bounceSize * 100);
      
      pivots.push({ price: candle.l, strength });
    }
  }
  
  // Sort by strength and proximity to current price
  pivots.sort((a, b) => {
    const aProximity = Math.abs(currentPrice - a.price) / currentPrice;
    const bProximity = Math.abs(currentPrice - b.price) / currentPrice;
    return (b.strength / (1 + bProximity * 10)) - (a.strength / (1 + aProximity * 10));
  });
  
  return pivots.slice(0, 3).map(p => p.price).sort((a, b) => b - a);
}

function findResistanceLevels(candles: any[], currentPrice: number): number[] {
  if (candles.length < 10) return [];
  
  // Use last 50 candles for better accuracy
  const recentCandles = candles.slice(-50);
  const highs = recentCandles.map(c => c.h);
  
  // Find swing highs where price was rejected with volume confirmation
  const pivots: Array<{price: number, strength: number}> = [];
  for (let i = 3; i < recentCandles.length - 3; i++) {
    const candle = recentCandles[i];
    const prevCandles = recentCandles.slice(i-3, i);
    const nextCandles = recentCandles.slice(i+1, i+4);
    
    // Check if it's a swing high
    if (candle.h > Math.max(...prevCandles.map(c => c.h)) && 
        candle.h > Math.max(...nextCandles.map(c => c.h)) &&
        candle.h > currentPrice * 1.005) {
      
      // Calculate strength based on volume and rejection
      const avgVolume = recentCandles.slice(i-5, i+5).reduce((sum, c) => sum + (c.v || 1), 0) / 10;
      const volumeStrength = (candle.v || 1) / avgVolume;
      const rejectionSize = (candle.h - nextCandles[0].c) / candle.h;
      const strength = volumeStrength * (1 + rejectionSize * 100);
      
      pivots.push({ price: candle.h, strength });
    }
  }
  
  // Sort by strength and proximity to current price
  pivots.sort((a, b) => {
    const aProximity = Math.abs(currentPrice - a.price) / currentPrice;
    const bProximity = Math.abs(currentPrice - b.price) / currentPrice;
    return (b.strength / (1 + bProximity * 10)) - (a.strength / (1 + aProximity * 10));
  });
  
  return pivots.slice(0, 3).map(p => p.price).sort((a, b) => a - b);
}

// Find liquidity zones where institutional orders cluster
function findLiquidityZones(candles: any[], currentPrice: number, vwap: number) {
  const zones: any[] = [];
  
  // Round number liquidity (psychological levels)
  const roundBase = currentPrice >= 1000 ? 1000 : currentPrice >= 100 ? 100 : currentPrice >= 10 ? 10 : 1;
  const nearestRound = Math.round(currentPrice / roundBase) * roundBase;
  
  if (Math.abs(nearestRound - currentPrice) / currentPrice > 0.002) {
    zones.push({
      price: nearestRound,
      type: nearestRound > currentPrice ? "sell" : "buy",
      strength: "strong",
      description: `Round number liquidity at ${nearestRound.toFixed(2)}`
    });
  }
  
  // VWAP liquidity zone
  if (Math.abs(vwap - currentPrice) / currentPrice > 0.003) {
    zones.push({
      price: vwap,
      type: vwap > currentPrice ? "sell" : "buy",
      strength: "moderate",
      description: `VWAP liquidity zone at ${vwap.toFixed(2)}`
    });
  }
  
  // Previous day high/low liquidity
  const last24h = candles.slice(-24);
  if (last24h.length > 0) {
    const dayHigh = Math.max(...last24h.map(c => c.h));
    const dayLow = Math.min(...last24h.map(c => c.l));
    
    if (dayHigh > currentPrice * 1.002 && dayHigh < currentPrice * 1.05) {
      zones.push({
        price: dayHigh,
        type: "sell",
        strength: "strong",
        description: `Previous day high - sell-side liquidity at ${dayHigh.toFixed(2)}`
      });
    }
    
    if (dayLow < currentPrice * 0.998 && dayLow > currentPrice * 0.95) {
      zones.push({
        price: dayLow,
        type: "buy",
        strength: "strong",
        description: `Previous day low - buy-side liquidity at ${dayLow.toFixed(2)}`
      });
    }
  }
  
  // High volume nodes (price levels with repeated testing)
  const priceFrequency = new Map<number, number>();
  const priceStep = currentPrice * 0.001; // 0.1% buckets
  
  candles.slice(-100).forEach(c => {
    const bucket = Math.round((c.h + c.l) / 2 / priceStep) * priceStep;
    priceFrequency.set(bucket, (priceFrequency.get(bucket) || 0) + (c.v || 1));
  });
  
  const sortedPrices = Array.from(priceFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  sortedPrices.forEach(([price, volume]) => {
    if (Math.abs(price - currentPrice) / currentPrice > 0.005 && 
        Math.abs(price - currentPrice) / currentPrice < 0.03) {
      zones.push({
        price,
        type: price > currentPrice ? "sell" : "buy",
        strength: "moderate",
        description: `High volume node - ${volume > 0 ? 'strong' : 'weak'} liquidity at ${price.toFixed(2)}`
      });
    }
  });
  
  return zones.slice(0, 5);
}

// Find breakout zones (key psychological and structural levels)
function findBreakoutZones(candles: any[], currentPrice: number, support: number[], resistance: number[]) {
  const zones: any[] = [];
  
  // Resistance breakout zones
  resistance.forEach(level => {
    const distance = (level - currentPrice) / currentPrice;
    if (distance > 0.001 && distance < 0.05) {
      const recentTests = candles.slice(-20).filter(c => 
        Math.abs(c.h - level) / level < 0.003
      ).length;
      
      zones.push({
        price: level,
        type: "bullish",
        strength: recentTests > 2 ? "strong" : recentTests > 0 ? "moderate" : "weak",
        description: `Resistance breakout zone at ${level.toFixed(2)} (tested ${recentTests}x recently)`
      });
    }
  });
  
  // Support breakdown zones
  support.forEach(level => {
    const distance = (currentPrice - level) / currentPrice;
    if (distance > 0.001 && distance < 0.05) {
      const recentTests = candles.slice(-20).filter(c => 
        Math.abs(c.l - level) / level < 0.003
      ).length;
      
      zones.push({
        price: level,
        type: "bearish",
        strength: recentTests > 2 ? "strong" : recentTests > 0 ? "moderate" : "weak",
        description: `Support breakdown zone at ${level.toFixed(2)} (tested ${recentTests}x recently)`
      });
    }
  });
  
  return zones.slice(0, 4);
}

// Find order blocks (institutional accumulation/distribution zones)
function findOrderBlocks(candles: any[], currentPrice: number) {
  const blocks: any[] = [];
  const recentCandles = candles.slice(-30);
  
  for (let i = 1; i < recentCandles.length - 1; i++) {
    const candle = recentCandles[i];
    const prevCandle = recentCandles[i - 1];
    const nextCandle = recentCandles[i + 1];
    
    const avgVolume = recentCandles.slice(Math.max(0, i - 5), i + 1).reduce((sum, c) => sum + (c.v || 1), 0) / 6;
    const candleVolume = candle.v || 1;
    
    // Bullish order block: Strong buying pressure followed by upward move
    if (candleVolume > avgVolume * 1.5 && 
        candle.c > candle.o && 
        nextCandle.c > candle.h &&
        candle.h < currentPrice * 0.99) {
      
      blocks.push({
        high: candle.h,
        low: candle.l,
        type: "bullish",
        strength: candleVolume > avgVolume * 2 ? "strong" : "moderate",
        description: `Bullish order block ${candle.l.toFixed(2)}-${candle.h.toFixed(2)} (institutional buying)`
      });
    }
    
    // Bearish order block: Strong selling pressure followed by downward move
    if (candleVolume > avgVolume * 1.5 && 
        candle.c < candle.o && 
        nextCandle.c < candle.l &&
        candle.l > currentPrice * 1.01) {
      
      blocks.push({
        high: candle.h,
        low: candle.l,
        type: "bearish",
        strength: candleVolume > avgVolume * 2 ? "strong" : "moderate",
        description: `Bearish order block ${candle.l.toFixed(2)}-${candle.h.toFixed(2)} (institutional selling)`
      });
    }
  }
  
  return blocks.slice(0, 3);
}

function getMarketSession(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return 'ASIA';
  if (hour >= 8 && hour < 16) return 'EUROPE'; 
  return 'US';
}