import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw } from 'lucide-react';

interface MarketDataPanelProps {
  symbol: string;
}

interface MarketStats {
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap?: string;
  high24h: number;
  low24h: number;
  openPrice: number;
}

export const MarketDataPanel = ({ symbol }: MarketDataPanelProps) => {
  const [marketData, setMarketData] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchMarketData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('polygon-market-data', {
        body: { symbols: [symbol] }
      });

      if (error) {
        throw new Error(error.message);
      }

      const symbolData = data.data?.[0];
      
      if (symbolData) {
        setMarketData({
          currentPrice: symbolData.price,
          change: symbolData.change,
          changePercent: symbolData.changePercent,
          volume: symbolData.volume,
          high24h: symbolData.price,
          low24h: symbolData.price,
          openPrice: symbolData.price - symbolData.change,
        });
        setLastUpdated(new Date().toLocaleTimeString());
        } else {
          setMarketData(null);
        }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

// Removed mock data generation

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 10 seconds for real-time data
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (!marketData) return null;

  const isPositive = marketData.change >= 0;

  return (
    <Card className="w-full bg-gradient-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Market Data
          </CardTitle>
          <Button 
            onClick={fetchMarketData}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="text-center py-4 border-b border-border/50">
          <div className="text-3xl font-bold mb-2">
            ${marketData.currentPrice.toFixed(2)}
          </div>
          <div className={`flex items-center justify-center gap-1 ${
            isPositive ? 'text-bull' : 'text-bear'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-medium">
              {isPositive ? '+' : ''}{marketData.change.toFixed(2)} 
              ({isPositive ? '+' : ''}{marketData.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Open</div>
            <div className="font-semibold">${marketData.openPrice.toFixed(2)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Volume</div>
            <div className="font-semibold">{marketData.volume}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">24h High</div>
            <div className="font-semibold text-bull">${marketData.high24h.toFixed(2)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">24h Low</div>
            <div className="font-semibold text-bear">${marketData.low24h.toFixed(2)}</div>
          </div>
          
          {marketData.marketCap && (
            <>
              <div className="space-y-1 col-span-2">
                <div className="text-sm text-muted-foreground">Market Cap</div>
                <div className="font-semibold text-primary">${marketData.marketCap}</div>
              </div>
            </>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
              {isPositive ? 'Bullish' : 'Bearish'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Updated: {lastUpdated}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};