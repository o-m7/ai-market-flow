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

  // Send candles to ai-analyze - it will fetch technicals from Polygon
  const analysisPayload = {
    symbol: payload.symbol,
    timeframe: payload.timeframe,
    market: payload.market,
    candles: payload.candles,
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

// Technical indicators are now fetched by the ai-analyze edge function from Polygon API
