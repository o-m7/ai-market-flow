import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!finnhubApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "FINNHUB_API_KEY not configured",
        data: null
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { symbol, asset = "stock", dataType = "profile" } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({
        success: false,
        error: "Symbol is required",
        data: null
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean symbol for Finnhub (remove asset prefixes, convert crypto pairs)
    const cleanSymbol = cleanSymbolForFinnhub(symbol, asset);
    console.log(`Fetching ${dataType} data for symbol: ${cleanSymbol} (asset: ${asset})`);

    let data = {};
    
    // Fetch different types of data based on request
    switch (dataType) {
      case 'profile':
        data = await fetchCompanyProfile(cleanSymbol);
        break;
      case 'metrics':
        data = await fetchCompanyMetrics(cleanSymbol);
        break;
      case 'financials':
        data = await fetchCompanyFinancials(cleanSymbol);
        break;
      case 'all':
        const [profile, metrics, financials] = await Promise.allSettled([
          fetchCompanyProfile(cleanSymbol),
          fetchCompanyMetrics(cleanSymbol),
          fetchCompanyFinancials(cleanSymbol)
        ]);
        
        data = {
          profile: profile.status === 'fulfilled' ? profile.value : null,
          metrics: metrics.status === 'fulfilled' ? metrics.value : null,
          financials: financials.status === 'fulfilled' ? financials.value : null
        };
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data,
      symbol: cleanSymbol,
      asset,
      dataType,
      provider: "finnhub"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in finnhub-data function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Finnhub API error",
      data: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function cleanSymbolForFinnhub(symbol: string, asset: string): string {
  if (asset === 'crypto') {
    // For crypto, Finnhub expects format like BINANCE:BTCUSDT
    const pair = symbol.replace(/[\/\-]/g, '').toUpperCase();
    return `BINANCE:${pair}`;
  } else if (asset === 'forex') {
    // Forex pairs should be in format like OANDA:EUR_USD
    const pair = symbol.replace(/[\/]/g, '_').toUpperCase();
    return `OANDA:${pair}`;
  } else {
    // Stock symbols should be clean (just the ticker)
    return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}

async function fetchCompanyProfile(symbol: string) {
  const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${finnhubApiKey}`;
  console.log(`Fetching company profile: ${url.replace(finnhubApiKey!, '[API_KEY]')}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Finnhub profile API error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function fetchCompanyMetrics(symbol: string) {
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${finnhubApiKey}`;
  console.log(`Fetching company metrics: ${url.replace(finnhubApiKey!, '[API_KEY]')}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Finnhub metrics API error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function fetchCompanyFinancials(symbol: string) {
  // Fetch basic financials - quarterly earnings
  const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&freq=quarterly&token=${finnhubApiKey}`;
  console.log(`Fetching company financials: ${url.replace(finnhubApiKey!, '[API_KEY]')}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Finnhub financials API error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  // Return only the latest 4 quarters for AI analysis
  return {
    ...data,
    data: data.data?.slice(0, 4) || []
  };
}