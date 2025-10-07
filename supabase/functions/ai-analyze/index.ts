// Institutional Technical Analysis Engine v2.6 - Fresh Polygon Data
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const FUNCTION_VERSION = "2.7.0"; // Fixed candle fetching with proper time calculation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key, x-openai-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const THRESHOLDS = {
  CONFIDENCE_STRONG: 75,
  CONFIDENCE_WEAK: 50,
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,
};

function round5(n: number) {
  return Math.round(n * 100000) / 100000;
}

const InstitutionalTaResultSchema = {
  name: "institutional_ta",
  description: "Provides an institutional-grade trading signal based on technical analysis.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["buy", "sell", "hold"],
        description: "The recommended trading action: buy, sell, or hold.",
      },
      confidence: {
        type: "number",
        description: "The confidence level (0-100) in the recommended trading action.",
      },
      confidence_calibrated: {
        type: "number",
        description: "The calibrated confidence level (0-100) in the recommended trading action.",
      },
      summary: {
        type: "string",
        description: "A concise summary of the technical analysis and trading signal.",
      },
      outlook: {
        type: "string",
        description: "A detailed outlook explaining the rationale behind the trading signal.",
      },
      levels: {
        type: "string",
        description: "Key support and resistance levels to watch.",
      },
      trade_idea: {
        type: "string",
        description: "A specific trade idea with entry, stop loss, and target levels.",
      },
      risks: {
        type: "string",
        description: "Potential risks associated with the trade idea.",
      },
      json_version: {
        type: "string",
        description: "The version of the JSON schema.",
      },
    },
    required: ["action", "confidence", "confidence_calibrated", "summary", "outlook", "levels", "trade_idea", "risks", "json_version"],
  },
};

