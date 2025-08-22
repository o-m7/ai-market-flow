import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "forex" | "index";
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap?: string;
}

const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return String(volume);
};

const normalizeSymbol = (symbol: string): string => {
  // Normalize different symbol formats for Polygon API
  if (symbol.includes('/')) {
    const [base, quote] = symbol.split('/');
    if (['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'].includes(base) || 
        ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'].includes(quote)) {
      return `C:${base}${quote}`;
    } else {
      return `X:${base}USD`;
    }
  }
  return symbol.toUpperCase();
};

const getAssetType = (symbol: string): "stock" | "crypto" | "forex" | "index" => {
  if (symbol.startsWith('X:')) return 'crypto';
  if (symbol.startsWith('C:')) return 'forex';
  if (['SPY', 'QQQ', 'DIA', 'IWM', 'VTI'].includes(symbol)) return 'index';
  return 'stock';
};

const getMarketName = (symbol: string): string => {
  const map: Record<string, string> = {
    AAPL: 'Apple Inc.', MSFT: 'Microsoft Corporation', GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.', TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corporation',
    META: 'Meta Platforms Inc.', NFLX: 'Netflix Inc.', DIS: 'The Walt Disney Company',
    BABA: 'Alibaba Group Holding Limited', IBM: 'International Business Machines',
    GOOG: 'Alphabet Inc.', JPM: 'JPMorgan Chase & Co.', BAC: 'Bank of America Corp.',
    'X:BTCUSD': 'Bitcoin', 'X:ETHUSD': 'Ethereum', 'X:BNBUSD': 'Binance Coin',
    'X:XRPUSD': 'Ripple', 'X:ADAUSD': 'Cardano', 'X:SOLUSD': 'Solana',
    'C:EURUSD': 'Euro / US Dollar', 'C:GBPUSD': 'British Pound / US Dollar',
    'C:USDJPY': 'US Dollar / Japanese Yen', 'C:USDCHF': 'US Dollar / Swiss Franc',
    SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust ETF', DIA: 'SPDR Dow Jones Industrial Average ETF'
  };
  return map[symbol] || symbol.replace(/^[XC]:/, '').replace('USD', '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 1) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const polygonApiKey = Deno.env.get("POLYGON_API_KEY");
    
    if (!polygonApiKey) {
      console.log("No Polygon API key found, returning mock data");
      return generateMockSearchResults(query);
    }

    const searchQuery = query.toUpperCase();
    const results: SearchResult[] = [];

    // Search in different markets
    const searchPromises = [
      searchStocks(searchQuery, polygonApiKey),
      searchCrypto(searchQuery, polygonApiKey),
      searchForex(searchQuery, polygonApiKey)
    ];

    const searchResults = await Promise.allSettled(searchPromises);
    
    searchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });

    // If no results from API, return mock data
    if (results.length === 0) {
      return generateMockSearchResults(query);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Search error:", error);
    return generateMockSearchResults((await req.json()).query || "");
  }
});

async function searchStocks(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.polygon.io/v3/reference/tickers?search=${query}&market=stocks&active=true&limit=10&apikey=${apiKey}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    for (const ticker of data.results || []) {
      try {
        const quoteResponse = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.ticker}?apikey=${apiKey}`
        );
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          const quote = quoteData.ticker;
          
          results.push({
            symbol: ticker.ticker,
            name: ticker.name || getMarketName(ticker.ticker),
            type: 'stock',
            price: quote?.day?.c || 100,
            change: quote?.todaysChange || 0,
            changePercent: quote?.todaysChangePerc || 0,
            volume: formatVolume(quote?.day?.v || 1000000),
            marketCap: ticker.market_cap ? `${(ticker.market_cap / 1e9).toFixed(1)}B` : undefined
          });
        }
      } catch (error) {
        console.error(`Error fetching quote for ${ticker.ticker}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error("Stock search error:", error);
    return [];
  }
}

async function searchCrypto(query: string, apiKey: string): Promise<SearchResult[]> {
  const cryptoSymbols = [
    'X:BTCUSD', 'X:ETHUSD', 'X:BNBUSD', 'X:XRPUSD', 'X:ADAUSD', 
    'X:SOLUSD', 'X:DOTUSD', 'X:MATICUSD', 'X:AVAXUSD', 'X:LINKUSD'
  ];
  
  const matchingSymbols = cryptoSymbols.filter(symbol => 
    symbol.includes(query) || getMarketName(symbol).toLowerCase().includes(query.toLowerCase())
  );
  
  const results: SearchResult[] = [];
  
  for (const symbol of matchingSymbols.slice(0, 5)) {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers/${symbol}?apikey=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const quote = data.ticker;
        
        results.push({
          symbol: symbol.replace('X:', '').replace('USD', '/USD'),
          name: getMarketName(symbol),
          type: 'crypto',
          price: quote?.day?.c || 30000,
          change: quote?.todaysChange || 0,
          changePercent: quote?.todaysChangePerc || 0,
          volume: formatVolume(quote?.day?.v || 1000000)
        });
      }
    } catch (error) {
      console.error(`Error fetching crypto quote for ${symbol}:`, error);
    }
  }
  
  return results;
}

async function searchForex(query: string, apiKey: string): Promise<SearchResult[]> {
  const forexSymbols = [
    'C:EURUSD', 'C:GBPUSD', 'C:USDJPY', 'C:USDCHF', 
    'C:AUDUSD', 'C:USDCAD', 'C:NZDUSD'
  ];
  
  const matchingSymbols = forexSymbols.filter(symbol => 
    symbol.includes(query) || getMarketName(symbol).toLowerCase().includes(query.toLowerCase())
  );
  
  const results: SearchResult[] = [];
  
  for (const symbol of matchingSymbols.slice(0, 5)) {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers/${symbol}?apikey=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const quote = data.ticker;
        
        results.push({
          symbol: symbol.replace('C:', '').replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2'),
          name: getMarketName(symbol),
          type: 'forex',
          price: quote?.day?.c || 1.1,
          change: quote?.todaysChange || 0,
          changePercent: quote?.todaysChangePerc || 0,
          volume: formatVolume(quote?.day?.v || 1000000)
        });
      }
    } catch (error) {
      console.error(`Error fetching forex quote for ${symbol}:`, error);
    }
  }
  
  return results;
}

function generateMockSearchResults(query: string): Response {
  const mockResults: SearchResult[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      price: 185.25,
      change: 3.45,
      changePercent: 1.89,
      volume: "45.2M",
      marketCap: "2.85T"
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation", 
      type: "stock",
      price: 378.85,
      change: -2.15,
      changePercent: -0.56,
      volume: "23.1M",
      marketCap: "2.81T"
    },
    {
      symbol: "BTC/USD",
      name: "Bitcoin",
      type: "crypto",
      price: 43250.00,
      change: -892.50,
      changePercent: -2.02,
      volume: "1.8B"
    },
    {
      symbol: "EUR/USD",
      name: "Euro / US Dollar",
      type: "forex", 
      price: 1.0856,
      change: 0.0012,
      changePercent: 0.11,
      volume: "2.1B"
    }
  ].filter(result => 
    result.symbol.toLowerCase().includes(query.toLowerCase()) ||
    result.name.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(JSON.stringify({ results: mockResults }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}