import { apiUrl } from './endpoints';

export type LWBar = { time: number; open: number; high: number; low: number; close: number; };

function toSeconds(msOrSec: number) {
  const s = msOrSec > 2_000_000_000 ? Math.floor(msOrSec / 1000) : msOrSec;
  return s;
}

export async function fetchCandles(symbol: string, tf: '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d', lookback = 500): Promise<LWBar[]> {
  // Map timeframe to polygon parameters
  const map: Record<string,{mult:number; span:'minute'|'hour'|'day'; windowDays:number}> = {
    '1m':{mult:1, span:'minute', windowDays:2},
    '5m':{mult:5, span:'minute', windowDays:7},
    '15m':{mult:15, span:'minute', windowDays:14},
    '30m':{mult:30, span:'minute', windowDays:30},
    '1h':{mult:1, span:'hour', windowDays:60},
    '4h':{mult:4, span:'hour', windowDays:120},
    '1d':{mult:1, span:'day', windowDays:365}
  };
  
  const cfg = map[tf];
  const to = new Date();
  const from = new Date(Date.now() - cfg.windowDays*24*3600*1000);
  
  try {
    // Use our polygon-chart-data function
    const response = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        timeframe: tf,
        multiplier: cfg.mult,
        timespan: cfg.span,
        from: from.toISOString().slice(0,10),
        to: to.toISOString().slice(0,10),
        limit: lookback
      })
    });

    if (!response.ok) {
      console.error('Chart data fetch failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Chart data received:', data);
    
    if (!data.candles || !Array.isArray(data.candles)) {
      console.warn('No candles data received');
      return [];
    }

    return data.candles.map((c: any) => ({
      time: toSeconds(c.t ?? c.time ?? c.timestamp),
      open: Number(c.o ?? c.open),
      high: Number(c.h ?? c.high),
      low:  Number(c.l ?? c.low),
      close:Number(c.c ?? c.close),
    })).filter(b => b.time && !Number.isNaN(b.close));
  } catch (error) {
    console.error('Failed to fetch candles:', error);
    return [];
  }
}

export async function fetchQuote(symbol: string): Promise<{ price:number|null; ts:number|null }> {
  try {
    // Use our polygon-market-data function for live quotes
    const response = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-market-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbols: [symbol.toUpperCase()]
      })
    });

    if (!response.ok) {
      console.error('Quote fetch failed:', response.status);
      return { price: null, ts: null };
    }
    
    const data = await response.json();
    console.log('Quote data received:', data);
    
    // Find the symbol in the response
    const symbolData = data.results?.find((r: any) => r.symbol === symbol.toUpperCase());
    if (!symbolData) {
      return { price: null, ts: null };
    }

    const price = symbolData.price ?? symbolData.close ?? symbolData.c ?? null;
    const ts = symbolData.timestamp ?? symbolData.updated ?? symbolData.t ?? null;
    
    return { 
      price: price ? Number(price) : null, 
      ts: ts ? toSeconds(ts) : null 
    };
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    return { price: null, ts: null };
  }
}