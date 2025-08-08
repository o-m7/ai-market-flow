import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval = '1h', limit = 100 } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Convert symbol to Binance format (e.g., AAPL -> APLUSD, BTC -> BTCUSDT)
    let binanceSymbol = symbol.toUpperCase();
    if (!binanceSymbol.includes('USDT') && !binanceSymbol.includes('USD')) {
      binanceSymbol = symbol.toUpperCase() + 'USDT';
    }

    console.log(`Fetching data for ${binanceSymbol} with interval ${interval}`);

    // Fetch data from Binance API
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(binanceUrl);
    
    if (!response.ok) {
      console.error('Binance API error:', response.status, response.statusText);
      // Fallback to mock data if Binance API fails
      return new Response(
        JSON.stringify({ 
          data: generateMockData(interval, limit),
          source: 'mock',
          symbol: binanceSymbol 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const binanceData = await response.json();
    
    // Transform Binance data to our format
    const transformedData = binanceData.map((kline: any[], index: number) => {
      const [
        openTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        quoteAssetVolume,
        numberOfTrades,
        takerBuyBaseAssetVolume,
        takerBuyQuoteAssetVolume,
        ignore
      ] = kline;

      // Format time based on interval
      const date = new Date(openTime);
      let time: string;
      
      if (interval.includes('m')) {
        time = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (interval.includes('h')) {
        time = date.toLocaleTimeString('en-US', { 
          hour: '2-digit',
          hour12: false 
        }) + ':00';
      } else if (interval.includes('d')) {
        time = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        time = date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
      }

      return {
        time,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: Math.round(parseFloat(volume)),
        timestamp: openTime
      };
    });

    console.log(`Successfully fetched ${transformedData.length} data points for ${binanceSymbol}`);

    return new Response(
      JSON.stringify({ 
        data: transformedData,
        source: 'binance',
        symbol: binanceSymbol,
        interval 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Binance data:', error);
    
    // Return mock data as fallback
    const { symbol = 'BTCUSDT', interval = '1h', limit = 100 } = await req.json().catch(() => ({}));
    
    return new Response(
      JSON.stringify({ 
        data: generateMockData(interval, limit),
        source: 'mock',
        symbol,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

// Fallback mock data generator
function generateMockData(interval: string, limit: number) {
  const basePrice = 45000; // Base BTC price
  
  return Array.from({ length: limit }, (_, i) => {
    const open = basePrice + (i * 10) + (Math.random() * 1000 - 500);
    const volatility = Math.random() * 2000 + 200;
    const high = open + (Math.random() * volatility);
    const low = open - (Math.random() * volatility);
    const close = low + (Math.random() * (high - low));
    
    // Generate time based on interval
    const now = new Date();
    let time: string;
    
    if (interval.includes('m')) {
      const minutes = parseInt(interval.replace('m', ''));
      const date = new Date(now.getTime() - (limit - i) * minutes * 60 * 1000);
      time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (interval.includes('h')) {
      const hours = parseInt(interval.replace('h', ''));
      const date = new Date(now.getTime() - (limit - i) * hours * 60 * 60 * 1000);
      time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        hour12: false 
      }) + ':00';
    } else {
      const date = new Date(now.getTime() - (limit - i) * 24 * 60 * 60 * 1000);
      time = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return {
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      timestamp: now.getTime() - (limit - i) * 60000
    };
  });
}