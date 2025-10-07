import type { TimespanUnit } from "./types.ts";

export async function getAggregates(
  symbol: string,
  multiplier: number,
  timespan: TimespanUnit,
  from: string,
  to: string,
  limit?: number
) {
  const apiKey = Deno.env.get("POLYGON_API_KEY");
  if (!apiKey) throw new Error("Missing POLYGON_API_KEY");
  
  const u = new URL(
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${timespan}/${from}/${to}`
  );
  u.searchParams.set("adjusted", "true");
  u.searchParams.set("sort", "asc");
  if (limit) u.searchParams.set("limit", String(limit));
  u.searchParams.set("apiKey", apiKey);
  
  // Add 3-second timeout for fast failure
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  
  try {
    const res = await fetch(u, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`Polygon error ${res.status}`);
    
    const j = await res.json();
    return j?.results?.map((x: any) => ({ 
      t: x.t, 
      o: x.o, 
      h: x.h, 
      l: x.l, 
      c: x.c, 
      v: x.v 
    })) ?? [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Polygon API timeout (3s)');
    }
    throw error;
  }
}
