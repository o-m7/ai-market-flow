import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface OrderBookPanelProps {
  symbol: string;
}

export const OrderBookPanel = ({ symbol }: OrderBookPanelProps) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const fetchOrderBook = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('kraken-orderbook', {
        body: { 
          symbol: symbol.toUpperCase(),
          depth: 25 
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setOrderBook(data);
    } catch (err: any) {
      console.error('Error fetching order book:', err);
      setError(err.message || 'Failed to fetch order book');
      toast({
        title: 'Order Book Error',
        description: err.message || 'Failed to fetch order book data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
    } else {
      setAutoRefresh(true);
      const interval = setInterval(fetchOrderBook, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [symbol]);

  useEffect(() => {
    // Update interval when symbol changes
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      const interval = setInterval(fetchOrderBook, 5000);
      setRefreshInterval(interval);
    }
  }, [symbol, autoRefresh]);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num > 1000) return num.toFixed(2);
    if (num > 1) return num.toFixed(4);
    return num.toFixed(6);
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num > 1000) return (num / 1000).toFixed(2) + 'K';
    if (num > 1) return num.toFixed(2);
    return num.toFixed(4);
  };

  const getBidTotal = (index: number) => {
    if (!orderBook) return 0;
    return orderBook.bids.slice(0, index + 1).reduce((sum, bid) => sum + parseFloat(bid.volume), 0);
  };

  const getAskTotal = (index: number) => {
    if (!orderBook) return 0;
    return orderBook.asks.slice(0, index + 1).reduce((sum, ask) => sum + parseFloat(ask.volume), 0);
  };

  const getSpread = () => {
    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) return null;
    const bestBid = parseFloat(orderBook.bids[0].price);
    const bestAsk = parseFloat(orderBook.asks[0].price);
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestBid) * 100;
    return { spread, spreadPercent };
  };

  const spreadData = getSpread();

  return (
    <Card className="w-full h-full bg-gradient-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Order Book</CardTitle>
            <Badge variant="outline" className="text-xs">
              {symbol.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchOrderBook}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={toggleAutoRefresh}
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
            >
              {autoRefresh ? 'Stop' : 'Auto'}
            </Button>
          </div>
        </div>
        
        {spreadData && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>Spread: ${spreadData.spread.toFixed(6)}</span>
            </div>
            <div className="text-muted-foreground">
              ({spreadData.spreadPercent.toFixed(4)}%)
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <div className="p-4 text-center">
            <div className="text-sm text-destructive mb-2">{error}</div>
            <Button onClick={fetchOrderBook} size="sm">
              Retry
            </Button>
          </div>
        ) : !orderBook ? (
          <div className="p-4 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Loading order book...</p>
          </div>
        ) : (
          <Tabs defaultValue="book" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-4 mb-4" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="book">Order Book</TabsTrigger>
              <TabsTrigger value="depth">Market Depth</TabsTrigger>
            </TabsList>

            <TabsContent value="book" className="mt-0">
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Asks (Sell Orders) */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingDown className="h-4 w-4 text-bear" />
                      <span className="text-sm font-medium text-bear">Asks (Sell)</span>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {orderBook.asks.slice().reverse().map((ask, index) => (
                          <div
                            key={`ask-${index}`}
                            className="flex justify-between items-center text-xs p-1 rounded hover:bg-muted/30"
                          >
                            <span className="text-bear font-mono">
                              ${formatPrice(ask.price)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatVolume(ask.volume)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Bids (Buy Orders) */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp className="h-4 w-4 text-bull" />
                      <span className="text-sm font-medium text-bull">Bids (Buy)</span>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {orderBook.bids.map((bid, index) => (
                          <div
                            key={`bid-${index}`}
                            className="flex justify-between items-center text-xs p-1 rounded hover:bg-muted/30"
                          >
                            <span className="text-bull font-mono">
                              ${formatPrice(bid.price)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatVolume(bid.volume)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="depth" className="mt-0">
              <div className="px-4">
                <div className="text-xs text-muted-foreground mb-2">
                  Cumulative volume at price levels
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-bear mb-2">Asks (Cumulative)</div>
                    {orderBook.asks.slice(0, 10).map((ask, index) => (
                      <div
                        key={`depth-ask-${index}`}
                        className="flex justify-between items-center text-xs p-1 rounded"
                      >
                        <span className="text-bear font-mono">
                          ${formatPrice(ask.price)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatVolume(getAskTotal(index).toString())}
                        </span>
                      </div>
                    ))}
                    
                    <div className="border-t my-2"></div>
                    
                    <div className="text-xs font-medium text-bull mb-2">Bids (Cumulative)</div>
                    {orderBook.bids.slice(0, 10).map((bid, index) => (
                      <div
                        key={`depth-bid-${index}`}
                        className="flex justify-between items-center text-xs p-1 rounded"
                      >
                        <span className="text-bull font-mono">
                          ${formatPrice(bid.price)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatVolume(getBidTotal(index).toString())}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {orderBook && (
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            Last updated: {new Date(orderBook.timestamp).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};