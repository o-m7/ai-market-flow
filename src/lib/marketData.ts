import { apiUrl } from './endpoints';

export type LWBar = { time: number; open: number; high: number; low: number; close: number; };

function toSeconds(msOrSec: number) {
  const s = msOrSec > 2_000_000_000 ? Math.floor(msOrSec / 1000) : msOrSec;
  return s;
}

export async function fetchCandles(symbol: string, tf: '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d', lookback = 500): Promise<LWBar[]> {
  // choose polygon-style params
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
  const q = `symbol=${encodeURIComponent(symbol)}&mult=${cfg.mult}&span=${cfg.span}&from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}&limit=${lookback}`;
  const url = apiUrl(`/market/aggs?${q}`);

  try {
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return [];
    const j = await r.json().catch(()=>({}));
    const arr = Array.isArray(j?.candles) ? j.candles : (Array.isArray(j?.results) ? j.results : []);
    return arr.map((c: any) => ({
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
  const url = apiUrl(`/market/quote?symbol=${encodeURIComponent(symbol)}`);
  try {
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return { price: null, ts: null };
    const j = await r.json().catch(()=>({}));
    const price = j?.price ?? j?.results?.p ?? j?.close ?? null;
    const ts = j?.ts ?? j?.results?.sip_timestamp ?? j?.timestamp ?? null;
    return { price, ts: ts ? toSeconds(ts) : null };
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    return { price: null, ts: null };
  }
}