import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartDataRequest {
  symbol: string;
  timeframe: string;
  multiplier?: number;
  timespan?: string;
  from?: string;
  to?: string;
  limit?: number;
  asset?: 'stock' | 'crypto' | 'forex';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!polygonApiKey) {
      console.error('Polygon API key not configured');
      const fallbackData = generateFallbackChartData('AAPL', '2024-01-01', '2024-12-31');
      
      return new Response(JSON.stringify({
        success: true,
        candles: fallbackData,
        source: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: ChartDataRequest = await req.json();
    const { symbol: uiSymbol, timeframe: tf, limit = 300, asset } = requestData;

    console.log(`Fetching live chart data for ${uiSymbol} (${tf}) with asset type: ${asset || 'auto-detect'}`);

    // Detect asset type if not provided
    const detectedAsset = asset || detectAssetType(uiSymbol);
    
    // Map UI symbol to Polygon provider symbol
    const providerSymbol = mapSymbolForProvider(uiSymbol, detectedAsset);
    
    // Map timeframe to Polygon format
    const { mult, span } = mapTimeframe(tf);

    // Use millisecond timestamps to include "right now" in UTC
    const nowMs = Date.now();
    const lookbackMs = span === 'day' ? 30 * 24 * 3600e3 : 48 * 3600e3; // 30d for 1d bars, 48h for intraday
    const fromMs = nowMs - lookbackMs;

    console.log(`Fetching ${providerSymbol} from ${new Date(fromMs).toISOString()} to ${new Date(nowMs).toISOString()}`);

    const url = `https://api.polygon.io/v2/aggs/ticker/${providerSymbol}/range/${mult}/${span}/${fromMs}/${nowMs}?adjusted=true&sort=asc&limit=50000&apikey=${polygonApiKey}`;
    
    const response = await fetch(url, { 
      headers: { "Cache-Control": "no-store" } 
    });

    if (!response.ok) {
      console.error(`Polygon API error: ${response.status} ${response.statusText}`);
      const fallbackData = generateFallbackChartData(uiSymbol, new Date(fromMs).toISOString().slice(0,10), new Date(nowMs).toISOString().slice(0,10));
      return new Response(JSON.stringify({
        success: true,
        candles: fallbackData,
        source: 'fallback',
        error: `Polygon API error: ${response.status}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Polygon response status:', data.status);

    if (!data.results || data.results.length === 0) {
      console.log('No results from Polygon API, using fallback data');
      const fallbackData = generateFallbackChartData(uiSymbol, new Date(fromMs).toISOString().slice(0,10), new Date(nowMs).toISOString().slice(0,10));
      
      return new Response(JSON.stringify({
        success: true,
        candles: fallbackData,
        source: 'fallback',
        message: 'No data from Polygon, using fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get last N bars
    const ohlcv = data.results.slice(-limit).map((b: any) => ({
      t: b.t,
      o: b.o,
      h: b.h,
      l: b.l,
      c: b.c,
      v: b.v
    }));

    const lastBar = ohlcv[ohlcv.length - 1];
    
    console.log(`Successfully fetched ${ohlcv.length} live data points for ${providerSymbol}`);
    console.log(`Last bar: ${lastBar?.c} @ ${lastBar ? new Date(lastBar.t).toISOString() : 'N/A'}`);

    return new Response(JSON.stringify({
      success: true,
      candles: ohlcv,
      provider: 'polygon',
      providerSymbol,
      symbol: uiSymbol,
      asset: detectedAsset,
      timeframe: tf,
      source: 'polygon',
      count: ohlcv.length,
      lastClose: lastBar?.c,
      lastTimeUTC: lastBar ? new Date(lastBar.t).toISOString() : null,
      isLikelyDelayed: detectedAsset === 'stock', // Stock data is often delayed
      meta: `${providerSymbol} • ${tf} • last=${lastBar?.c} @ ${lastBar ? new Date(lastBar.t).toISOString() : 'N/A'}${detectedAsset === 'stock' ? ' • (may be delayed)' : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-chart-data function:', error);
    
    const fallbackData = generateFallbackChartData('AAPL', '2024-01-01', '2024-12-31');
    
    return new Response(JSON.stringify({
      success: true,
      candles: fallbackData,
      source: 'fallback',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectAssetType(symbol: string): 'stock' | 'crypto' | 'forex' {
  const s = symbol.toUpperCase();
  
  // Forex patterns
  if (['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY'].includes(s)) {
    return 'forex';
  }
  
  // Crypto patterns
  if (s.includes('BTC') || s.includes('ETH') || s.includes('ADA') || s.includes('SOL') || s.includes('DOGE') || s.includes('LTC') || s.includes('XRP') || s.includes('AVAX') || s.includes('MATIC') || s.includes('DOT') || s.includes('LINK') || s.includes('UNI') || s.includes('ATOM') || s.includes('ALGO') || (s.includes('USD') && s.length <= 6 && s !== 'USDJPY')) {
    return 'crypto';
  }
  
  return 'stock';
}

function mapSymbolForProvider(uiSymbol: string, asset: 'stock' | 'crypto' | 'forex'): string {
  const s = uiSymbol.toUpperCase();
  
  switch (asset) {
    case 'crypto':
      if (s.startsWith('X:')) return s;
      // Handle formats like BTC/USD, BTCUSD
      const parts = s.includes('/') ? s.split('/') : [s.replace('USD', ''), 'USD'];
      const base = parts[0] || 'BTC';
      const quote = parts[1] || 'USD';
      return `X:${base}${quote}`;
      
    case 'forex':
      if (s.startsWith('C:')) return s;
      // Handle formats like EUR/USD, EURUSD
      const fxParts = s.includes('/') ? s.split('/') : [s.slice(0, 3), s.slice(3)];
      const baseFx = fxParts[0] || 'EUR';
      const quoteFx = fxParts[1] || 'USD';
      return `C:${baseFx}${quoteFx}`;
      
    default:
      return s; // Stocks use plain symbols
  }
}

function mapTimeframe(tf: string): { mult: number; span: string } {
  const map: Record<string, [number, string]> = {
    '1m': [1, 'minute'],
    '5m': [5, 'minute'],
    '15m': [15, 'minute'],
    '30m': [30, 'minute'],
    '1h': [1, 'hour'],
    '4h': [4, 'hour'],
    '1d': [1, 'day'],
    '60m': [1, 'hour'],
    '240m': [4, 'hour'],
    'D': [1, 'day']
  };
  
  const [mult, span] = map[tf] ?? [1, 'minute'];
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