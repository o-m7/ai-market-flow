import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketSymbol {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  rsi: number;
  aiSentiment: 'bullish' | 'bearish' | 'neutral';
  aiSummary: string;
}

interface PolygonDataResponse {
  data: MarketSymbol[];
  timestamp: string;
  source: string;
  error?: string;
}

export const usePolygonData = (symbols?: string[], refreshInterval = 60000) => {
  const [data, setData] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      setError(null);
      
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'polygon-market-data',
        {
          body: { symbols }
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      const result = response as PolygonDataResponse;
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data && result.data.length > 0) {
        setData(result.data);
        setLastUpdated(result.timestamp);
      } else {
        // Fallback to mock data if no real data available
        setData(getMockData());
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      // Fallback to mock data on error
      setData(getMockData());
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up refresh interval
    const interval = setInterval(fetchMarketData, refreshInterval);

    return () => clearInterval(interval);
  }, [symbols, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchMarketData
  };
};

// Fallback mock data
const getMockData = (): MarketSymbol[] => [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 185.25,
    change: 3.45,
    changePercent: 1.89,
    volume: "45.2M",
    rsi: 68,
    aiSentiment: "bullish" as const,
    aiSummary: "Strong technical indicators suggest continued upward momentum. Support at $180, resistance at $190.",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 238.50,
    change: 12.75,
    changePercent: 5.65,
    volume: "89.3M",
    rsi: 78,
    aiSentiment: "bullish" as const,
    aiSummary: "Breakout above $230 resistance. Overbought conditions suggest potential consolidation ahead.",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.90,
    change: -2.15,
    changePercent: -0.56,
    volume: "23.8M",
    rsi: 52,
    aiSentiment: "neutral" as const,
    aiSummary: "Consolidating near key support levels. Awaiting catalyst for next directional move.",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.80,
    change: 1.85,
    changePercent: 1.31,
    volume: "31.4M",
    rsi: 61,
    aiSentiment: "bullish" as const,
    aiSummary: "Positive momentum building. Key resistance at $145 to watch for breakout.",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 145.60,
    change: -1.40,
    changePercent: -0.95,
    volume: "42.7M",
    rsi: 45,
    aiSentiment: "neutral" as const,
    aiSummary: "Trading within established range. Support at $140, resistance at $150.",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.30,
    change: 18.90,
    changePercent: 2.21,
    volume: "38.9M",
    rsi: 72,
    aiSentiment: "bullish" as const,
    aiSummary: "AI momentum continues. Watch for profit-taking near $900 resistance level.",
  }
];