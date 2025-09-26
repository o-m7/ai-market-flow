import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketSymbol {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  rsi?: number;
  aiSentiment?: 'bullish' | 'bearish' | 'neutral';
  aiSummary?: string;
}

interface PolygonDataResponse {
  data: MarketSymbol[];
  timestamp: string;
  source: string;
  error?: string;
}

export const usePolygonData = (symbols: string[], refreshInterval = 3000) => {
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

      if (result.data) {
        // Merge new data with existing data to prevent symbols from disappearing
        setData(prevData => {
          const newDataMap = new Map(result.data.map(item => [item.symbol, item]));
          const mergedData = prevData.map(existingItem => 
            newDataMap.get(existingItem.symbol) || existingItem
          );
          
          // Add any completely new symbols
          result.data.forEach(newItem => {
            if (!prevData.some(existing => existing.symbol === newItem.symbol)) {
              mergedData.push(newItem);
            }
          });
          
          return mergedData;
        });
        setLastUpdated(result.timestamp);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      setData([]);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbols && symbols.length > 0) {
      // Initial fetch
      fetchMarketData();

      // Set up refresh interval
      const interval = setInterval(fetchMarketData, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [symbols?.join(','), refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchMarketData
  };
};

// Removed mock data