import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Newspaper, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NewsSignal {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  news_impact: 'high' | 'medium' | 'low';
  trading_signal: 'buy' | 'sell' | 'hold';
  key_drivers: string[];
  news_summary: string;
  volatility_expected: 'high' | 'medium' | 'low';
}

export const NewsSignalWidget = () => {
  const [symbol, setSymbol] = useState('BTCUSD');
  const [signal, setSignal] = useState<NewsSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchNewsSignal = async (targetSymbol = symbol) => {
    if (!targetSymbol) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('news-signal-analysis', {
        body: { symbol: targetSymbol, timeframe: '1h' }
      });
      
      if (error) throw error;
      
      setSignal(data.analysis);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to fetch news signal:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to fetch news sentiment analysis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsSignal();
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getImpactVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getSignalVariant = (signal: string) => {
    switch (signal) {
      case 'buy': return 'default';
      case 'sell': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">News Signals</CardTitle>
          </div>
        </div>
        <CardDescription>
          Real-time sentiment analysis from financial news
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Symbol Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter symbol (e.g. BTCUSD)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && fetchNewsSignal()}
          />
          <Button
            onClick={() => fetchNewsSignal()}
            disabled={loading || !symbol}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {loading && !signal ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : signal ? (
          <>
            {/* Main Signal */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getSentimentIcon(signal.sentiment)}
                <div>
                  <div className={`font-semibold ${getSentimentColor(signal.sentiment)}`}>
                    {signal.sentiment.toUpperCase()} SENTIMENT
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(signal.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              </div>
              <Badge variant={getSignalVariant(signal.trading_signal)}>
                {signal.trading_signal.toUpperCase()}
              </Badge>
            </div>

            {/* Impact & Volatility */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">News Impact</div>
                <Badge variant={getImpactVariant(signal.news_impact)}>
                  {signal.news_impact.toUpperCase()}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Expected Volatility</div>
                <Badge variant="outline">
                  {signal.volatility_expected.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Key Drivers */}
            <div>
              <div className="text-sm font-medium mb-2">Key Drivers</div>
              <div className="flex flex-wrap gap-1">
                {signal.key_drivers.slice(0, 3).map((driver, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {driver}
                  </Badge>
                ))}
              </div>
            </div>

            {/* News Summary */}
            <div>
              <div className="text-sm font-medium mb-2">Summary</div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {signal.news_summary}
              </p>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Enter a symbol to analyze news sentiment</p>
            <Button onClick={() => fetchNewsSignal('BTCUSD')} variant="outline" size="sm">
              Try BTCUSD
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};