// Fetch fresh candles from Polygon API
async function fetchFreshCandles(
  symbol: string,
  timespan: string,
  market: string,
  limit: number = 200
): Promise<Array<{t:number,o:number,h:number,l:number,c:number,v:number}>> {
  const apiKey = Deno.env.get("POLYGON_API_KEY");
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");

  const polygonSymbol = market === 'CRYPTO' ? `X:${symbol}` : symbol;
  
  const timespanMap: Record<string, [number, string]> = {
    '1m': [1, 'minute'], '5m': [5, 'minute'], '15m': [15, 'minute'],
    '30m': [30, 'minute'], '1h': [1, 'hour'], '4h': [4, 'hour'], '1d': [1, 'day']
  };
  
  const [multiplier, unit] = timespanMap[timespan] || [1, 'hour'];
  
  // Calculate from/to timestamps with extra buffer to ensure we get enough data
  const to = Date.now();
  const msPerUnit = unit === 'minute' ? 60000 : unit === 'hour' ? 3600000 : 86400000;
  const from = to - (limit * 1.5 * multiplier * msPerUnit); // 1.5x buffer
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/${multiplier}/${unit}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;
  
  console.log(`[ai-analyze] Fetching candles from Polygon: ${polygonSymbol}, timeframe: ${multiplier}${unit}, limit: ${limit}`);
  
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[ai-analyze] Polygon error: ${res.status} - ${errorText}`);
    throw new Error(`Polygon candles fetch failed: ${res.status}`);
  }
  
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    console.error(`[ai-analyze] No results from Polygon for ${polygonSymbol}`);
    throw new Error(`No candle data available for ${polygonSymbol}`);
  }
  
  const candles = data.results.map((bar: any) => ({
    t: bar.t, o: bar.o, h: bar.h, l: bar.l, c: bar.c, v: bar.v
  }));
  
  console.log(`[ai-analyze] Fetched ${candles.length} candles (latest: ${new Date(candles[candles.length - 1]?.t).toISOString()}, price: ${candles[candles.length - 1]?.c})`);
  
  return candles;
}

async function fetchTechnicalIndicators(symbol: string, timeframe: string, market: string) {
  const apiKey = Deno.env.get("POLYGON_API_KEY");
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");

  const polygonSymbol = market === 'CRYPTO' ? `X:${symbol}` : symbol;
  const timespanMap: Record<string, string> = {
    '1m': 'minute', '5m': 'minute', '15m': 'minute',
    '30m': 'minute', '1h': 'hour', '4h': 'hour', '1d': 'day'
  };
  const timespan = timespanMap[timeframe] || 'hour';

  console.log(`[ai-analyze] Fetching technical indicators from Polygon for ${symbol}`);

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const limit = 7200; // Polygon API limit

  // Define indicator URLs
  const indicatorUrls = {
    ema20: `https://api.polygon.io/v1/indicators/ema/${polygonSymbol}?timespan=${timespan}&window=20&series_type=close&order=desc&limit=1&apiKey=${apiKey}`,
    ema50: `https://api.polygon.io/v1/indicators/ema/${polygonSymbol}?timespan=${timespan}&window=50&series_type=close&order=desc&limit=1&apiKey=${apiKey}`,
    ema200: `https://api.polygon.io/v1/indicators/ema/${polygonSymbol}?timespan=${timespan}&window=200&series_type=close&order=desc&limit=1&apiKey=${apiKey}`,
    rsi: `https://api.polygon.io/v1/indicators/rsi/${polygonSymbol}?timespan=${timespan}&window=14&series_type=close&order=desc&limit=1&apiKey=${apiKey}`,
    macd: `https://api.polygon.io/v1/indicators/macd/${polygonSymbol}?timespan=${timespan}&short_window=12&long_window=26&signal_window=9&series_type=close&order=desc&limit=1&apiKey=${apiKey}`,
  };

  try {
    // Fetch all indicators in parallel
    const [ema20Res, ema50Res, ema200Res, rsiRes, macdRes] = await Promise.all([
      fetch(indicatorUrls.ema20),
      fetch(indicatorUrls.ema50),
      fetch(indicatorUrls.ema200),
      fetch(indicatorUrls.rsi),
      fetch(indicatorUrls.macd),
    ]);

    // Check for successful responses
    if (!ema20Res.ok) throw new Error(`Polygon EMA20 error: ${ema20Res.status}`);
    if (!ema50Res.ok) throw new Error(`Polygon EMA50 error: ${ema50Res.status}`);
    if (!ema200Res.ok) throw new Error(`Polygon EMA200 error: ${ema200Res.status}`);
    if (!rsiRes.ok) throw new Error(`Polygon RSI error: ${rsiRes.status}`);
    if (!macdRes.ok) throw new Error(`Polygon MACD error: ${macdRes.status}`);

    // Parse JSON responses
    const ema20Data = await ema20Res.json();
    const ema50Data = await ema50Res.json();
    const ema200Data = await ema200Res.json();
    const rsiData = await rsiRes.json();
    const macdData = await macdRes.json();

    console.log(`[ai-analyze] Polygon EMA20 response: ${JSON.stringify(ema20Data)}`);
    console.log(`[ai-analyze] Polygon RSI response: ${JSON.stringify(rsiData)}`);
    console.log(`[ai-analyze] Polygon MACD response: ${JSON.stringify(macdData)}`);

    // Extract values
    const ema20 = ema20Data?.results?.values?.[0]?.value || 0;
    const ema50 = ema50Data?.results?.values?.[0]?.value || 0;
    const ema200 = ema200Data?.results?.values?.[0]?.value || 0;
    const rsi = rsiData?.results?.values?.[0]?.value || 50;
    const macdLine = macdData?.results?.values?.[0]?.value || 0;
    const macdSignal = macdData?.results?.values?.[0]?.signal || 0;
    const macdHist = macdData?.results?.values?.[0]?.histogram || 0;

    return {
      ema20: round5(ema20),
      ema50: round5(ema50),
      ema200: round5(ema200),
      rsi14: round5(rsi),
      macd: {
        line: round5(macdLine),
        signal: round5(macdSignal),
        hist: round5(macdHist),
      },
    };
  } catch (error) {
    console.error(`[ai-analyze] Error fetching Polygon indicators: ${error.message}`);
    return {
      ema20: 0,
      ema50: 0,
      ema200: 0,
      rsi14: 50,
      macd: {
        line: 0,
        signal: 0,
        hist: 0,
      },
    };
  }
}

function calculateBollingerBands(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>, period: number, stdDev: number) {
  if (candles.length < period) {
    return { upper: 0, mid: 0, lower: 0 };
  }

  const prices = candles.slice(-period).map(c => c.c);
  const avg = prices.reduce((a, b) => a + b, 0) / period;

  let sumOfSquaredDifferences = 0;
  for (let i = 0; i < prices.length; i++) {
    sumOfSquaredDifferences += Math.pow(prices[i] - avg, 2);
  }
  const standardDeviation = Math.sqrt(sumOfSquaredDifferences / period);

  const upper = avg + (stdDev * standardDeviation);
  const lower = avg - (stdDev * standardDeviation);

  return {
    upper: round5(upper),
    mid: round5(avg),
    lower: round5(lower)
  };
}

function calculateATR(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>, period: number) {
  if (candles.length < period) {
    return 0;
  }

  let trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].h;
    const low = candles[i].l;
    const closePrev = candles[i - 1].c;

    const tr = Math.max(
      (high - low),
      Math.abs(high - closePrev),
      Math.abs(low - closePrev)
    );
    trValues.push(tr);
  }

  const atr = trValues.slice(-period).reduce((a, b) => a + b, 0) / period;
  return round5(atr);
}

