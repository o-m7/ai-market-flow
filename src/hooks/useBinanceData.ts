import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface BinanceDataResponse {
  data: CandleData[];
  source: 'binance' | 'mock';
  symbol: string;
  interval: string;
  error?: string;
}

export const useBinanceData = (symbol: string, interval: string) => {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'binance' | 'mock'>('mock');

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol || !interval) return;
      
      setLoading(true);
      setError(null);

      try {
        const { data: response, error: functionError } = await supabase.functions.invoke('binance-data', {
          body: {
            symbol,
            interval,
            limit: 100
          }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        const binanceResponse = response as BinanceDataResponse;
        setData(binanceResponse.data);
        setSource(binanceResponse.source);
        
        if (binanceResponse.error) {
          setError(binanceResponse.error);
        }

      } catch (err) {
        console.error('Error fetching Binance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        
        // Generate fallback mock data
        setData(generateFallbackData(interval));
        setSource('mock');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Auto-refresh every 30 seconds to capture completed candles
    const refreshInterval = setInterval(() => {
      console.log(`[Auto-refresh] Fetching fresh Binance data for ${symbol}`);
      fetchData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [symbol, interval]);

  return { data, loading, error, source };
};

// Fallback data generator for when API fails
function generateFallbackData(interval: string): CandleData[] {
  const basePrice = 185.25;
  const points = 50;
  
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (i * 0.5) + (Math.random() * 5 - 2.5);
    const volatility = Math.random() * 8 + 2;
    const high = open + (Math.random() * volatility);
    const low = open - (Math.random() * volatility);
    const close = low + (Math.random() * (high - low));
    
    // Generate time based on interval
    const now = new Date();
    let time: string;
    
    if (interval.includes('m')) {
      const minutes = parseInt(interval.replace('m', ''));
      const date = new Date(now.getTime() - (points - i) * minutes * 60 * 1000);
      time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (interval.includes('h')) {
      const hours = parseInt(interval.replace('h', ''));
      const date = new Date(now.getTime() - (points - i) * hours * 60 * 60 * 1000);
      time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        hour12: false 
      }) + ':00';
    } else {
      const date = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
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
      volume: Math.floor(Math.random() * 50) + 20,
      timestamp: now.getTime() - (points - i) * 60000
    };
  });
}