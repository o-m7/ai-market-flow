import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolygonTicker {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc: string;
}

interface PolygonQuote {
  ticker: string;
  last_quote?: {
    ask: number;
    ask_size: number;
    bid: number;
    bid_size: number;
    exchange: number;
    last_updated: number;
  };
  last_trade?: {
    conditions: number[];
    exchange: number;
    price: number;
    sip_timestamp: number;
    size: number;
    timeframe: string;
  };
  min?: {
    av: number;
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
  prevDay?: {
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!polygonApiKey) {
      throw new Error('Polygon API key not configured');
    }

    const { symbols } = await req.json();
    console.log('Fetching data for symbols:', symbols);

    const defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
    const symbolsToFetch: string[] = (symbols && Array.isArray(symbols) && symbols.length > 0) ? symbols : defaultSymbols;

    const normalize = (s: string) => {
      const U = (s || '').toUpperCase();
      const isForex = ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','NZDUSD','EURGBP','EURJPY','GBPJPY','AUDJPY','CADJPY'].includes(U);
      const isCrypto = U.includes('BTC') || U.includes('ETH') || U.includes('ADA') || U.includes('SOL') || U.includes('DOGE') || U.includes('LTC') || U.includes('XRP') || U.includes('AVAX') || U.includes('MATIC') || U.includes('DOT') || U.includes('LINK') || U.includes('UNI') || U.includes('ATOM') || U.includes('ALGO') || (U.includes('USD') && U.length <= 6 && U !== 'USDJPY');
      if (isForex) return U.startsWith('C:') ? U : `C:${U}`;
      if (isCrypto) return U.startsWith('X:') ? U : `X:${U}`;
      return U; // stock
    };

    const getMarketPath = (norm: string) => {
      if (norm.startsWith('X:')) return { locale: 'global', market: 'crypto' } as const;
      if (norm.startsWith('C:')) return { locale: 'global', market: 'forex' } as const;
      return { locale: 'us', market: 'stocks' } as const;
    };

    const marketData: Array<{ symbol: string; price: number; timestamp?: number }> = [];

    for (const raw of symbolsToFetch.slice(0, 10)) {
      try {
        const norm = normalize(raw);
        const { locale, market } = getMarketPath(norm);
        const url = `https://api.polygon.io/v2/snapshot/locale/${locale}/markets/${market}/tickers/${norm}?apikey=${polygonApiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed snapshot for ${norm}:`, res.status, res.statusText);
          continue;
        }
        const body = await res.json();
        const obj: any = body.results || body || {};
        // Price extraction: support multiple shapes
        const price = obj.last_trade?.price ?? obj.last_trade?.p ?? obj.lastTrade?.price ?? obj.lastTrade?.p ?? obj.min?.c ?? obj.prevDay?.c ?? null;
        const ts = obj.last_trade?.sip_timestamp ?? obj.last_trade?.t ?? obj.lastTrade?.t ?? obj.min?.t ?? obj.prevDay?.t ?? Date.now();
        if (price == null) {
          console.warn(`No price found for ${norm}`);
          continue;
        }
        marketData.push({ symbol: norm, price: Number(price), timestamp: typeof ts === 'number' ? ts : Date.parse(ts) });
        await new Promise((r) => setTimeout(r, 120));
      } catch (error) {
        console.error(`Error fetching data for symbol:`, raw, error);
      }
    }

    console.log(`Successfully fetched quotes for ${marketData.length} symbols`);
    return new Response(JSON.stringify({ 
      data: marketData,
      timestamp: new Date().toISOString(),
      source: 'polygon'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-market-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      data: [],
      source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});