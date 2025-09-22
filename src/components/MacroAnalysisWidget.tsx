import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Globe, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MacroAnalysis {
  market_regime: 'risk_on' | 'risk_off' | 'mixed' | 'transitional';
  overall_sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  volatility_environment: 'high' | 'medium' | 'low';
  key_themes: string[];
  trading_implications: {
    equity_outlook: 'bullish' | 'bearish' | 'neutral';
    crypto_outlook: 'bullish' | 'bearish' | 'neutral';
    forex_outlook: 'dollar_strength' | 'dollar_weakness' | 'mixed';
    recommended_positioning: 'aggressive' | 'defensive' | 'balanced';
  };
  macro_summary: string;
}

export const MacroAnalysisWidget = () => {
  const [analysis, setAnalysis] = useState<MacroAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMacroAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('macro-market-analysis');
      
      if (error) throw error;
      
      setAnalysis(data.macro_analysis);
    } catch (error: any) {
      console.error('Failed to fetch macro analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to fetch macro market analysis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMacroAnalysis();
  }, []);

  const getRegimeBadgeVariant = (regime: string) => {
    switch (regime) {
      case 'risk_on': return 'default';
      case 'risk_off': return 'destructive';
      case 'mixed': return 'secondary';
      case 'transitional': return 'outline';
      default: return 'secondary';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      case 'neutral': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Macro Analysis</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMacroAnalysis}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Real-time macro market regime and sentiment analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading && !analysis ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : analysis ? (
          <>
            {/* Market Regime & Sentiment */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">Market Regime</div>
                <Badge variant={getRegimeBadgeVariant(analysis.market_regime)}>
                  {analysis.market_regime.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium mb-1">Sentiment</div>
                <div className={`flex items-center gap-1 ${getSentimentColor(analysis.overall_sentiment)}`}>
                  {analysis.overall_sentiment === 'bullish' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : analysis.overall_sentiment === 'bearish' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-current" />
                  )}
                  <span className="font-semibold">{analysis.overall_sentiment.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Confidence & Volatility */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Confidence</div>
                <div className="font-semibold">{(analysis.confidence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Volatility</div>
                <Badge variant="outline" className="text-xs">
                  {analysis.volatility_environment.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Key Themes */}
            <div>
              <div className="text-sm font-medium mb-2">Key Themes</div>
              <div className="flex flex-wrap gap-1">
                {analysis.key_themes.slice(0, 3).map((theme, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Trading Implications */}
            <div>
              <div className="text-sm font-medium mb-2">Market Outlook</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Equities</div>
                  <Badge variant="outline" className={getSentimentColor(analysis.trading_implications.equity_outlook)}>
                    {analysis.trading_implications.equity_outlook}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Crypto</div>
                  <Badge variant="outline" className={getSentimentColor(analysis.trading_implications.crypto_outlook)}>
                    {analysis.trading_implications.crypto_outlook}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Positioning</div>
                  <Badge variant="outline">
                    {analysis.trading_implications.recommended_positioning}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground line-clamp-3">
                {analysis.macro_summary}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Unable to load macro analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};