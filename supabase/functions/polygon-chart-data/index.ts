import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

if (!polygonApiKey) {
  console.error("[ERROR] POLYGON_API_KEY is not set in Supabase edge function environment.");
} else {
  console.log("[INFO] POLYGON_API_KEY is configured and ready.");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartDataRequest {
  symbol: string;
  timeframe: string;
  asset?: 'stock' | 'crypto' | 'forex';
  limit?: number;
  lite?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!polygonApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'POLYGON_API_KEY not configured',
        hint: 'Please add your Polygon API key to Supabase secrets'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

const requestData: ChartDataRequest = await req.json();
    const { 
      symbol: uiSymbol = "AAPL", 
      timeframe: tf = "1h", 
      asset = "stock",
      limit = 300,
      lite = false 
    } = requestData;

    console.log(`Fetching ${asset} data for ${uiSymbol} (${tf}) with limit ${limit}`);

    // Map UI symbol to Polygon provider symbol
    const providerSymbol = 
      asset === "crypto" ? mapCrypto(uiSymbol)
      : asset === "forex" ? mapFx(uiSymbol)
      : uiSymbol.toUpperCase();

    const { mult, span } = mapTimeframe(tf);

    // --- Try ms range first (includes "now" in UTC) ---
    const nowMs = Date.now();

    // Compute dynamic lookback based on requested limit and timeframe
    const unitMs = span === "minute" ? 60_000 : span === "hour" ? 3_600_000 : 86_400_000;
    const isLite = Boolean(lite);
    const desiredBars = isLite ? Math.max(limit ?? 2, 2) : Math.max(limit ?? 300, 150);
    const marketBuffer = isLite ? 1 : (asset === "stock" ? 3 : 2); // smaller buffer for lite/meta requests
    const lookbackMs = desiredBars * mult * unitMs * marketBuffer;

    const fromMs = nowMs - lookbackMs;

    const urlMs = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/range/${mult}/${span}/${fromMs}/${nowMs}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonApiKey}`;

    console.log(`Trying millisecond range: ${urlMs}`);

    const r1 = await fetch(urlMs, { 
      headers: { "Cache-Control": "no-store" } 
    });
    
    let j1: any = {};
    try {
      j1 = await r1.json();
    } catch (e) {
      console.error("Failed to parse first response as JSON:", e);
    }

    // Fallback: try ISO date strings if ms returned no results
    let data = j1;
    let source = "ms";
    
    if (!r1.ok || !j1?.results?.length) {
      console.log(`Millisecond range failed (${r1.status}), trying ISO date range...`);
      
      const toISO = new Date(nowMs).toISOString().slice(0, 10);
      const fromISO = new Date(nowMs - lookbackMs).toISOString().slice(0, 10);
      
      const urlISO = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/range/${mult}/${span}/${fromISO}/${toISO}?adjusted=true&sort=asc&limit=50000&apiKey=${polygonApiKey}`;
      
      console.log(`Trying ISO date range: ${urlISO}`);
      
      const r2 = await fetch(urlISO, { 
        headers: { "Cache-Control": "no-store" } 
      });
      
      let j2: any = {};
      try {
        j2 = await r2.json();
      } catch (e) {
        console.error("Failed to parse second response as JSON:", e);
      }
      
      if (r2.ok && j2?.results?.length) {
        data = j2;
        source = "date";
        console.log(`ISO date range succeeded with ${j2.results.length} results`);
      } else {
        // Return detailed error so you can see exactly what Polygon said
        console.error("Both API attempts failed:", { r1: r1.status, j1, r2: r2.status, j2 });
        
        return new Response(JSON.stringify({
          success: false,
          error: "polygon_no_results",
          details: {
            providerSymbol, 
            timeframe: tf, 
            attempted: { 
              urlMs: urlMs.replace(polygonApiKey, '[API_KEY]'), 
              msResponse: j1, 
              urlISO: urlISO.replace(polygonApiKey, '[API_KEY]'), 
              isoResponse: j2 
            },
            hint: {
              hasApiKey: Boolean(polygonApiKey),
              exampleCurl: `curl "https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/minute/2025-08-16/2025-08-17?adjusted=true&sort=asc&limit=50000&apiKey=YOUR_KEY"`
            }
          }
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log(`Millisecond range succeeded with ${j1.results.length} results`);
    }

    const results = data.results.slice(-limit);
    const ohlcv = results.map((b: any) => ({
      t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v
    }));
    
    const last = ohlcv[ohlcv.length - 1];

    console.log(`Successfully processed ${ohlcv.length} bars for ${providerSymbol} (source: ${source})`);
    
    if (last) {
      console.log(`Last bar: ${last.c} @ ${new Date(last.t).toISOString()}`);
    }

    // Get additional debug info: previous close and current snapshot
    let prevClose: number | null = null;
    let prevTime: string | null = null;
    let snapshotLastTrade: number | null = null;
    let snapshotTimeUTC: string | null = null;

    // Prefer previous bar close if available (updates with every poll)
    const prevBar = ohlcv.length >= 2 ? ohlcv[ohlcv.length - 2] : null;
    if (prevBar) {
      prevClose = prevBar.c ?? null;
      prevTime = prevBar?.t ? new Date(prevBar.t).toISOString() : null;
    }

    try {
      // Previous close (fallback to Polygon prev endpoint only if needed)
      if (prevClose == null) {
        const prevUrl = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/prev?adjusted=true&apiKey=${polygonApiKey}`;
        const prevRes = await fetch(prevUrl, { headers: { "Cache-Control": "no-store" } });
        if (prevRes.ok) {
          const prev = await prevRes.json();
          prevClose = prev?.results?.[0]?.c ?? prevClose;
          prevTime = prev?.results?.[0]?.t ? new Date(prev.results[0].t).toISOString() : prevTime;
        }
      }

      // Current snapshot (for stocks/forex/crypto)
      let snapUrl = '';
      if (asset === 'stock') {
        snapUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${providerSymbol}?apiKey=${polygonApiKey}`;
      } else if (asset === 'forex') {
        snapUrl = `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers/${providerSymbol}?apiKey=${polygonApiKey}`;
      } else if (asset === 'crypto') {
        snapUrl = `https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers/${providerSymbol}?apiKey=${polygonApiKey}`;
      }

      if (snapUrl) {
        const snapRes = await fetch(snapUrl, { headers: { "Cache-Control": "no-store" } });
        if (snapRes.ok) {
          const snap = await snapRes.json();
          const ticker = snap?.results ?? snap?.ticker;
          const lastTrade = ticker?.last_trade ?? ticker?.lastTrade;
          snapshotLastTrade = lastTrade?.price ?? lastTrade?.p ?? null;
          snapshotTimeUTC = lastTrade?.sip_timestamp 
            ? new Date(lastTrade.sip_timestamp).toISOString()
            : lastTrade?.t 
            ? new Date(lastTrade.t).toISOString()
            : null;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch additional debug info:', error);
    }

    const enrichedMeta = `${providerSymbol} • ${tf} • barLast=${last?.c ?? 'N/A'} @ ${last ? new Date(last.t).toISOString() : 'N/A'} | prevClose=${prevClose ?? 'N/A'} @ ${prevTime ?? 'N/A'} | snapshotTrade=${snapshotLastTrade ?? 'N/A'} @ ${snapshotTimeUTC ?? 'N/A'}${asset === 'stock' ? ' • (may be delayed)' : ''}`;

    console.log('Enriched meta:', enrichedMeta);

    return new Response(JSON.stringify({
      success: true,
      candles: ohlcv,
      provider: "polygon",
      providerSymbol,
      symbol: uiSymbol,
      asset,
      timeframe: tf,
      source,  // "ms" or "date" (which range worked)
      count: ohlcv.length,
      lastClose: last?.c ?? null,
      lastTimeUTC: last ? new Date(last.t).toISOString() : null,
      prevClose,
      prevTime,
      snapshotLastTrade,
      snapshotTimeUTC,
      isLikelyDelayed: asset === "stock",
      meta: enrichedMeta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-chart-data function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "polygon_failed",
      candles: [],
      source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ---- Helper functions ----
function mapCrypto(uiSymbol: string): string {
  const s = uiSymbol.replace(/\s+/g, "").toUpperCase();
  
  // Already provider formatted
  if (s.startsWith('X:')) return s;
  
  // Slash-separated format (e.g., "BTC/USD")
  if (s.includes("/")) {
    const [base, quote] = s.split("/");
    return `X:${(base || "BTC").toUpperCase()}${(quote || "USD").toUpperCase()}`;
  }
  
  // Raw ticker format (e.g., "BTCUSD", "ETHUSDT")
  return `X:${s}`;
}

function mapFx(uiSymbol: string): string {
  const s = uiSymbol.replace(/\s+/g, "").toUpperCase();
  
  // Already provider formatted
  if (s.startsWith('C:')) return s;
  
  // Slash-separated format (e.g., "EUR/USD") 
  if (s.includes("/")) {
    const [base, quote] = s.split("/");
    return `C:${(base || "EUR").toUpperCase()}${(quote || "USD").toUpperCase()}`;
  }
  
  // Raw ticker format (e.g., "EURUSD")
  return `C:${s}`;
}

function mapTimeframe(tf: string): { mult: number; span: string } {
  const map: Record<string, [number, string]> = {
    // Standard formats
    "1m": [1, "minute"], "1min": [1, "minute"],
    "5m": [5, "minute"], "5min": [5, "minute"],
    "15m": [15, "minute"], "15min": [15, "minute"],
    "30m": [30, "minute"], "30min": [30, "minute"],
    "1h": [1, "hour"], "60m": [1, "hour"], "1hour": [1, "hour"],
    "4h": [4, "hour"], "240m": [4, "hour"], "4hour": [4, "hour"],
    "1d": [1, "day"], "D": [1, "day"], "1day": [1, "day"],
    // Legacy support
    "1": [1, "minute"],
    "5": [5, "minute"],
    "15": [15, "minute"],
    "30": [30, "minute"],
    "60": [1, "hour"],
    "240": [4, "hour"]
  };
  
  const [mult, span] = map[tf] ?? [1, "minute"];
  console.log(`Mapped timeframe '${tf}' to [${mult}, '${span}']`);
  return { mult, span };
}

function generateFallbackChartData(symbol: string, startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  const data = [];
  let currentPrice = 100 + Math.random() * 200; // Random base price between 100-300
  
  // Generate at least 30 days of data
  const daysToGenerate = Math.min(Math.max(30, Math.floor((end - start) / dayInMs)), 100);
  const startTime = end - (daysToGenerate * dayInMs);
  
  for (let i = 0; i < daysToGenerate; i++) {
    const timestamp = startTime + (i * dayInMs);
    const date = new Date(timestamp);
    
    // Skip weekends for stock data
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Add some realistic price movement
    const volatility = 0.02; // 2% daily volatility
    const dailyChange = (Math.random() - 0.5) * 2 * volatility;
    
    const open = currentPrice;
    const priceRange = open * 0.05; // 5% intraday range
    const high = open + Math.random() * priceRange;
    const low = open - Math.random() * priceRange;
    const close = open * (1 + dailyChange);
    
    // Ensure high is the highest and low is the lowest
    const adjustedHigh = Math.max(high, open, close);
    const adjustedLow = Math.min(low, open, close);
    
    data.push({
      t: timestamp,
      o: Number(open.toFixed(2)),
      h: Number(adjustedHigh.toFixed(2)),
      l: Number(adjustedLow.toFixed(2)),
      c: Number(close.toFixed(2)),
      v: Math.floor(Math.random() * 10000000) + 1000000 // Random volume 1M-11M
    });
    
    currentPrice = close;
  }
  
  console.log(`Generated ${data.length} fallback data points for ${symbol}`);
  return data;
}