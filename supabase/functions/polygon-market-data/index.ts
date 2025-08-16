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

    // Popular symbols to fetch if none provided
    const defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
    const symbolsToFetch = symbols || defaultSymbols;

    const marketData = [];

    for (const symbol of symbolsToFetch.slice(0, 10)) { // Limit to 10 symbols to avoid rate limits
      try {
        // Get current quote data
        const quoteResponse = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${polygonApiKey}`
        );

        if (!quoteResponse.ok) {
          console.error(`Failed to fetch quote for ${symbol}:`, quoteResponse.status);
          continue;
        }

        const quoteData = await quoteResponse.json();
        const ticker = quoteData.results;

        if (!ticker) {
          console.error(`No ticker data for ${symbol}`);
          continue;
        }

        // Get company name
        let companyName = symbol;
        try {
          const detailsResponse = await fetch(
            `https://api.polygon.io/v3/reference/tickers/${symbol}?apikey=${polygonApiKey}`
          );
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            companyName = detailsData.results?.name || symbol;
          }
        } catch (error) {
          console.error(`Failed to fetch company name for ${symbol}:`, error);
        }

        // Calculate metrics
        const currentPrice = ticker.last_trade?.price || ticker.prevDay?.c || 0;
        const previousClose = ticker.prevDay?.c || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
        const volume = ticker.prevDay?.v || 0;

        // Generate mock RSI (in real implementation, you'd calculate this from historical data)
        const rsi = Math.floor(Math.random() * 40) + 30; // 30-70 range

        // Determine AI sentiment based on price movement
        let aiSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let aiSummary = '';

        if (changePercent > 2) {
          aiSentiment = 'bullish';
          aiSummary = `Strong upward momentum with ${changePercent.toFixed(2)}% gain. Watch for resistance at $${(currentPrice * 1.05).toFixed(2)}.`;
        } else if (changePercent < -2) {
          aiSentiment = 'bearish';
          aiSummary = `Significant downward pressure with ${Math.abs(changePercent).toFixed(2)}% decline. Support may be found at $${(currentPrice * 0.95).toFixed(2)}.`;
        } else {
          aiSummary = `Trading within normal range. Key level to watch is $${previousClose.toFixed(2)}.`;
        }

        marketData.push({
          symbol,
          name: companyName,
          price: currentPrice,
          change,
          changePercent,
          volume: volume > 1000000 ? `${(volume / 1000000).toFixed(1)}M` : `${Math.floor(volume / 1000)}K`,
          rsi,
          aiSentiment,
          aiSummary,
        });

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      }
    }

    console.log(`Successfully fetched data for ${marketData.length} symbols`);

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