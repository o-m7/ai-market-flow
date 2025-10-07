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

  // PHASE 2: Parallel fetch for fresh candles + news sentiment (faster!)
  let currentPrice: number | null = null;
  let freshCandles = payload.candles;
  let newsData = {
    event_risk: false,
    headline_hits_30m: 0,
    sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    confidence: 0
  };

  // Fetch both in parallel to save time
  const [liveDataResult, newsResult] = await Promise.allSettled([
    // Fetch fresh candles
    fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        asset: payload.market.toLowerCase(),
        limit: 2,
        lite: true
      })
    }).then(r => r.ok ? r.json() : null),
    
    // Fetch news sentiment
    fetch(`${ENV.SUPABASE_URL}/functions/v1/news-signal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe
      })
    }).then(r => r.ok ? r.json() : null)
  ]);

  // Process fresh candles
  if (liveDataResult.status === 'fulfilled' && liveDataResult.value?.candles?.length > 0) {
    const liveData = liveDataResult.value;
    freshCandles = [...payload.candles.slice(0, -2), ...liveData.candles.map((c: any) => ({
      t: c.t,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      v: c.v
    }))];
    currentPrice = liveData.snapshotLastTrade || liveData.candles[liveData.candles.length - 1].c;
    console.log('[analyze] Fresh data fetched:', { 
      latestClose: liveData.candles[liveData.candles.length - 1].c,
      currentPrice,
      age: liveData.lastTimeUTC 
    });
  } else if (liveDataResult.status === 'rejected') {
    console.warn('[analyze] Fresh candles fetch failed:', liveDataResult.reason);
  }

  // Process news sentiment
  if (newsResult.status === 'fulfilled' && newsResult.value?.analysis) {
    const newsResultData = newsResult.value;
    newsData = {
      event_risk: newsResultData.analysis.news_impact === 'high',
      headline_hits_30m: newsResultData.news?.length || 0,
      sentiment: newsResultData.analysis.sentiment,
      confidence: newsResultData.analysis.confidence
    };
    console.log('[analyze] News sentiment fetched:', newsData);
  } else if (newsResult.status === 'rejected') {
    console.warn('[analyze] News sentiment fetch failed:', newsResult.reason);
  }

  // Send candles to ai-analyze - it will fetch technicals from Polygon
  const analysisPayload = {
    symbol: payload.symbol,
    timeframe: payload.timeframe,
    market: payload.market,
    candles: freshCandles,
    currentPrice, // Pass live price for context
    news: newsData
  };

  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(analysisPayload) });
  if (!r.ok) {
    const text = await r.text().catch(()=> '');
    throw new Error(`AI analyze failed: ${r.status} - ${text || r.statusText}`);
  }
  return r.json(); // { summary, outlook, levels, trade_idea, confidence, risks, json_version }
}

// Technical indicators are now fetched by the ai-analyze edge function from Polygon API
