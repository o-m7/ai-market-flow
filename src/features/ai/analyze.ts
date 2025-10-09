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

  // Fetch ONLY the most recent candles for live analysis
  let currentPrice: number | null = null;
  let freshCandles = payload.candles;
  
  console.log('[analyze] Fetching real-time candles for', payload.symbol);
  
  try {
    const liveDataResponse = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        asset: payload.market.toLowerCase(),
        limit: 50, // Only get 50 most recent candles for current analysis
        lite: false // Get full data including volume
      })
    });
    
    if (liveDataResponse.ok) {
      const liveData = await liveDataResponse.json();
      if (liveData.candles && liveData.candles.length > 0) {
        // Use ONLY the freshest candles - discard any stale payload data
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
        const ageSeconds = Math.round((Date.now() - latestCandle.t) / 1000);
        
        console.log('[analyze] Real-time candles fetched:', { 
          count: freshCandles.length,
          latestClose: latestCandle.c,
          currentPrice,
          latestTime: new Date(latestCandle.t).toISOString(),
          ageSeconds,
          isRecent: ageSeconds < 300 // Less than 5 minutes old
        });
        
        // Validate data freshness
        if (ageSeconds > 300) {
          console.warn('[analyze] WARNING: Data may be stale, age:', ageSeconds, 'seconds');
        }
      } else {
        console.warn('[analyze] No fresh candles returned');
      }
    } else {
      const errorText = await liveDataResponse.text();
      console.error('[analyze] Live data fetch failed:', liveDataResponse.status, errorText);
    }
  } catch (err) {
    console.error('[analyze] Failed to fetch fresh candles:', err);
  }

  // Fetch real news sentiment analysis (non-blocking)
  let newsData = {
    event_risk: false,
    headline_hits_30m: 0,
    sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    confidence: 0
  };

  try {
    const newsController = new AbortController();
    const newsTimeout = setTimeout(() => newsController.abort(), 8000); // 8s timeout
    
    const newsResponse = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/news-signal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        timeframe: payload.timeframe
      }),
      signal: newsController.signal
    });

    clearTimeout(newsTimeout);

    if (newsResponse.ok) {
      const newsResult = await newsResponse.json();
      if (newsResult.analysis) {
        newsData = {
          event_risk: newsResult.analysis.news_impact === 'high',
          headline_hits_30m: newsResult.news_articles?.length || 0,
          sentiment: newsResult.analysis.sentiment,
          confidence: newsResult.analysis.confidence
        };
        console.log('[analyze] News sentiment fetched:', newsData);
      }
    } else {
      console.warn('[analyze] News API returned error:', newsResponse.status);
    }
  } catch (err) {
    console.warn('[analyze] Failed to fetch news sentiment, continuing without it:', err instanceof Error ? err.message : 'Unknown error');
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
