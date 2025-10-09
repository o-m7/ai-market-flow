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

  // Fetch ALL fresh candles for live analysis - ignore stale payload data
  let currentPrice: number | null = null;
  let freshCandles = payload.candles;
  
  console.log('[analyze] Fetching completely fresh candles for', payload.symbol);
  
  try {
    const liveDataResponse = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        asset: payload.market.toLowerCase(),
        limit: 100, // Get 100 fresh candles for proper support/resistance calculation
        lite: false // Get full data including volume
      })
    });
    
    if (liveDataResponse.ok) {
      const liveData = await liveDataResponse.json();
      if (liveData.candles && liveData.candles.length > 0) {
        // Use completely fresh candles
        freshCandles = liveData.candles.map((c: any) => ({
          t: c.t,
          o: c.o,
          h: c.h,
          l: c.l,
          c: c.c,
          v: c.v
        }));
        
        // Get current live price from snapshot
        currentPrice = liveData.snapshotLastTrade || liveData.candles[liveData.candles.length - 1].c;
        
        const latestCandle = liveData.candles[liveData.candles.length - 1];
        console.log('[analyze] Fresh candles fetched:', { 
          count: freshCandles.length,
          latestClose: latestCandle.c,
          currentPrice,
          latestTime: new Date(latestCandle.t).toISOString(),
          age: liveData.lastTimeUTC 
        });
      } else {
        console.warn('[analyze] No fresh candles returned, using provided data');
      }
    } else {
      console.warn('[analyze] Live data fetch failed:', liveDataResponse.status, await liveDataResponse.text());
    }
  } catch (err) {
    console.error('[analyze] Failed to fetch fresh candles:', err);
  }

  // Fetch real news sentiment analysis
  let newsData = {
    event_risk: false,
    headline_hits_30m: 0,
    sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    confidence: 0
  };

  try {
    const newsResponse = await fetch(`${ENV.SUPABASE_URL}/functions/v1/news-signal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe
      })
    });

    if (newsResponse.ok) {
      const newsResult = await newsResponse.json();
      if (newsResult.analysis) {
        newsData = {
          event_risk: newsResult.analysis.news_impact === 'high',
          headline_hits_30m: newsResult.news?.length || 0,
          sentiment: newsResult.analysis.sentiment,
          confidence: newsResult.analysis.confidence
        };
        console.log('[analyze] News sentiment fetched:', newsData);
      }
    }
  } catch (err) {
    console.warn('[analyze] Failed to fetch news sentiment, using neutral:', err);
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
