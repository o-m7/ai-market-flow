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
      const U = (s || '').toUpperCase().replace(/\//g, '');
      // Check for crypto patterns
      if (U.includes('USD') && ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK'].some(crypto => U.includes(crypto))) {
        return U.startsWith('X:') ? U : `X:${U}`;
      }
      // Check for forex patterns
      if (U.match(/^[A-Z]{3}[A-Z]{3}$/) && U.includes('USD')) {
        return U.startsWith('C:') ? U : `C:${U}`;
      }
      return U; // stock
    };

    const getMarketPath = (norm: string) => {
      if (norm.startsWith('X:')) return { locale: 'global', market: 'crypto' } as const;
      if (norm.startsWith('C:')) return { locale: 'global', market: 'forex' } as const;
      return { locale: 'us', market: 'stocks' } as const;
    };

    const getMarketName = (symbol: string): string => {
      const names: Record<string, string> = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft Corporation', 
        'GOOGL': 'Alphabet Inc.',
        'AMZN': 'Amazon.com Inc.',
        'TSLA': 'Tesla Inc.',
        'NVDA': 'NVIDIA Corporation',
        'META': 'Meta Platforms Inc.',
        'NFLX': 'Netflix Inc.',
        'DIS': 'The Walt Disney Company',
        'BABA': 'Alibaba Group Holding Limited',
        'BTC/USD': 'Bitcoin',
        'ETH/USD': 'Ethereum',
        'BNB/USD': 'Binance Coin',
        'XRP/USD': 'Ripple',
        'ADA/USD': 'Cardano',
        'SOL/USD': 'Solana',
        'DOT/USD': 'Polkadot',
        'MATIC/USD': 'Polygon',
        'AVAX/USD': 'Avalanche',
        'LINK/USD': 'Chainlink',
        'EUR/USD': 'Euro / US Dollar',
        'GBP/USD': 'British Pound / US Dollar',
        'USD/JPY': 'US Dollar / Japanese Yen',
        'SPY': 'SPDR S&P 500 ETF',
        'QQQ': 'Invesco QQQ Trust ETF',
      };
      return names[symbol] || symbol;
    };

    const formatVolume = (volume: number): string => {
      if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
      } else if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
      }
      return volume.toString();
    };

    const generateAISummary = (symbol: string, sentiment: string, price: number): string => {
      const summaries = {
        bullish: [
          `Strong technical indicators suggest continued upward momentum. Support at $${(price * 0.95).toFixed(2)}.`,
          `Breakout above key resistance levels. Positive momentum building.`,
          `Technical analysis shows bullish pattern formation.`
        ],
        bearish: [
          `Technical indicators showing weakness. Support under pressure.`,
          `Bearish divergence detected. Risk of further downside.`,
          `Selling pressure increasing. Key levels critical to hold.`
        ],
        neutral: [
          `Consolidating near key levels. Awaiting catalyst for next move.`,
          `Trading within established range. Mixed signals from indicators.`,
          `Sideways movement expected in near term.`
        ]
      };
      
      const sentimentSummaries = summaries[sentiment as keyof typeof summaries] || summaries.neutral;
      return sentimentSummaries[Math.floor(Math.random() * sentimentSummaries.length)];
    };

    const marketData: Array<any> = [];

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
        const currentPrice = obj.last_trade?.price ?? obj.last_trade?.p ?? obj.lastTrade?.price ?? obj.lastTrade?.p ?? obj.min?.c ?? obj.prevDay?.c ?? 0;
        const prevClose = obj.prevDay?.c ?? obj.prev_day?.c ?? currentPrice;
        const volume = obj.last_trade?.size ?? obj.min?.v ?? obj.prevDay?.v ?? 0;
        
        if (currentPrice === 0) {
          console.warn(`No price found for ${norm}`);
          continue;
        }

        const change = currentPrice - prevClose;
        const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

        // Generate AI sentiment
        const sentiments = ['bullish', 'bearish', 'neutral'];
        const aiSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

        marketData.push({
          symbol: raw, // Use original symbol format
          name: getMarketName(raw),
          price: Number(currentPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: formatVolume(volume),
          rsi: Math.floor(Math.random() * 40) + 30, // Mock RSI between 30-70
          aiSentiment,
          aiSummary: generateAISummary(raw, aiSentiment, currentPrice)
        });

        // Rate limiting
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