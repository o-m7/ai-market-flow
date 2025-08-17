import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get("POLYGON_API_KEY");
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (!polygonApiKey) {
      return new Response(JSON.stringify({ success:false, error:"POLYGON_API_KEY missing" }), { status:503, headers:cors });
    }

    const { symbol = "AAPL", asset = "stock", timeframe = "1h", limit = 200 } = await req.json();

    const providerSymbol =
      asset === "crypto" ? mapCrypto(symbol) :
      asset === "forex"  ? mapFx(symbol)    :
      String(symbol).toUpperCase();

    const { mult, span } = mapTf(timeframe);

    const nowMs = Date.now();
    const lookbackMs = span === "day" ? 30*24*3600e3 : 48*3600e3;
    const fromMs = nowMs - lookbackMs;

    const urlMs = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/range/${mult}/${span}/${fromMs}/${nowMs}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonApiKey}`;
    const r1 = await fetch(urlMs, { headers: { "Cache-Control":"no-store" } });
    const j1 = await r1.json().catch(()=> ({}));

    let data = j1, source = "ms";
    if (!r1.ok || !j1?.results?.length) {
      const toISO = new Date(nowMs).toISOString().slice(0,10);
      const fromISO = new Date(nowMs - (span === "day" ? 30*24*3600e3 : 3*24*3600e3)).toISOString().slice(0,10);
      const urlISO = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/range/${mult}/${span}/${fromISO}/${toISO}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonApiKey}`;
      const r2 = await fetch(urlISO, { headers: { "Cache-Control":"no-store" } });
      const j2 = await r2.json().catch(()=> ({}));
      if (r2.ok && j2?.results?.length) { data = j2; source = "date"; }
      else {
        return new Response(JSON.stringify({
          success:false, error:"polygon_no_results",
          attempted: {
            urlMs: urlMs.replace(polygonApiKey, "[API_KEY]"),
            msResp: j1,
            urlISO: urlISO.replace(polygonApiKey, "[API_KEY]"),
            isoResp: j2
          }
        }), { status: 502, headers: cors });
      }
    }

    const results = data.results.slice(-Number(limit));
    const candles = results.map((b:any)=>({ t:b.t, o:b.o, h:b.h, l:b.l, c:b.c, v:b.v }));
    const last = candles.at(-1);

    return new Response(JSON.stringify({
      success: true,
      candles,
      provider: "polygon",
      providerSymbol,
      asset, timeframe, source,
      count: candles.length,
      lastClose: last?.c ?? null,
      lastTimeUTC: last ? new Date(last.t).toISOString() : null,
      isLikelyDelayed: asset === "stock"
    }), { headers: cors });

  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, error:String(e?.message || e) }), { status:500, headers:cors });
  }
});

function mapCrypto(ui: string) {
  const [b,q] = ui.replace(/\s+/g,"").toUpperCase().split("/");
  return `X:${(b||"BTC")}${(q||"USD")}`;
}
function mapFx(ui: string) {
  const [b,q] = ui.replace(/\s+/g,"").toUpperCase().split("/");
  return `C:${(b||"EUR")}${(q||"USD")}`;
}
function mapTf(tf: string): { mult:number; span:"minute"|"hour"|"day" } {
  const m: Record<string,[number,"minute"|"hour"|"day"]> = {
    "1m":[1,"minute"], "5m":[5,"minute"], "15m":[15,"minute"], "30m":[30,"minute"],
    "1h":[1,"hour"], "4h":[4,"hour"], "1d":[1,"day"],
    // aliases
    "1min":[1,"minute"], "5min":[5,"minute"], "15min":[15,"minute"], "60m":[1,"hour"], "240m":[4,"hour"], "D":[1,"day"]
  };
  return (m[tf] ?? [1,"minute"]) as any;
}