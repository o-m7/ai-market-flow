import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!polygonApiKey) {
      return new Response(JSON.stringify({
        error: 'POLYGON_API_KEY not configured'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { symbol, timeframe = '1h', asset = 'stock', candles } = await req.json();
    
    console.log(`Fetching technical indicators for ${symbol} (${timeframe}, ${asset})`);

    // Map symbol to Polygon format
    const providerSymbol = 
      asset === "crypto" ? (symbol.startsWith('X:') ? symbol : `X:${symbol}`)
      : asset === "forex" ? (symbol.startsWith('C:') ? symbol : `C:${symbol}`)
      : symbol.toUpperCase();

    // Map timeframe to Polygon format
    const tfMap: Record<string, string> = {
      '1m': 'minute', '5m': 'minute', '15m': 'minute', '30m': 'minute',
      '1h': 'hour', '60m': 'hour', '4h': 'hour', '240m': 'hour',
      '1d': 'day', 'D': 'day'
    };
    const timespan = tfMap[timeframe] || 'hour';

    // Fetch indicators from Polygon API in parallel
    const [rsiRes, ema20Res, ema50Res, ema200Res, macdRes, smaRes] = await Promise.all([
      fetch(`https://api.polygon.io/v1/indicators/rsi/${providerSymbol}?timespan=${timespan}&adjusted=true&window=14&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`),
      fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=20&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`),
      fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=50&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`),
      fetch(`https://api.polygon.io/v1/indicators/ema/${providerSymbol}?timespan=${timespan}&adjusted=true&window=200&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`),
      fetch(`https://api.polygon.io/v1/indicators/macd/${providerSymbol}?timespan=${timespan}&adjusted=true&short_window=12&long_window=26&signal_window=9&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`),
      fetch(`https://api.polygon.io/v1/indicators/sma/${providerSymbol}?timespan=${timespan}&adjusted=true&window=20&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`)
    ]);

    const [rsiData, ema20Data, ema50Data, ema200Data, macdData, smaData] = await Promise.all([
      rsiRes.json(),
      ema20Res.json(),
      ema50Res.json(),
      ema200Res.json(),
      macdRes.json(),
      smaRes.json()
    ]);

    // Calculate Bollinger Bands and other indicators from candles
    const closes = candles?.map((c: any) => c.c) || [];
    const highs = candles?.map((c: any) => c.h) || [];
    const lows = candles?.map((c: any) => c.l) || [];

    const bb = calculateBollingerBands(closes, 20, 2);
    const atr14 = calculateATR(highs, lows, closes, 14);
    const vwap = calculateVWAP(candles || []);
    const support = findSupportLevels(lows);
    const resistance = findResistanceLevels(highs);

    const technical = {
      ema20: ema20Data?.results?.values?.[0]?.value || 0,
      ema50: ema50Data?.results?.values?.[0]?.value || 0,
      ema200: ema200Data?.results?.values?.[0]?.value || 0,
      rsi14: rsiData?.results?.values?.[0]?.value || 50,
      macd: {
        line: macdData?.results?.values?.[0]?.value || 0,
        signal: macdData?.results?.values?.[0]?.signal || 0,
        hist: (macdData?.results?.values?.[0]?.value || 0) - (macdData?.results?.values?.[0]?.signal || 0)
      },
      atr14,
      bb,
      vwap,
      support,
      resistance
    };

    console.log('Technical indicators fetched from Polygon:', technical);

    return new Response(JSON.stringify(technical), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-indicators function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to fetch indicators'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for indicators not available in Polygon API
function calculateBollingerBands(values: number[], period: number = 20, multiplier: number = 2) {
  if (values.length < period) {
    const last = values[values.length - 1] || 0;
    return { upper: last, mid: last, lower: last };
  }
  
  const recentValues = values.slice(-period);
  const mid = recentValues.reduce((a, b) => a + b, 0) / period;
  const variance = recentValues.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: mid + (stdDev * multiplier),
    mid: mid,
    lower: mid - (stdDev * multiplier)
  };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < 2) return 0;
  
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trs.push(Math.max(tr1, tr2, tr3));
  }
  
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

function calculateVWAP(candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>): number {
  if (!candles.length) return 0;
  
  let totalVolumePrice = 0;
  let totalVolume = 0;
  
  for (const candle of candles.slice(-30)) {
    const typical = (candle.h + candle.l + candle.c) / 3;
    const volume = candle.v || 1;
    totalVolumePrice += typical * volume;
    totalVolume += volume;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

function findSupportLevels(lows: number[]): number[] {
  if (lows.length < 10) return [];
  
  const recentLows = lows.slice(-50);
  const sortedLows = [...recentLows].sort((a, b) => a - b);
  
  return [sortedLows[0], sortedLows[1]].filter(Boolean);
}

function findResistanceLevels(highs: number[]): number[] {
  if (highs.length < 10) return [];
  
  const recentHighs = highs.slice(-50);
  const sortedHighs = [...recentHighs].sort((a, b) => b - a);
  
  return [sortedHighs[0], sortedHighs[1]].filter(Boolean);
}
