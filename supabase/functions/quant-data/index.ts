import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandleData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface QuantResponse {
  symbol: string;
  tf: string;
  asOf: string;
  price: number;
  prevClose: number | null;
  ema: Record<string, number>;
  rsi14: number;
  macd: { line: number; signal: number; hist: number };
  bb20: { mid: number; upper: number; lower: number };
  atr14: number;
  donchian20: { high: number; low: number };
  vol20_annual: number | null;
  zscore20: number | null;
  vwap?: number | null;
  tail?: { t: number; c: number }[];
  summary?: string;
}

// Technical indicator calculations
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { line: number; signal: number; hist: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Simplified signal line calculation
  const macdHistory = [macdLine]; // In a real implementation, you'd track historical MACD values
  const signal = calculateEMA(macdHistory, 9);
  
  return {
    line: macdLine,
    signal: signal,
    hist: macdLine - signal
  };
}

function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): { mid: number; upper: number; lower: number } {
  if (prices.length < period) {
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return { mid: avg, upper: avg, lower: avg };
  }
  
  const recentPrices = prices.slice(-period);
  const mid = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mid, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    mid,
    upper: mid + (stdDev * multiplier),
    lower: mid - (stdDev * multiplier)
  };
}

function calculateATR(candles: CandleData[], period = 14): number {
  if (candles.length < 2) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].h;
    const low = candles[i].l;
    const prevClose = candles[i - 1].c;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
}

function calculateDonchian(candles: CandleData[], period = 20): { high: number; low: number } {
  if (candles.length < period) {
    const high = Math.max(...candles.map(c => c.h));
    const low = Math.min(...candles.map(c => c.l));
    return { high, low };
  }
  
  const recentCandles = candles.slice(-period);
  const high = Math.max(...recentCandles.map(c => c.h));
  const low = Math.min(...recentCandles.map(c => c.l));
  
  return { high, low };
}

function calculateVWAP(candles: CandleData[]): number {
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (const candle of candles) {
    const typical = (candle.h + candle.l + candle.c) / 3;
    totalVolumePrice += typical * candle.v;
    totalVolume += candle.v;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

function calculateRealizedVolatility(prices: number[], period = 20): number | null {
  if (prices.length < period + 1) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  
  const recentReturns = returns.slice(-period);
  const mean = recentReturns.reduce((sum, ret) => sum + ret, 0) / period;
  const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (period - 1);
  
  // Annualize (assuming daily data, multiply by sqrt(252))
  return Math.sqrt(variance * 252);
}

function calculateZScore(prices: number[], period = 20): number | null {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  const currentPrice = prices[prices.length - 1];
  return (currentPrice - mean) / stdDev;
}

async function fetchPolygonData(symbol: string, tf: string, polygonApiKey: string): Promise<CandleData[]> {
  const timeframes: Record<string, string> = {
    '1m': '1/minute',
    '5m': '5/minute', 
    '15m': '15/minute',
    '1h': '1/hour',
    '1d': '1/day'
  };
  
  const timeframe = timeframes[tf] || '1/hour';
  const now = new Date();
  const from = new Date(now.getTime() - (100 * 24 * 60 * 60 * 1000)); // 100 days ago
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${timeframe}/${from.toISOString().split('T')[0]}/${now.toISOString().split('T')[0]}?adjusted=true&sort=asc&limit=5000&apikey=${polygonApiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error('No data available for symbol');
  }
  
  return data.results.map((bar: any) => ({
    t: bar.t,
    o: bar.o,
    h: bar.h,
    l: bar.l,
    c: bar.c,
    v: bar.v
  }));
}

async function generateSummary(symbol: string, indicators: any, openaiKey: string): Promise<string> {
  const prompt = `Analyze the following technical indicators for ${symbol} and provide a concise trading summary in 2-3 bullet points:

RSI: ${indicators.rsi14.toFixed(2)}
MACD Line: ${indicators.macd.line.toFixed(4)}
MACD Signal: ${indicators.macd.signal.toFixed(4)}
ATR: ${indicators.atr14.toFixed(2)}
Z-Score: ${indicators.zscore20?.toFixed(2) || 'N/A'}

Focus on momentum, trend, and volatility signals. Be specific and actionable.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Analysis unavailable';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Technical analysis summary unavailable';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') || 'BTCUSD';
    const tf = url.searchParams.get('tf') || '1h';
    const withSummary = url.searchParams.get('withSummary') === 'true';

    const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
    if (!polygonApiKey) {
      throw new Error('POLYGON_API_KEY not configured');
    }

    console.log(`Fetching quant data for ${symbol}, timeframe: ${tf}`);

    // Fetch market data
    const candles = await fetchPolygonData(symbol, tf, polygonApiKey);
    if (candles.length === 0) {
      throw new Error('No market data available');
    }

    const prices = candles.map(c => c.c);
    const currentPrice = prices[prices.length - 1];
    const prevClose = prices.length > 1 ? prices[prices.length - 2] : null;

    // Calculate technical indicators
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const ema200 = calculateEMA(prices, 200);
    const rsi14 = calculateRSI(prices, 14);
    const macd = calculateMACD(prices);
    const bb20 = calculateBollingerBands(prices, 20);
    const atr14 = calculateATR(candles, 14);
    const donchian20 = calculateDonchian(candles, 20);
    const vol20_annual = calculateRealizedVolatility(prices, 20);
    const zscore20 = calculateZScore(prices, 20);
    const vwap = calculateVWAP(candles);

    // Create tail data (last 50 points for sparkline)
    const tail = candles.slice(-50).map(c => ({ t: c.t, c: c.c }));

    const indicators = {
      rsi14,
      macd,
      atr14,
      zscore20
    };

    // Generate AI summary if requested
    let summary: string | undefined;
    if (withSummary) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        summary = await generateSummary(symbol, indicators, openaiKey);
      }
    }

    const response: QuantResponse = {
      symbol,
      tf,
      asOf: new Date().toISOString(),
      price: currentPrice,
      prevClose,
      ema: {
        '20': ema20,
        '50': ema50,
        '200': ema200
      },
      rsi14,
      macd,
      bb20,
      atr14,
      donchian20,
      vol20_annual,
      zscore20,
      vwap,
      tail,
      summary
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in quant-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});