function calculateVWAP(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>) {
  let sumPV = 0;
  let sumV = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.h + candle.l + candle.c) / 3;
    sumPV += typicalPrice * candle.v;
    sumV += candle.v;
  }

  const vwap = sumPV / sumV;
  return round5(vwap);
}

function findSupportResistance(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>) {
  const lookbackPeriod = 20; // Adjust as needed
  const recentCandles = candles.slice(-lookbackPeriod);

  let supports: number[] = [];
  let resistances: number[] = [];

  for (let i = 1; i < recentCandles.length - 1; i++) {
    const current = recentCandles[i];
    const left = recentCandles.slice(0, i);
    const right = recentCandles.slice(i + 1);

    // Identify Support
    if (current.l === Math.min(...left.map(c => c.l), ...right.map(c => c.l))) {
      supports.push(current.l);
    }

    // Identify Resistance
    if (current.h === Math.max(...left.map(c => c.h), ...right.map(c => c.h))) {
      resistances.push(current.h);
    }
  }

  // Remove duplicates and sort
  supports = [...new Set(supports)].sort((a, b) => a - b);
  resistances = [...new Set(resistances)].sort((a, b) => a - b);

  return {
    support: supports.map(round5),
    resistance: resistances.map(round5)
  };
}

function runDeterministicAnalysis(req: any) {
  const { symbol, timeframe, candles, technical, news } = req;
  const { ema20, ema50, ema200, rsi14, macd, atr14, bb, vwap, support, resistance, lastClose, current } = technical;

  let action = "hold";
  let confidence = 50;
  let reasons: string[] = [];

  // Trend identification
  if (current > ema20 && current > ema50 && current > ema200) {
    reasons.push("Price is above all key EMAs, indicating an uptrend.");
  } else if (current < ema20 && current < ema50 && current < ema200) {
    reasons.push("Price is below all key EMAs, indicating a downtrend.");
  }

  // Momentum assessment
  if (rsi14 > THRESHOLDS.RSI_OVERBOUGHT) {
    reasons.push(`RSI is overbought (${rsi14}), suggesting potential pullback.`);
  } else if (rsi14 < THRESHOLDS.RSI_OVERSOLD) {
    reasons.push(`RSI is oversold (${rsi14}), suggesting potential bounce.`);
  }

  // MACD analysis
  if (macd.line > macd.signal) {
    reasons.push("MACD line is above signal line, indicating bullish momentum.");
  } else {
    reasons.push("MACD line is below signal line, indicating bearish momentum.");
  }

  // ATR for volatility
  reasons.push(`ATR is ${atr14}, indicating the average range of price movement.`);

  // Bollinger Bands
  if (current > bb.upper) {
    reasons.push("Price is testing upper Bollinger Band, potential for overextension.");
  } else if (current < bb.lower) {
    reasons.push("Price is testing lower Bollinger Band, potential for oversold condition.");
  }

  // Support and Resistance
  if (support.length > 0) {
    reasons.push(`Key support levels: ${support.join(", ")}`);
  }
  if (resistance.length > 0) {
    reasons.push(`Key resistance levels: ${resistance.join(", ")}`);
  }

  // Action decision
  if (current > ema20 && rsi14 < 70 && macd.line > macd.signal) {
    action = "buy";
    confidence = 60;
    reasons.push("Favorable conditions for a potential long position.");
  } else if (current < ema20 && rsi14 > 30 && macd.line < macd.signal) {
    action = "sell";
    confidence = 60;
    reasons.push("Favorable conditions for a potential short position.");
  }

  const summary = `Based on technical indicators, the current outlook is ${action}.`;
  const outlook = reasons.join(" ");

  return {
    action: action,
    confidence: confidence,
    confidence_calibrated: confidence,
    summary: summary,
    outlook: outlook,
    levels: `Support levels: ${support.join(", ")}, Resistance levels: ${resistance.join(", ")}`,
    trade_idea: "N/A",
    risks: "N/A",
    json_version: "2.6",
  };
}

