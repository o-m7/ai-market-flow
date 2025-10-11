// Institutional Technical Analysis Engine v2.1 - Fixed Signal Inversion Bug
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const FUNCTION_VERSION = "2.7.7"; // Added forex market hours validation to prevent wasted OpenAI calls

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

// Simplified AI Analysis Schema - AI-Driven Decisions with News Integration
const InstitutionalTaResultSchema = {
  name: "InstitutionalTaResult",
  description: "Live AI-driven technical analysis integrated with real-time news sentiment",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Comprehensive market analysis including news impact" },
      action: { type: "string", enum: ["buy", "sell", "hold"], description: "AI-determined trading action based on technicals AND news" },
      action_text: { type: "string", description: "Detailed rationale incorporating news sentiment" },
      outlook: { type: "string", enum: ["bullish", "bearish", "neutral"], description: "Overall market outlook" },
      news_impact: {
        type: "object",
        properties: {
          sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"], description: "News sentiment" },
          impact_level: { type: "string", enum: ["high", "medium", "low"], description: "How much news influenced the signal" },
          key_factors: { type: "array", items: { type: "string" }, description: "Key news factors affecting the trade" },
          headline_count: { type: "number", description: "Number of relevant news articles" }
        },
        required: ["sentiment", "impact_level", "key_factors", "headline_count"]
      },
      market_structure: {
        type: "object",
        properties: {
          trend_direction: { type: "string", enum: ["strong_bullish", "bullish", "neutral", "bearish", "strong_bearish"] },
          market_phase: { type: "string", enum: ["trending", "range_bound", "consolidation", "breakout"] },
          volatility_regime: { type: "string", enum: ["low", "normal", "high", "extreme"] },
          session_context: { type: "string", description: "Current market session analysis" }
        },
        required: ["trend_direction", "market_phase", "volatility_regime", "session_context"]
      },
      levels: {
        type: "object",
        properties: {
          support: { type: "array", items: { type: "number" }, description: "Key support levels" },
          resistance: { type: "array", items: { type: "number" }, description: "Key resistance levels" },
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
              "61.8": { type: "number" }
            },
            required: ["23.6", "38.2", "50.0", "61.8"]
          },
          direction: { type: "string", enum: ["up", "down"] }
        },
        required: ["pivot_high", "pivot_low", "retracements", "direction"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long", "short", "hold"], description: "Trade direction - return 'hold' when conditions are unclear or conflicting. AI decides based on ALL factors including news" },
          entry: { type: "number", description: "Entry price at current market level or key technical level" },
          stop: { type: "number", description: "Stop loss level" },
          targets: { type: "array", items: { type: "number" }, description: "Profit targets" },
          rationale: { type: "string", description: "Complete rationale including technical + news factors" },
          time_horizon: { type: "string", enum: ["scalp", "intraday", "swing", "position"] },
          rr_estimate: { type: "number", description: "Risk-reward ratio" }
        },
        required: ["direction", "entry", "stop", "targets", "rationale", "time_horizon", "rr_estimate"]
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
      evidence: { type: "array", items: { type: "string" }, description: "Supporting evidence" },
      risks: { type: "string", description: "Risk factors and mitigation" },
      timeframe_profile: {
        type: "object",
        description: "Timeframe-specific trade predictions based on CURRENT price and indicators",
        properties: {
          scalp: {
            type: "object",
            properties: {
              entry: { type: "number", description: "Entry near current price for scalp trade" },
              stop: { type: "number", description: "Stop loss for scalp timeframe" },
              targets: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 3, description: "2-3 targets in correct direction from entry" },
              strategy: { type: "string", description: "Scalp strategy based on CURRENT momentum" },
              probability: { type: "number", minimum: 0, maximum: 100, description: "Win probability %" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          },
          intraday: {
            type: "object",
            properties: {
              entry: { type: "number", description: "Entry near current price for intraday trade" },
              stop: { type: "number", description: "Stop loss for intraday timeframe" },
              targets: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 3, description: "2-3 targets in correct direction from entry" },
              strategy: { type: "string", description: "Intraday strategy based on CURRENT trend" },
              probability: { type: "number", minimum: 0, maximum: 100, description: "Win probability %" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          },
          swing: {
            type: "object",
            properties: {
              entry: { type: "number", description: "Entry near current price for swing trade" },
              stop: { type: "number", description: "Stop loss for swing timeframe" },
              targets: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 3, description: "2-3 targets in correct direction from entry" },
              strategy: { type: "string", description: "Swing strategy based on CURRENT structure" },
              probability: { type: "number", minimum: 0, maximum: 100, description: "Win probability %" }
            },
            required: ["entry", "stop", "targets", "strategy", "probability"]
          }
        },
        required: ["scalp", "intraday", "swing"]
      },
      quantitative_metrics: {
        type: "object",
        description: "Quantitative risk metrics calculated from price data",
        properties: {
          sharpe_ratio: { type: "number", description: "Risk-adjusted return metric" },
          sortino_ratio: { type: "number", description: "Downside risk-adjusted return" },
          max_drawdown: { type: "number", description: "Maximum peak-to-trough decline" },
          volatility: { type: "number", description: "Annualized volatility" }
        },
        required: ["sharpe_ratio", "sortino_ratio", "max_drawdown", "volatility"]
      },
      json_version: { type: "string" }
    },
    required: [
      "summary", "action", "action_text", "outlook", "news_impact", "market_structure", 
      "levels", "fibonacci", "trade_idea", "technical", "confidence_model", 
      "confidence_calibrated", "evidence", "risks", "timeframe_profile", "quantitative_metrics", "json_version"
    ]
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add GET handler for health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      version: FUNCTION_VERSION,
      hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { symbol, timeframe, market, candles, currentPrice, snapshotTimeUTC, news, quantMetrics, debug } = body || {};

    console.log(`[ai-analyze v${FUNCTION_VERSION}] Processing analysis request: ${symbol} (${timeframe}, ${market})`);
    if (currentPrice) {
      console.log(`[ai-analyze] Live price provided: ${currentPrice}`);
    }
    if (snapshotTimeUTC) {
      console.log(`[ai-analyze] Snapshot timestamp provided: ${snapshotTimeUTC}`);
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
    
    // CRITICAL: Validate candle data quality BEFORE expensive API calls
    const lastCandle = candles[candles.length - 1];
    const candleAgeMinutes = (Date.now() - lastCandle.t) / (1000 * 60);
    
    // For FOREX: Reject if market is likely closed (data older than 30 minutes)
    if (market?.toUpperCase() === 'FOREX' && candleAgeMinutes > 30) {
      console.error(`[ai-analyze] FOREX market appears closed - last candle is ${candleAgeMinutes.toFixed(1)} minutes old`);
      return new Response(JSON.stringify({ 
        error: "Forex market is closed",
        details: `The last available data is ${candleAgeMinutes.toFixed(0)} minutes old. Forex markets are closed on weekends and outside trading hours. Please try again when the market is open.`,
        symbol,
        lastDataTime: new Date(lastCandle.t).toISOString()
      }), {
        status: 503, // Service Unavailable
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate candles have valid price data
    if (!lastCandle.c || !lastCandle.o || !lastCandle.h || !lastCandle.l) {
      console.error('[ai-analyze] Invalid candle data - missing OHLC prices');
      return new Response(JSON.stringify({ 
        error: "Invalid market data",
        details: "The provided candle data is incomplete or corrupted.",
        symbol
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
    
    // Validate that we have a valid live price
    if (!livePrice || typeof livePrice !== 'number' || isNaN(livePrice)) {
      console.error('[ai-analyze] Invalid or missing live price:', { currentPrice, technicalCurrent: features.technical.current, livePrice });
      return new Response(JSON.stringify({ 
        error: "No market data available",
        details: "Unable to determine current price. The market may be closed or data is unavailable for this symbol.",
        symbol,
        timeframe,
        market
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const latestCandleTime = candles[candles.length - 1]?.t || Date.now();
    const candleAge = Math.round((Date.now() - latestCandleTime) / 1000); // seconds
    
    // Extract technical indicators for template variables
    const ema20 = features.technical.ema20 || 0;
    const ema50 = features.technical.ema50 || 0;
    const ema200 = features.technical.ema200 || 0;
    const rsi = features.technical.rsi14 || 50;
    const macd = features.technical.macd?.hist || 0;
    const atr = features.technical.atr14 || 0;
    
    // Additional validation: ensure we have meaningful technical data
    if (!features.technical.ema20 && !features.technical.ema50 && !features.technical.rsi14) {
      console.error('[ai-analyze] No valid technical indicators - market may be closed or data unavailable');
      return new Response(JSON.stringify({ 
        error: "Insufficient market data for analysis",
        details: "Technical indicators could not be calculated. The market may be closed or data is unavailable for this symbol.",
        symbol,
        timeframe,
        market,
        suggestion: "Try a different symbol or check if the market is currently open."
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[ai-analyze] Using ${candles.length} candles, latest from ${new Date(latestCandleTime).toISOString()} (${candleAge}s ago)`);
    
    // AI-Driven prompt integrating news sentiment into signals
    const comprehensivePrompt = `You are an elite AI trading analyst. Analyze real market data AND news sentiment to generate ONE optimized trading signal.

LIVE MARKET DATA:
Symbol: ${symbol} | Timeframe: ${timeframe} | Asset: ${market}
Current Live Price: $${livePrice}
Data: ${candles.length} candles ending ${new Date(latestCandleTime).toISOString()} (${candleAge}s ago)

REAL-TIME TECHNICAL INDICATORS:
${JSON.stringify(features.technical, null, 2)}

PRICE STRUCTURE & LEVELS:
${JSON.stringify(features.levels, null, 2)}

NEWS SENTIMENT ANALYSIS:
${news ? `
- Sentiment: ${news.sentiment}
- Event Risk: ${news.event_risk ? 'HIGH' : 'LOW'}
- Recent Headlines: ${news.headline_hits_30m} articles in last 30 minutes
- Confidence: ${news.confidence}/10
` : 'No news data available'}

${quantMetrics ? `LIVE QUANTITATIVE INDICATORS:
RSI: ${quantMetrics.indicators?.rsi14}
EMAs: 20=${quantMetrics.indicators?.ema?.['20']} | 50=${quantMetrics.indicators?.ema?.['50']} | 200=${quantMetrics.indicators?.ema?.['200']}
MACD: line=${quantMetrics.indicators?.macd?.line}, signal=${quantMetrics.indicators?.macd?.signal}, hist=${quantMetrics.indicators?.macd?.hist}
Bollinger Bands: mid=${quantMetrics.indicators?.bb20?.mid}, upper=${quantMetrics.indicators?.bb20?.upper}, lower=${quantMetrics.indicators?.bb20?.lower}
ATR(14): ${quantMetrics.indicators?.atr14}
VWAP: ${quantMetrics.indicators?.vwap}` : ''}

CRITICAL DIRECTION DEFINITIONS:
🟢 LONG = BUY signal = Expecting price to GO UP = Bullish = Enter below current price, target above
🔴 SHORT = SELL signal = Expecting price to GO DOWN = Bearish = Enter above current price, target below
⚪ HOLD = Uncertain/Conflicting = Wait for clearer setup

🔴 CRITICAL: THIS IS A LIVE TRADING ANALYSIS - USE ONLY CURRENT DATA FOR FUTURE PREDICTIONS

CURRENT MARKET STATE (AS OF RIGHT NOW):
- Live Price: ${livePrice} (THIS IS THE CURRENT PRICE - DO NOT USE OLD PRICES)
- Latest Candle Time: ${new Date(latestCandleTime).toISOString()} (THIS IS THE MOST RECENT DATA POINT)
- Current Technical Readings: EMA20=${ema20}, EMA50=${ema50}, EMA200=${ema200}, RSI=${rsi}, MACD=${macd}

⚠️ YOU MUST GENERATE PREDICTIONS FOR THE FUTURE BASED ON THE CURRENT STATE ABOVE
⚠️ DO NOT REFERENCE PAST TRADES OR HISTORICAL ANALYSIS
⚠️ DO NOT USE OLD PRICE LEVELS FROM PREVIOUS CANDLES UNLESS THEY ARE RELEVANT SUPPORT/RESISTANCE

AI DECISION-MAKING INSTRUCTIONS:

1. ANALYZE CURRENT MARKET STRUCTURE (RIGHT NOW):
   - Where is price NOW relative to EMAs? (${livePrice} vs EMA20=${ema20}, EMA50=${ema50})
   - What is the CURRENT trend direction from recent candles?
   - What is the CURRENT MACD reading? (${macd})
   - What is the CURRENT RSI? (${rsi})
   - What is the CURRENT volume pattern?

2. CHECK CURRENT INDICATOR CONFLUENCE:
   Count how many indicators agree on CURRENT direction:
   ✅ At least 4 out of 6 indicators must agree → Proceed with signal
   ❌ Less than 4 indicators agree → Return "hold"
   
   6 Key Indicators to check (CURRENT readings):
   1. Current price ${livePrice} vs EMA20 ${ema20}
   2. Current price ${livePrice} vs EMA50/200
   3. CURRENT MACD histogram sign
   4. CURRENT RSI above/below 50
   5. Current price vs recent swing high/low
   6. CURRENT news sentiment alignment

3. INTEGRATE CURRENT NEWS SENTIMENT:
   - Bullish news NOW + Bullish technicals NOW → LONG signal
   - Bearish news NOW + Bearish technicals NOW → SHORT signal
   - Current news conflicts with current technicals → "hold"

4. DETERMINE FUTURE DIRECTION (PREDICTION FROM CURRENT STATE):
   
   Return "long" (BUY) when CURRENTLY:
   ✅ Price ${livePrice} is above EMA20 ${ema20} and showing bullish momentum
   ✅ MACD ${macd} is positive or turning positive NOW
   ✅ RSI ${rsi} shows bullish bias (>50) or oversold bounce potential
   ✅ At least 4/6 CURRENT indicators are bullish
   ✅ PREDICT price will move UP from current level ${livePrice}
   
   Return "short" (SELL) when CURRENTLY:
   ✅ Price ${livePrice} is below EMA20 ${ema20} and showing bearish momentum
   ✅ MACD ${macd} is negative or turning negative NOW
   ✅ RSI ${rsi} shows bearish bias (<50) or overbought rejection potential
   ✅ At least 4/6 CURRENT indicators are bearish
   ✅ PREDICT price will move DOWN from current level ${livePrice}
   
   Return "hold" when:
   ⚪ Current indicators are mixed or conflicting
   ⚪ Current news conflicts with current technicals
   ⚪ No clear directional bias RIGHT NOW

5. SET FUTURE TARGETS FROM CURRENT PRICE ${livePrice}:
    
    For LONG trades (predicting UP movement):
    - Entry: ${livePrice} (or slightly above, within 0.5% of current price)
    - Stop: Below current price minus 1.5 ATR (protecting against DOWN move)
    - Target 1: Above ${livePrice} at nearest resistance (predict UP move, R:R ≥ 2.0)
    - Target 2: Above Target 1 at next resistance (predict further UP, R:R ≥ 3.0)
    - Target 3: Above Target 2 at major resistance (predict extended UP, R:R ≥ 4.0)
    - VERIFY: ALL TARGETS > ${livePrice} (must be higher prices for UP move)
    
    For SHORT trades (predicting DOWN movement):
    - Entry: ${livePrice} (or slightly below, within 0.5% of current price)
    - Stop: Above current price plus 1.5 ATR (protecting against UP move)
    - Target 1: Below ${livePrice} at nearest support (predict DOWN move, R:R ≥ 2.0)
    - Target 2: Below Target 1 at next support (predict further DOWN, R:R ≥ 3.0)
    - Target 3: Below Target 2 at major support (predict extended DOWN, R:R ≥ 4.0)
    - VERIFY: ALL TARGETS < ${livePrice} (must be lower prices for DOWN move)

6. GENERATE TIMEFRAME-SPECIFIC PREDICTIONS:
   
   🚨 MANDATORY: ALL ENTRIES MUST USE CURRENT LIVE PRICE ${livePrice}
   🚨 DO NOT use historical prices, do not use prices from past candles
   🚨 If entry deviates more than specified % from ${livePrice}, it will be REJECTED
   
   **SCALP (1-15 minutes):**
   📍 ENTRY MUST BE: ${(livePrice * 0.999).toFixed(2)} to ${(livePrice * 1.001).toFixed(2)} (${livePrice} ± 0.1%)
   - Entry: Exactly ${livePrice} or within 0.1% (${(livePrice * 0.999).toFixed(2)}-${(livePrice * 1.001).toFixed(2)})
   - Stop: 0.3-0.5 ATR from entry (tight stop for quick trades)
   - Targets: 2-3 levels within 0.5-1.5% of entry (quick profits)
   - Strategy: Describe current micro-momentum and immediate price action expected
   - Probability: 60-75% (higher confidence for short-term moves)
   
   **INTRADAY (15min-4hr):**
   📍 ENTRY MUST BE: ${(livePrice * 0.997).toFixed(2)} to ${(livePrice * 1.003).toFixed(2)} (${livePrice} ± 0.3%)
   - Entry: Exactly ${livePrice} or within 0.3% (${(livePrice * 0.997).toFixed(2)}-${(livePrice * 1.003).toFixed(2)})
   - Stop: 1.0-1.5 ATR from entry (moderate stop)
   - Targets: 2-3 levels at key support/resistance (1-3% moves)
   - Strategy: Describe current trend and session expectations
   - Probability: 55-70% (moderate confidence)
   
   **SWING (4hr-Daily):**
   📍 ENTRY MUST BE: ${(livePrice * 0.995).toFixed(2)} to ${(livePrice * 1.005).toFixed(2)} (${livePrice} ± 0.5%)
   - Entry: Exactly ${livePrice} or within 0.5% (${(livePrice * 0.995).toFixed(2)}-${(livePrice * 1.005).toFixed(2)})
   - Stop: 1.5-2.0 ATR from entry (wider stop for bigger moves)
   - Targets: 2-3 major levels (3-8% moves)
   - Strategy: Describe current structure and multi-day outlook
   - Probability: 50-65% (lower confidence for longer-term)
   
   🚨 VALIDATION RULES (violations will cause function rejection):
   ⛔ SCALP entry outside ${(livePrice * 0.999).toFixed(2)}-${(livePrice * 1.001).toFixed(2)} = INVALID
   ⛔ INTRADAY entry outside ${(livePrice * 0.997).toFixed(2)}-${(livePrice * 1.003).toFixed(2)} = INVALID
   ⛔ SWING entry outside ${(livePrice * 0.995).toFixed(2)}-${(livePrice * 1.005).toFixed(2)} = INVALID
   ⚠️ FOR SHORT TRADES: ALL targets must be BELOW entry/current price
   ⚠️ FOR LONG TRADES: ALL targets must be ABOVE entry/current price

7. CALCULATE QUANTITATIVE METRICS:
   
   Based on the price series provided, calculate:
   - sharpe_ratio: (annualized return - risk_free_rate) / volatility
     * Use recent 20-50 period returns
     * Typical range: -2.0 to +3.0 (not -0.000!)
     * Positive = good risk-adjusted returns, negative = poor performance
   
   - sortino_ratio: (annualized return - risk_free_rate) / downside_deviation
     * Similar to Sharpe but only penalizes downside volatility
     * Typical range: -2.0 to +4.0
   
   - max_drawdown: Maximum peak-to-trough decline
     * Express as decimal (e.g., 0.15 for 15% drawdown)
     * Typical range: 0.05 to 0.40 for crypto
   
   - volatility: Annualized standard deviation of returns
     * Express as decimal (e.g., 0.65 for 65% annual volatility)
     * Typical range: 0.30 to 1.50 for crypto
   
   ⚠️ DO NOT return -0.000 or 0.000 for all metrics
   ⚠️ Calculate from actual price data provided
   ⚠️ These metrics help assess risk-adjusted performance

🔴 CRITICAL VALIDATION RULES:
✅ ALL prices/targets must be relative to CURRENT price ${livePrice}
✅ LONG = predict UP → entry ≈ ${livePrice}, targets > ${livePrice}
✅ SHORT = predict DOWN → entry ≈ ${livePrice}, targets < ${livePrice}
✅ Use ONLY current indicator readings, not historical patterns
✅ Generate FORWARD-LOOKING predictions, not backward analysis
✅ Each timeframe must have unique, fresh predictions from current state
✅ Calculate proper quantitative metrics (not zeros)
❌ NEVER use old prices from past candles as entry/targets
❌ NEVER reference past trades or historical analysis
❌ NEVER generate LONG with targets below ${livePrice}
❌ NEVER generate SHORT with targets above ${livePrice}
❌ NEVER copy/paste same levels across different timeframes
❌ NEVER return -0.000 or all zeros for quant metrics`;

    console.log('[ai-analyze] Calling OpenAI with news-integrated analysis...');
    
    // Add timeout wrapper for OpenAI call
    const openaiTimeout = 60000; // 60 second timeout for OpenAI
    const openaiPromise = client.chat.completions.create({
      model: "gpt-4o", // Reliable model with good access
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
      console.log('[ai-analyze] Analysis includes news_impact:', !!parsed.news_impact);
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
    
    // Validate that parsed result has required fields
    if (!parsed.trade_idea || !parsed.trade_idea.direction) {
      console.error('[ai-analyze] AI response missing trade_idea or direction:', JSON.stringify(parsed, null, 2).slice(0, 500));
      return new Response(JSON.stringify({ 
        error: "AI response missing trade_idea structure",
        details: "The AI model did not return a properly structured trade recommendation. This may be due to insufficient data or model constraints.",
        debug: {
          hasSummary: !!parsed.summary,
          hasAction: !!parsed.action,
          hasTradeIdea: !!parsed.trade_idea,
          hasDirection: !!parsed.trade_idea?.direction
        }
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
    
    // Check for snapshot timestamp for more accurate freshness validation
    let effectiveAgeSeconds = dataAgeSeconds;
    let effectiveAgeMinutes = dataAgeMinutes;
    
    if (snapshotTimeUTC) {
      const snapshotTime = new Date(snapshotTimeUTC).getTime();
      const snapshotAgeSeconds = Math.round((Date.now() - snapshotTime) / 1000);
      const snapshotAgeMinutes = (snapshotAgeSeconds / 60).toFixed(2);
      
      console.log(`[VALIDATION] 📸 Snapshot detected:`);
      console.log(`  - Snapshot time: ${snapshotTimeUTC}`);
      console.log(`  - Snapshot age: ${snapshotAgeSeconds}s (${snapshotAgeMinutes} minutes)`);
      
      // If snapshot is fresher than 2 minutes, use it for freshness validation
      if (snapshotAgeSeconds < 120) {
        console.log(`[VALIDATION] ✅ Using snapshot timestamp for freshness (< 2min old)`);
        effectiveAgeSeconds = snapshotAgeSeconds;
        effectiveAgeMinutes = snapshotAgeMinutes;
      } else {
        console.log(`[VALIDATION] ⚠️  Snapshot is stale (${snapshotAgeMinutes}min), using candle timestamp`);
      }
    }
    
    console.log(`[VALIDATION] 📊 Data Freshness Check:`);
    console.log(`  - Latest candle: ${new Date(latestCandleTime).toISOString()}`);
    console.log(`  - Effective data age: ${effectiveAgeSeconds}s (${effectiveAgeMinutes} minutes)`);
    
    // TIMEFRAME-AWARE FRESHNESS CHECK
    // Adjust threshold based on timeframe AND market type
    // Forex trades 24/5 (closed weekends), crypto trades 24/7, stocks trade market hours
    const isForex = market?.toLowerCase() === 'forex' || symbol?.includes('/');
    const isCrypto = market?.toLowerCase() === 'crypto' || market?.toLowerCase() === 'cryptocurrency';
    
    const timeframeThresholds: Record<string, number> = {
      '1m': 90,     // 1.5 minutes
      '5m': 360,    // 6 minutes
      '15m': 900,   // 15 minutes
      '30m': 1800,  // 30 minutes
      '1h': 4200,   // 70 minutes
      '4h': 15600,  // 4.3 hours
      '1d': 28800   // 8 hours
    };
    
    // For forex, use much more lenient thresholds since data can be delayed and markets close on weekends
    const forexMultiplier = isForex ? 6 : 1; // 6x more lenient for forex (handles weekends, quiet periods)
    const maxAgeSeconds = (timeframeThresholds[timeframe] || 300) * forexMultiplier;
    const freshnessThreshold = maxAgeSeconds / 60;
    
    console.log(`  - Market type: ${market} (isForex: ${isForex}, isCrypto: ${isCrypto})`);
    console.log(`  - Using ${forexMultiplier}x multiplier for freshness threshold`);
    
    // Calculate freshness score relative to timeframe (lose 15 points per minute beyond half the threshold)
    const halfThreshold = maxAgeSeconds / 2;
    const freshness_score = Math.max(0, 100 - Math.max(0, (effectiveAgeSeconds - halfThreshold) / 60) * 15);
    console.log(`  - Freshness score: ${freshness_score.toFixed(2)}/100 (${timeframe} threshold: ${freshnessThreshold.toFixed(1)}min)`);
    
    // Critical: Block analysis only if data is VERY stale (exceeds timeframe threshold)
    if (effectiveAgeSeconds > maxAgeSeconds) {
      console.error(`[VALIDATION] ❌ CRITICAL: Data is ${effectiveAgeMinutes} minutes old (>${freshnessThreshold.toFixed(1)}min threshold for ${timeframe}). Analysis blocked.`);
      return new Response(JSON.stringify({ 
        error: "Data too stale for accurate analysis",
        data_age_seconds: effectiveAgeSeconds,
        data_age_minutes: parseFloat(effectiveAgeMinutes),
        freshness_score: Math.round(freshness_score),
        timeframe,
        max_age_minutes: freshnessThreshold,
        message: `Market data is ${effectiveAgeMinutes} minutes old. For ${timeframe} analysis, data must be less than ${freshnessThreshold.toFixed(1)} minutes old. Please refresh and try again.`,
        timestamp: new Date().toISOString()
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (freshness_score < 70) {
      console.warn(`[VALIDATION] ⚠️  DATA STALENESS WARNING: Score ${freshness_score.toFixed(2)} < 70 (data is ${effectiveAgeMinutes} minutes old for ${timeframe} timeframe)`);
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
    
    // Target validation - Check EACH target for proper direction
    console.log(`[VALIDATION] 🎯 Target Validation for ${tradeDirection?.toUpperCase()} trade:`);
    const targets = parsed.trade_idea?.targets || [];
    if (targets.length > 0) {
      targets.forEach((target: number, idx: number) => {
        console.log(`  - Target ${idx + 1}: ${target?.toFixed(2)}`);
        
        if (tradeDirection === 'long') {
          // LONG: ALL targets must be ABOVE entry
          if (target <= entryPrice) {
            const penalty = 50;
            entry_validity -= penalty;
            const warning = `⚠️ LONG Target ${idx + 1} (${target?.toFixed(2)}) is at or below entry (${entryPrice?.toFixed(2)}) - targets must be ABOVE entry for long trades`;
            validationNotes.push(warning);
            console.error(`[VALIDATION] ❌ Target ${idx + 1} Invalid (-${penalty} points): ${warning}`);
          } else {
            console.log(`[VALIDATION] ✅ Target ${idx + 1} Valid: Above entry`);
          }
          
          // Verify targets are in ascending order
          if (idx > 0 && target <= targets[idx - 1]) {
            const penalty = 20;
            entry_validity -= penalty;
            const warning = `⚠️ LONG targets not in ascending order: Target ${idx + 1} (${target?.toFixed(2)}) should be > Target ${idx} (${targets[idx - 1]?.toFixed(2)})`;
            validationNotes.push(warning);
            console.error(`[VALIDATION] ❌ Target Ordering Invalid (-${penalty} points): ${warning}`);
          }
        } else if (tradeDirection === 'short') {
          // SHORT: ALL targets must be BELOW entry
          if (target >= entryPrice) {
            const penalty = 50;
            entry_validity -= penalty;
            const warning = `⚠️ SHORT Target ${idx + 1} (${target?.toFixed(2)}) is at or above entry (${entryPrice?.toFixed(2)}) - targets must be BELOW entry for short trades`;
            validationNotes.push(warning);
            console.error(`[VALIDATION] ❌ Target ${idx + 1} Invalid (-${penalty} points): ${warning}`);
          } else {
            console.log(`[VALIDATION] ✅ Target ${idx + 1} Valid: Below entry`);
          }
          
          // Verify targets are in descending order
          if (idx > 0 && target >= targets[idx - 1]) {
            const penalty = 20;
            entry_validity -= penalty;
            const warning = `⚠️ SHORT targets not in descending order: Target ${idx + 1} (${target?.toFixed(2)}) should be < Target ${idx} (${targets[idx - 1]?.toFixed(2)})`;
            validationNotes.push(warning);
            console.error(`[VALIDATION] ❌ Target Ordering Invalid (-${penalty} points): ${warning}`);
          }
        }
      });
    }
    
    // Validate support levels are below current price
    console.log(`[VALIDATION] 🔽 Support Level Validation:`);
    const support = parsed.levels?.support || [];
    console.log(`  - Total support levels: ${support.length}`);
    console.log(`  - Support prices: [${support.map((s: number) => s?.toFixed?.(2) || 'invalid').join(', ')}]`);
    
    const invalidSupport = support.filter((s: number) => s > livePrice * 1.01);
    if (invalidSupport.length > 0) {
      const penalty = 20;
      entry_validity -= penalty;
      const warning = `⚠️ ${invalidSupport.length} support level(s) above current price - support should be below price`;
      validationNotes.push(warning);
      console.warn(`[VALIDATION] ❌ Invalid Support (-${penalty} points): ${warning}`);
      console.warn(`  - Invalid levels: [${invalidSupport.map((s: number) => s?.toFixed?.(2) || 'invalid').join(', ')}]`);
    } else {
      console.log(`[VALIDATION] ✅ All support levels valid (below price)`);
    }
    
    // Validate resistance levels are above current price
    console.log(`[VALIDATION] 🔼 Resistance Level Validation:`);
    const resistance = parsed.levels?.resistance || [];
    console.log(`  - Total resistance levels: ${resistance.length}`);
    console.log(`  - Resistance prices: [${resistance.map((r: number) => r?.toFixed?.(2) || 'invalid').join(', ')}]`);
    
    const invalidResistance = resistance.filter((r: number) => r < livePrice * 0.99);
    if (invalidResistance.length > 0) {
      const penalty = 20;
      entry_validity -= penalty;
      const warning = `⚠️ ${invalidResistance.length} resistance level(s) below current price - resistance should be above price`;
      validationNotes.push(warning);
      console.warn(`[VALIDATION] ❌ Invalid Resistance (-${penalty} points): ${warning}`);
      console.warn(`  - Invalid levels: [${invalidResistance.map((r: number) => r?.toFixed?.(2) || 'invalid').join(', ')}]`);
    } else {
      console.log(`[VALIDATION] ✅ All resistance levels valid (above price)`);
    }
    
    console.log(`[VALIDATION] 📊 Updated Entry Validity Score: ${entry_validity}/100`);
    
    // ==================== TIMEFRAME PROFILE VALIDATION ====================
    console.log(`[VALIDATION] 📅 Validating timeframe_profile signals...`);
    
    // Validate and correct timeframe_profile entries to ensure they use current prices
    const timeframeProfile = parsed.timeframe_profile || {};
    const correctedTimeframeProfile: any = {};
    let timeframeCorrections = 0;
    
    ['scalp', 'intraday', 'swing'].forEach(tf => {
      const signal = timeframeProfile[tf];
      if (!signal) {
        console.log(`[VALIDATION] ⚠️  No ${tf} signal in timeframe_profile`);
        return;
      }
      
      const tfEntry = signal.entry;
      const tfStop = signal.stop;
      const tfTargets = signal.targets || [];
      
      console.log(`[VALIDATION] 📊 ${tf.toUpperCase()} Signal:`);
      console.log(`  - Original Entry: ${tfEntry?.toFixed(2)}`);
      console.log(`  - Original Stop: ${tfStop?.toFixed(2)}`);
      console.log(`  - Original Targets: [${tfTargets.map((t: number) => t?.toFixed(2)).join(', ')}]`);
      
      // ALWAYS correct entries to use EXACT live price regardless of how close AI got
      // This ensures all signals are executable at current market conditions
      const entryDiffPercent = Math.abs((tfEntry - livePrice) / livePrice * 100);
      console.log(`  - Entry difference from current: ${entryDiffPercent.toFixed(3)}%`);
      console.log(`  - Current live price: ${livePrice.toFixed(2)}`);
      console.log(`  - FORCING entry to match live price for accurate signals`);
      
      if (true) { // Always correct to ensure accuracy
        console.log(`[VALIDATION] 🔧 ${tf.toUpperCase()} CORRECTING entry from ${tfEntry?.toFixed(2)} to live price ${livePrice.toFixed(2)}`);
        
        // Set entry to EXACT live price for immediate market execution
        const correctedEntry = livePrice;
        
        // Calculate stop and targets from current price using ATR
        const atrValue = atr || (livePrice * 0.02); // Use 2% if ATR is 0
        const atrMultiplier = tf === 'scalp' ? 0.5 : tf === 'intraday' ? 1.5 : 2.5;
        const targetMultipliers = tf === 'scalp' ? [1.0, 1.5, 2.0] : tf === 'intraday' ? [2.0, 3.0, 4.0] : [3.5, 5.0, 7.0];
        
        let correctedStop, correctedTargets;
        if (tradeDirection === 'long') {
          // LONG: stop below, targets above
          correctedStop = correctedEntry - (atrValue * atrMultiplier);
          correctedTargets = targetMultipliers.map(mult => correctedEntry + (atrValue * mult));
        } else {
          // SHORT: stop above, targets below
          correctedStop = correctedEntry + (atrValue * atrMultiplier);
          correctedTargets = targetMultipliers.map(mult => correctedEntry - (atrValue * mult));
        }
        
        console.log(`[VALIDATION] 🔧 ${tf.toUpperCase()} CORRECTED:`);
        console.log(`  - New Entry: ${correctedEntry.toFixed(2)}`);
        console.log(`  - New Stop: ${correctedStop.toFixed(2)}`);
        console.log(`  - New Targets: [${correctedTargets.map(t => t.toFixed(2)).join(', ')}]`);
        
        correctedTimeframeProfile[tf] = {
          ...signal,
          entry: correctedEntry,
          stop: correctedStop,
          targets: correctedTargets
        };
        
        timeframeCorrections++;
      }
    });
    
    // ALWAYS apply the corrected profile (even if no corrections, to ensure consistency)
    parsed.timeframe_profile = correctedTimeframeProfile;
    
    if (timeframeCorrections > 0) {
      console.log(`[VALIDATION] 🔧 Applied ${timeframeCorrections} timeframe signal corrections`);
    } else {
      console.log(`[VALIDATION] ✅ All timeframe signals were already valid`);
    }
    
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
    
    // Use already-declared variables from earlier in the function
    const macd_hist = features.technical.macd.hist;
    
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
    
    // ==================== SIGNAL QUALITY FILTERS ====================
    
    // Check if direction is "hold" OR if action is "hold" - return early without saving to database
    if (parsed.trade_idea?.direction === 'hold' || parsed.action === 'hold') {
      console.log(`[VALIDATION] ⚪ AI returned "hold" signal - no trade recommended`);
      
      // Build a proper response with the hold recommendation
      const holdResponse = {
        symbol,
        timestamp: new Date().toISOString(),
        recommendation: 'hold',
        signal: 'hold', // Add for frontend compatibility
        confidence: 0, // Hold signals have 0 confidence for trading
        holdReason: parsed.trade_idea?.rationale || parsed.action_text || 'Market conditions are unclear or conflicting. Waiting for better setup.',
        analysis: parsed.summary || 'Technical indicators do not show strong directional bias. Recommend waiting for clearer signals.',
        outlook: parsed.outlook || 'neutral',
        action: 'hold',
        action_text: parsed.action_text || 'No trade recommended at this time',
        news_impact: parsed.news_impact,
        market_structure: parsed.market_structure,
        keyLevels: {
          support: parsed.levels?.support?.filter((s: number) => typeof s === 'number' && isFinite(s) && s < livePrice) || [],
          resistance: parsed.levels?.resistance?.filter((r: number) => typeof r === 'number' && isFinite(r) && r > livePrice) || []
        },
        technicalIndicators: {
          rsi: parsed.technical?.rsi14 || 50,
          trend: 'neutral',
          momentum: 'neutral'
        },
        chartPatterns: [],
        priceTargets: {
          bullish: 0,
          bearish: 0
        },
        riskAssessment: {
          level: 'medium',
          factors: ['Conditions unclear - waiting for better setup']
        },
        rejectionDetails: {
          confidence_agreement: signal_confidence_agreement,
          reason: 'Insufficient indicator confluence or conflicting signals',
          indicator_agreement: {
            checks: indicatorChecks,
            agreement_count: agreementCount,
            total_checks: totalChecks
          }
        }
      };
      
      return new Response(JSON.stringify(holdResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Reject signals with low confidence agreement - return as HOLD
    if (signal_confidence_agreement < 67) {
      console.warn(`[VALIDATION] ⚠️  Signal rejected: confidence agreement ${signal_confidence_agreement}% below threshold (need ≥67% = 4/6 indicators)`);
      
      const holdResponse = {
        symbol,
        timestamp: new Date().toISOString(),
        recommendation: 'hold',
        signal: 'hold', // Add for frontend compatibility
        confidence: 0,
        holdReason: `Only ${agreementCount}/${totalChecks} indicators agree on ${tradeDirection.toUpperCase()} direction. Need at least 4 out of 6 indicators to confirm before generating trade signal.`,
        analysis: parsed.summary || `Insufficient indicator confluence for ${tradeDirection} trade. ${conflictingSignals.length} conflicting signal(s) detected.`,
        outlook: 'neutral',
        action: 'hold',
        action_text: `Indicators show mixed signals (${signal_confidence_agreement}% agreement). Wait for stronger confluence before entering.`,
        news_impact: parsed.news_impact,
        keyLevels: {
          support: parsed.levels?.support?.filter((s: number) => typeof s === 'number' && isFinite(s) && s < livePrice) || [],
          resistance: parsed.levels?.resistance?.filter((r: number) => typeof r === 'number' && isFinite(r) && r > livePrice) || []
        },
        technicalIndicators: {
          rsi: parsed.technical?.rsi14 || 50,
          trend: 'neutral',
          momentum: 'neutral'
        },
        chartPatterns: [],
        priceTargets: { bullish: 0, bearish: 0 },
        riskAssessment: {
          level: 'medium',
          factors: [`Low indicator agreement: ${signal_confidence_agreement}%`, 'Conflicting technical signals']
        },
        rejectionDetails: {
          _type: 'confidence_agreement',
          value: signal_confidence_agreement,
          threshold: 67,
          agreement_count: agreementCount,
          total_checks: totalChecks,
          conflicting_signals: conflictingSignals,
          indicator_agreement: {
            checks: indicatorChecks,
            agreement_count: agreementCount,
            total_checks: totalChecks
          }
        }
      };
      
      return new Response(JSON.stringify(holdResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate risk-reward ratio (reusing variables from earlier validation)
    const target1Price = parsed.trade_idea?.targets?.[0];
    
    if (entryPrice && stopPrice && target1Price) {
      const isLong = tradeDirection === 'long';
      const risk = Math.abs(entryPrice - stopPrice);
      const reward = isLong ? (target1Price - entryPrice) : (entryPrice - target1Price);
      const rrRatio = reward / risk;
      
      if (rrRatio < 2.0) {
        console.warn(`[VALIDATION] ⚠️  Signal rejected: R:R ratio ${rrRatio.toFixed(2)} below minimum 2.0`);
        
        const holdResponse = {
          symbol,
          timestamp: new Date().toISOString(),
          recommendation: 'hold',
          signal: 'hold', // Add for frontend compatibility
          confidence: 0,
          holdReason: `Risk:Reward ratio of ${rrRatio.toFixed(2)} is too low (minimum 2.0 required). Trade setup does not offer sufficient reward for the risk taken.`,
          analysis: parsed.summary || `${tradeDirection.toUpperCase()} setup identified but rejected due to poor risk:reward profile.`,
          outlook: parsed.outlook || 'neutral',
          action: 'hold',
          action_text: `Wait for better entry point with improved R:R ratio`,
          keyLevels: {
            support: parsed.levels?.support?.filter((s: number) => typeof s === 'number' && isFinite(s) && s < livePrice) || [],
            resistance: parsed.levels?.resistance?.filter((r: number) => typeof r === 'number' && isFinite(r) && r > livePrice) || []
          },
          technicalIndicators: {
            rsi: parsed.technical?.rsi14 || 50,
            trend: parsed.outlook === 'bullish' ? 'bullish' : parsed.outlook === 'bearish' ? 'bearish' : 'neutral',
            momentum: 'neutral'
          },
          chartPatterns: [],
          priceTargets: { bullish: 0, bearish: 0 },
          riskAssessment: {
            level: 'high',
            factors: [`Poor R:R ratio: ${rrRatio.toFixed(2)}`, 'Insufficient reward for risk taken']
          },
          rejectionDetails: {
            _type: 'risk_reward',
            value: rrRatio.toFixed(2),
            threshold: 2.0,
            entry: entryPrice,
            stop: stopPrice,
            target: target1Price,
            risk: risk,
            reward: reward
          }
        };
        
        return new Response(JSON.stringify(holdResponse), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`[VALIDATION] ✅ R:R ratio passed: ${rrRatio.toFixed(2)} (minimum 2.0)`);
    }
    
    console.log(`[VALIDATION] ✅ All signal quality filters passed`);
    
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
    
    // Validate and ensure all required fields - with filtered support/resistance
    const result = {
      ...parsed,
      signal: parsed.action === 'long' ? 'long' : parsed.action === 'short' ? 'short' : 'hold', // Add for frontend compatibility
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
      // Override levels with filtered values to ensure support is below price and resistance is above
      levels: {
        support: parsed.levels?.support?.filter((s: number) => typeof s === 'number' && isFinite(s) && s < livePrice) || [],
        resistance: parsed.levels?.resistance?.filter((r: number) => typeof r === 'number' && isFinite(r) && r > livePrice) || [],
        vwap: parsed.levels?.vwap || features.technical.vwap || null,
        liquidity_zones: features.liquidity_zones || [],
        breakout_zones: features.breakout_zones || [],
        order_blocks: features.order_blocks || []
      },
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
              target1_price: tradeIdea.targets?.[0] || null,
              target2_price: tradeIdea.targets?.[1] || null,
              target3_price: tradeIdea.targets?.[2] || null,
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

    console.log(`[ai-analyze] AI analysis completed: ${result.action} (${result.confidence_calibrated}% confidence)`);
    console.log('[ai-analyze] News impact:', result.news_impact);
    
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
    
    // Safety check: ensure candle has required properties
    if (!candle || typeof candle.l !== 'number' || typeof candle.c !== 'number') {
      continue;
    }
    
    const prevCandles = recentCandles.slice(i-3, i).filter(c => c && typeof c.l === 'number');
    const nextCandles = recentCandles.slice(i+1, i+4).filter(c => c && typeof c.l === 'number' && typeof c.c === 'number');
    
    if (prevCandles.length === 0 || nextCandles.length === 0) continue;
    
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