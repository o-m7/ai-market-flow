import { ENV } from '@/lib/endpoints';
import { getAccessToken } from '@/lib/supabase';

export type AnalysisRequest = {
  symbol: string;
  timeframe: string;           // '1m'|'5m'|'15m'|'1h'|'4h'|'1d'
  market: 'STOCK'|'CRYPTO'|'FOREX';
  candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>;
};

export async function analyzeWithAI(payload: AnalysisRequest) {
  let url = '';
  const headers: Record<string,string> = { 'Content-Type':'application/json' };

  // Optional: allow overriding OpenAI key via browser (for debugging)
  try {
    if (typeof window !== 'undefined') {
      const urlKey = new URLSearchParams(window.location.search).get('openai');
      const storedKey = window.localStorage?.getItem('OPENAI_API_KEY');
      const k = urlKey || storedKey;
      if (k) headers['x-openai-api-key'] = k;
    }
  } catch {}

  if (ENV.API_URL) {
    // Express/Railway backend path
    url = `${ENV.API_URL}/ai/analyze`;
  } else if (ENV.SUPABASE_URL) {
    // Supabase Edge Function path
    url = `${ENV.SUPABASE_URL}/functions/v1/ai-analyze`;
    // Attach JWT if available (supports verified functions)
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else {
    throw new Error('No backend configured. Set VITE_PUBLIC_API_URL or VITE_SUPABASE_URL.');
  }

  // Calculate technical indicators from candles
  const technical = calculateTechnicalIndicators(payload.candles);
  const currentPrice = payload.candles[payload.candles.length - 1]?.c || 0;
  
  // Format the request for ai-analyze function
  const analysisPayload = {
    symbol: payload.symbol,
    timeframe: payload.timeframe,
    market: payload.market,
    features: {
      technical: {
        ...technical,
        lastClose: currentPrice,
        current: currentPrice
      },
      market: {
        session: getMarketSession(),
        spread: 0.001, // Default spread
        stale: false
      }
    },
    news: {
      event_risk: false,
      headline_hits_30m: 0
    }
  };

  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(analysisPayload) });
  if (!r.ok) {
    const text = await r.text().catch(()=> '');
    throw new Error(`AI analyze failed: ${r.status} - ${text || r.statusText}`);
  }
  return r.json(); // { summary, outlook, levels, trade_idea, confidence, risks, json_version }
}

// Helper function to calculate technical indicators from OHLCV data
function calculateTechnicalIndicators(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>) {
  if (!candles || candles.length === 0) {
    return getDefaultTechnicalIndicators();
  }

  const closes = candles.map(c => c.c);
  const highs = candles.map(c => c.h);
  const lows = candles.map(c => c.l);
  const volumes = candles.map(c => c.v || 0);

  return {
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    ema200: calculateEMA(closes, 200),
    rsi14: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    atr14: calculateATR(highs, lows, closes, 14),
    bb: calculateBollingerBands(closes, 20, 2),
    vwap: calculateVWAP(candles),
    support: findSupportLevels(lows),
    resistance: findResistanceLevels(highs)
  };
}

// Simple EMA calculation
function calculateEMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = values[0];
  
  for (let i = 1; i < values.length; i++) {
    ema = (values[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

// Simple RSI calculation
function calculateRSI(values: number[], period: number = 14): number {
  if (values.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
}

// Simple MACD calculation
function calculateMACD(values: number[]): { line: number; signal: number; hist: number } {
  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  const line = ema12 - ema26;
  
  // Simplified signal line (normally 9-period EMA of MACD line)
  const signal = line * 0.1; // Approximation
  const hist = line - signal;
  
  return { line, signal, hist };
}

// Simple ATR calculation
function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < 2) return 0;
  
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trs.push(Math.max(tr1, tr2, tr3));
  }
  
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

// Simple Bollinger Bands
function calculateBollingerBands(values: number[], period: number = 20, multiplier: number = 2) {
  if (values.length < period) {
    const last = values[values.length - 1] || 0;
    return { upper: last, mid: last, lower: last };
  }
  
  const recentValues = values.slice(-period);
  const mid = recentValues.reduce((a, b) => a + b, 0) / period;
  const variance = recentValues.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: mid + (stdDev * multiplier),
    mid: mid,
    lower: mid - (stdDev * multiplier)
  };
}

// Simple VWAP calculation
function calculateVWAP(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>): number {
  if (!candles.length) return 0;
  
  let totalVolumePrice = 0;
  let totalVolume = 0;
  
  for (const candle of candles.slice(-30)) { // Use last 30 periods
    const typical = (candle.h + candle.l + candle.c) / 3;
    const volume = candle.v || 1;
    totalVolumePrice += typical * volume;
    totalVolume += volume;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

// Simple support level detection
function findSupportLevels(lows: number[]): number[] {
  if (lows.length < 10) return [];
  
  const recentLows = lows.slice(-50);
  const sortedLows = [...recentLows].sort((a, b) => a - b);
  
  return [sortedLows[0], sortedLows[1]].filter(Boolean);
}

// Simple resistance level detection
function findResistanceLevels(highs: number[]): number[] {
  if (highs.length < 10) return [];
  
  const recentHighs = highs.slice(-50);
  const sortedHighs = [...recentHighs].sort((a, b) => b - a);
  
  return [sortedHighs[0], sortedHighs[1]].filter(Boolean);
}

// Get market session (simplified)
function getMarketSession(): string {
  const hour = new Date().getUTCHours();
  
  if (hour >= 0 && hour < 8) return 'ASIA';
  if (hour >= 8 && hour < 16) return 'EUROPE'; 
  return 'US';
}

// Default technical indicators when no data available
function getDefaultTechnicalIndicators() {
  return {
    ema20: 0,
    ema50: 0,
    ema200: 0,
    rsi14: 50,
    macd: { line: 0, signal: 0, hist: 0 },
    atr14: 0,
    bb: { upper: 0, mid: 0, lower: 0 },
    vwap: 0,
    support: [],
    resistance: []
  };
}
