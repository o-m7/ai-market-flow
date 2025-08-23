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

export const usePolygonData = (symbols: string[], refreshInterval = 60000) => {
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
        setData(getMockData(symbols));
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      // Fallback to mock data on error
      setData(getMockData(symbols));
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

// Fallback mock data
const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return String(volume);
};

const getMarketName = (symbol: string): string => {
  const map: Record<string, string> = {
    // Stocks
    AAPL: 'Apple Inc.', MSFT: 'Microsoft Corporation', GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.', TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corporation',
    META: 'Meta Platforms Inc.', NFLX: 'Netflix Inc.', DIS: 'The Walt Disney Company',
    BABA: 'Alibaba Group Holding Limited',
    // Crypto currencies
    'BTC/USD': 'Bitcoin', 'ETH/USD': 'Ethereum', 'BNB/USD': 'Binance Coin', 'XRP/USD': 'Ripple',
    'ADA/USD': 'Cardano', 'SOL/USD': 'Solana', 'DOT/USD': 'Polkadot', 'MATIC/USD': 'Polygon',
    'AVAX/USD': 'Avalanche', 'LINK/USD': 'Chainlink', 'UNI/USD': 'Uniswap', 'ATOM/USD': 'Cosmos',
    'ALGO/USD': 'Algorand', 'VET/USD': 'VeChain', 'ICP/USD': 'Internet Computer', 'FIL/USD': 'Filecoin',
    'THETA/USD': 'Theta Network', 'TRX/USD': 'TRON', 'ETC/USD': 'Ethereum Classic', 'XMR/USD': 'Monero',
    'BCH/USD': 'Bitcoin Cash', 'LTC/USD': 'Litecoin', 'DOGE/USD': 'Dogecoin', 'SHIB/USD': 'Shiba Inu',
    'NEAR/USD': 'NEAR Protocol', 'FTM/USD': 'Fantom', 'SAND/USD': 'The Sandbox', 'MANA/USD': 'Decentraland',
    'CRV/USD': 'Curve DAO', 'AAVE/USD': 'Aave',
    // Forex pairs
    'EUR/USD': 'Euro / US Dollar', 'GBP/USD': 'British Pound / US Dollar', 'USD/JPY': 'US Dollar / Japanese Yen',
    'USD/CHF': 'US Dollar / Swiss Franc', 'AUD/USD': 'Australian Dollar / US Dollar', 'USD/CAD': 'US Dollar / Canadian Dollar',
    'NZD/USD': 'New Zealand Dollar / US Dollar', 'EUR/GBP': 'Euro / British Pound', 'EUR/JPY': 'Euro / Japanese Yen',
    'GBP/JPY': 'British Pound / Japanese Yen', 'AUD/JPY': 'Australian Dollar / Japanese Yen', 'EUR/CHF': 'Euro / Swiss Franc',
    'GBP/CHF': 'British Pound / Swiss Franc', 'CHF/JPY': 'Swiss Franc / Japanese Yen', 'CAD/JPY': 'Canadian Dollar / Japanese Yen',
    'EUR/AUD': 'Euro / Australian Dollar', 'GBP/AUD': 'British Pound / Australian Dollar', 'AUD/CHF': 'Australian Dollar / Swiss Franc',
    'NZD/JPY': 'New Zealand Dollar / Japanese Yen', 'EUR/CAD': 'Euro / Canadian Dollar', 'GBP/CAD': 'British Pound / Canadian Dollar',
    'AUD/CAD': 'Australian Dollar / Canadian Dollar', 'EUR/NZD': 'Euro / New Zealand Dollar', 'GBP/NZD': 'British Pound / New Zealand Dollar',
    'USD/SEK': 'US Dollar / Swedish Krona', 'USD/NOK': 'US Dollar / Norwegian Krone', 'USD/DKK': 'US Dollar / Danish Krone',
    'EUR/SEK': 'Euro / Swedish Krona', 'EUR/NOK': 'Euro / Norwegian Krone', 'GBP/SEK': 'British Pound / Swedish Krona',
    // ETFs and Indices
    SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust ETF', DIA: 'SPDR Dow Jones Industrial Average ETF',
    IWM: 'iShares Russell 2000 ETF', VTI: 'Vanguard Total Stock Market ETF', EFA: 'EAFE ETF', EEM: 'Emerging Markets ETF',
    GLD: 'SPDR Gold Shares', SLV: 'iShares Silver Trust', USO: 'United States Oil Fund'
  };
  return map[symbol] || symbol;
};

const getMockData = (symbols?: string[]): MarketSymbol[] => {
  const baseSymbols = symbols && symbols.length > 0
    ? symbols
    : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];

  const sentiments: MarketSymbol['aiSentiment'][] = ['bullish', 'bearish', 'neutral'];

  return baseSymbols.slice(0, 10).map((sym) => {
    const u = sym.toUpperCase();
    let base = 100;
    if (u.includes('BTC')) base = 60000;
    else if (u.includes('ETH')) base = 3000;
    else if (u.includes('USD') && sym.includes('/')) base = 1.1; // forex pair
    else if (u.startsWith('X:')) base = 100; // generic crypto
    else if (u.startsWith('C:')) base = 1.1; // generic forex
    else base = 100 + Math.random() * 900; // stock/etf

    const changePct = (Math.random() - 0.5) * 6; // -3%..+3%
    const prevClose = Number(base.toFixed(2));
    const price = Number((base * (1 + changePct / 100)).toFixed(2));
    const change = Number((price - prevClose).toFixed(2));
    const volumeNum = Math.floor(Math.random() * 50_000_000) + 1_000_000; // 1M - 51M
    const aiSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    return {
      symbol: sym,
      name: getMarketName(sym),
      price,
      change,
      changePercent: Number((((price - prevClose) / Math.max(prevClose, 0.01)) * 100).toFixed(2)),
      volume: formatVolume(volumeNum),
      rsi: Math.floor(30 + Math.random() * 40),
      aiSentiment,
      aiSummary:
        aiSentiment === 'bullish'
          ? 'Positive momentum building. Watch resistance levels.'
          : aiSentiment === 'bearish'
          ? 'Weakness emerging; watch support levels.'
          : 'Range-bound; awaiting catalyst.'
    };
  });
};