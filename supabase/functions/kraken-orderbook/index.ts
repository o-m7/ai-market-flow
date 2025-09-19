import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderBookEntry {
  price: string;
  volume: string;
  timestamp: number;
}

interface OrderBookData {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: string;
}

// Map common symbols to Kraken format
const symbolMapping: Record<string, string> = {
  'BTCUSD': 'XXBTZUSD',
  'ETHUSD': 'XETHZUSD',
  'XRPUSD': 'XXRPZUSD',
  'ADAUSD': 'ADAUSD',
  'SOLUSD': 'SOLUSD',
  'DOTUSD': 'DOTUSD',
  'LINKUSD': 'LINKUSD',
  'MATICUSD': 'MATICUSD',
  'AVAXUSD': 'AVAXUSD',
  'UNIUSD': 'UNIUSD',
  'ATOMUSD': 'ATOMUSD',
  'ALGOUSD': 'ALGOUSD',
  'FILUSD': 'FILUSD',
  'LTCUSD': 'XLTCZUSD',
  'BCHUSD': 'BCHUSD',
  'DOGEUSD': 'XDGUSD',
  'EURUSD': 'EURUSD',
  'GBPUSD': 'GBPUSD',
  'USDJPY': 'USDJPY',
  'AUDUSD': 'AUDUSD',
  'USDCAD': 'USDCAD',
  'USDCHF': 'USDCHF',
  'NZDUSD': 'NZDUSD'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, depth = 25 } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Map symbol to Kraken format
    const krakenSymbol = symbolMapping[symbol.toUpperCase()] || symbol.toUpperCase();
    
    console.log(`Fetching order book for ${symbol} (Kraken: ${krakenSymbol})`);

    // Fetch order book from Kraken API
    const krakenUrl = `https://api.kraken.com/0/public/Depth?pair=${krakenSymbol}&count=${Math.min(depth, 500)}`;
    
    const response = await fetch(krakenUrl);
    
    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      console.error('Kraken API errors:', data.error);
      return new Response(
        JSON.stringify({ 
          error: `Kraken API error: ${data.error.join(', ')}`,
          availableSymbols: Object.keys(symbolMapping)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract order book data
    const result = data.result;
    const pairData = result[Object.keys(result)[0]]; // Get first (and only) pair data
    
    if (!pairData) {
      return new Response(
        JSON.stringify({ 
          error: `No data found for symbol ${symbol}`,
          krakenSymbol,
          availableSymbols: Object.keys(symbolMapping)
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process bids and asks
    const bids: OrderBookEntry[] = pairData.bids.map((bid: string[]) => ({
      price: bid[0],
      volume: bid[1],
      timestamp: parseInt(bid[2])
    }));

    const asks: OrderBookEntry[] = pairData.asks.map((ask: string[]) => ({
      price: ask[0],
      volume: ask[1],
      timestamp: parseInt(ask[2])
    }));

    const orderBookData: OrderBookData = {
      symbol: symbol.toUpperCase(),
      bids: bids.slice(0, depth), // Limit to requested depth
      asks: asks.slice(0, depth), // Limit to requested depth
      timestamp: new Date().toISOString()
    };

    console.log(`Successfully fetched order book for ${symbol}: ${bids.length} bids, ${asks.length} asks`);

    return new Response(
      JSON.stringify(orderBookData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching order book:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch order book data',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});