function buildMarketContext(
  symbol: string,
  timeframe: string,
  candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>,
  technical: any,
  news: any
): string {
  const { ema20, ema50, ema200, rsi14, macd, atr14, bb, vwap, support, resistance, lastClose, current } = technical;

  let context = `The current price of ${symbol} is ${current}. Technical indicators: `;
  context += `EMA20=${ema20}, EMA50=${ema50}, EMA200=${ema200}, RSI=${rsi14}, MACD=${JSON.stringify(macd)}, ATR=${atr14}, `;
  context += `Bollinger Bands=${JSON.stringify(bb)}, VWAP=${vwap}, Support=${JSON.stringify(support)}, Resistance=${JSON.stringify(resistance)}. `;
  context += `Recent price action: last close was ${lastClose}. News: event risk=${news.event_risk}, headline hits=${news.headline_hits_30m}. `;
  context += `Analyze the current market conditions and provide a trading signal.`;

  return context;
}

async function callOpenAIAnalysis(marketContext: string, technical: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey: apiKey });

  console.log('[ai-analyze] Calling OpenAI with function calling...');

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert financial analyst providing institutional-grade trading signals. Analyze the provided market context and technical indicators to generate a concise trading signal. Adhere strictly to the JSON schema for the function call.",
      },
      { role: "user", content: marketContext },
    ],
    tools: [InstitutionalTaResultSchema],
    tool_choice: InstitutionalTaResultSchema,
  });

  console.log(`[ai-analyze] OpenAI response: ${JSON.stringify(completion)}`);

  if (!completion.choices || completion.choices.length === 0) {
    throw new Error("No choices returned from OpenAI");
  }

  const choice = completion.choices[0];

  if (!choice.message) {
    throw new Error("No message returned from OpenAI");
  }

  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    console.error(`[ai-analyze] No valid function call returned`);
    throw new Error("No valid function call returned");
  }

  const toolCall = choice.message.tool_calls[0];

  if (toolCall.function.name !== "institutional_ta") {
    throw new Error(`Unexpected function call: ${toolCall.function.name}`);
  }

  const args = JSON.parse(toolCall.function.arguments);

  // Basic validation of required fields
  if (!args.action || !["buy", "sell", "hold"].includes(args.action)) {
    throw new Error(`Invalid action: ${args.action}`);
  }
  if (typeof args.confidence !== "number" || args.confidence < 0 || args.confidence > 100) {
    throw new Error(`Invalid confidence: ${args.confidence}`);
  }

  // Calibrate confidence
  const confidenceCalibrated = (args.confidence * 0.8) + (technical.rsi14 > 50 ? 10 : -10); // Example calibration
  args.confidence_calibrated = Math.max(0, Math.min(100, confidenceCalibrated)); // Ensure within 0-100 range

  return args;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { symbol, timeframe, market } = await req.json();
    
    console.log(`[ai-analyze v${FUNCTION_VERSION}] Processing: ${symbol} (${timeframe}, ${market})`);
    
    // Fetch fresh candles from Polygon instead of using client data
    const freshCandles = await fetchFreshCandles(symbol, timeframe, market);
    
    if (!freshCandles || freshCandles.length < 30) {
      throw new Error(`Insufficient candles: ${freshCandles?.length || 0}`);
    }
    
    // Fetch technical indicators from Polygon
    const technicalIndicators = await fetchTechnicalIndicators(symbol, timeframe, market);
    
    // Calculate additional indicators from fresh candles
    const bb = calculateBollingerBands(freshCandles, 20, 2);
    const atr = calculateATR(freshCandles, 14);
    const vwap = calculateVWAP(freshCandles);
    const supportResistance = findSupportResistance(freshCandles);
    
    const lastClose = freshCandles[freshCandles.length - 1]?.c || 0;
    const currentPrice = freshCandles[freshCandles.length - 1]?.c || 0;
    
    const combinedTechnical = {
      ...technicalIndicators,
      atr14: atr,
      bb: bb,
      vwap: vwap,
      support: supportResistance.support,
      resistance: supportResistance.resistance,
      lastClose: lastClose,
      current: currentPrice
    };
    
    console.log('[ai-analyze] Technical indicators fetched:', JSON.stringify(combinedTechnical, null, 2));
    
    // Run deterministic analysis
    const deterministicResult = runDeterministicAnalysis({
      symbol, timeframe,
      candles: freshCandles,
      technical: combinedTechnical,
      news: { event_risk: false, headline_hits_30m: 0 }
    });
    
    const marketContext = buildMarketContext(
      symbol, timeframe, freshCandles, combinedTechnical,
      { event_risk: false, headline_hits_30m: 0 }
    );
    
    // Call OpenAI for enhanced analysis
    const aiResult = await callOpenAIAnalysis(marketContext, combinedTechnical);
    
    console.log(`[ai-analyze] Deterministic analysis completed: ${deterministicResult.action} (${deterministicResult.confidence_calibrated}% confidence)`);
    
    return new Response(JSON.stringify(aiResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[ai-analyze] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
