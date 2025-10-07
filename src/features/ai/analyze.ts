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
    // Use Lovable Cloud AI - no API key needed
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

  // Fetch technical indicators from Polygon API
  const technical = await fetchTechnicalIndicatorsFromPolygon(payload);
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

// Fetch technical indicators from Polygon API
async function fetchTechnicalIndicatorsFromPolygon(payload: AnalysisRequest) {
  try {
    const url = `${ENV.SUPABASE_URL}/functions/v1/polygon-indicators`;
    const token = await getAccessToken();
    const headers: Record<string,string> = { 'Content-Type':'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        asset: payload.market.toLowerCase(),
        candles: payload.candles
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch indicators from Polygon, using defaults');
      return getDefaultTechnicalIndicators();
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    return getDefaultTechnicalIndicators();
  }
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
