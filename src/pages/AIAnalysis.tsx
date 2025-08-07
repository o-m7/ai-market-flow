import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  symbol: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  price_target: number;
  current_price: number;
  technical_indicators: {
    rsi: number;
    macd: string;
    bollinger_bands: string;
    moving_averages: string;
  };
  analysis_summary: string;
  risk_factors: string[];
  key_levels: {
    support: number;
    resistance: number;
  };
}

export const AIAnalysis = () => {
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1D");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!symbol) {
      toast({
        title: "Error",
        description: "Please enter a stock symbol",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-analysis', {
        body: { symbol: symbol.toUpperCase(), timeframe }
      });

      if (error) throw error;
      
      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `AI analysis for ${symbol.toUpperCase()} has been generated`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to generate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'bg-bull text-bull-foreground';
      case 'sell': return 'bg-bear text-bear-foreground';
      default: return 'bg-neutral text-neutral-foreground';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return <TrendingUp className="h-4 w-4" />;
      case 'sell': return <TrendingDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Stock Analysis
          </h1>
          <p className="text-muted-foreground">
            Get comprehensive technical analysis powered by artificial intelligence
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Analysis Input */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Stock Analysis</CardTitle>
              <CardDescription>
                Enter a stock symbol to get AI-powered technical analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL, MSFT, TSLA"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1D">1 Day</SelectItem>
                    <SelectItem value="1W">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                    <SelectItem value="3M">3 Months</SelectItem>
                    <SelectItem value="1Y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAnalysis} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Analyzing...' : 'Analyze Stock'}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {analysis ? (
              <>
                {/* Recommendation Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{analysis.symbol} Analysis</span>
                      <Badge className={getRecommendationColor(analysis.recommendation)}>
                        {getRecommendationIcon(analysis.recommendation)}
                        <span className="ml-1 capitalize">{analysis.recommendation}</span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-lg font-semibold">${analysis.current_price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price Target</p>
                        <p className="text-lg font-semibold">${analysis.price_target}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{analysis.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Potential</p>
                        <p className="text-lg font-semibold">
                          {((analysis.price_target - analysis.current_price) / analysis.current_price * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{analysis.analysis_summary}</p>
                  </CardContent>
                </Card>

                {/* Technical Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>RSI</Label>
                        <p className="text-lg font-semibold">{analysis.technical_indicators.rsi}</p>
                      </div>
                      <div>
                        <Label>MACD</Label>
                        <p className="text-lg font-semibold">{analysis.technical_indicators.macd}</p>
                      </div>
                      <div>
                        <Label>Bollinger Bands</Label>
                        <p className="text-lg font-semibold">{analysis.technical_indicators.bollinger_bands}</p>
                      </div>
                      <div>
                        <Label>Moving Averages</Label>
                        <p className="text-lg font-semibold">{analysis.technical_indicators.moving_averages}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Levels & Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Support:</span>
                          <span className="font-semibold">${analysis.key_levels.support}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resistance:</span>
                          <span className="font-semibold">${analysis.key_levels.resistance}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {analysis.risk_factors.map((risk, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Enter a stock symbol and click "Analyze Stock" to get AI-powered technical analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};