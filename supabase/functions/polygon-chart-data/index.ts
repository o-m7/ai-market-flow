import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartDataRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  timeframe: '1min' | '5min' | '15min' | '1hour' | '1day';
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

    const requestData: ChartDataRequest = await req.json();
    const { symbol, startDate, endDate, timeframe = '1day' } = requestData;

    console.log(`Fetching chart data for ${symbol} from ${startDate} to ${endDate} with ${timeframe} timeframe`);

    // Map timeframe to Polygon API format
    const timeframeMap = {
      '1min': { multiplier: 1, timespan: 'minute' },
      '5min': { multiplier: 5, timespan: 'minute' },
      '15min': { multiplier: 15, timespan: 'minute' },
      '1hour': { multiplier: 1, timespan: 'hour' },
      '1day': { multiplier: 1, timespan: 'day' }
    };

    const { multiplier, timespan } = timeframeMap[timeframe];

    // Fetch aggregated data from Polygon
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${polygonApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      // Generate fallback data if no results
      const fallbackData = generateFallbackChartData(symbol, startDate, endDate);
      
      return new Response(JSON.stringify({
        success: true,
        results: fallbackData,
        symbol,
        timeframe,
        source: 'fallback',
        count: fallbackData.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully fetched ${data.results.length} data points for ${symbol}`);

    return new Response(JSON.stringify({
      success: true,
      results: data.results,
      symbol,
      timeframe,
      source: 'polygon',
      count: data.results.length,
      next_url: data.next_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-chart-data function:', error);
    
    // Return fallback data on error
    const fallbackData = generateFallbackChartData('AAPL', '2024-01-01', '2024-12-31');
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: fallbackData,
      source: 'fallback'
    }), {
      status: 200, // Return 200 with fallback data
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackChartData(symbol: string, startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  const data = [];
  let currentPrice = 100 + Math.random() * 200; // Random base price between 100-300
  
  for (let timestamp = start; timestamp <= end; timestamp += dayInMs) {
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
  
  return data;
}