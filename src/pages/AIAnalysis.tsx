import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TradingChart } from "@/components/TradingChart";
import { MarketDataPanel } from "@/components/MarketDataPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CandlestickData } from 'lightweight-charts';

interface AnalysisResult {
  symbol: string;
  analysis: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  technicalIndicators: {
    rsi: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    momentum: 'strong' | 'weak' | 'neutral';
  };
  chartPatterns: string[];
  priceTargets: {
    bullish: number;
    bearish: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  timestamp: string;
}

export const AIAnalysis = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1day");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const { toast } = useToast();

  const handleChartDataChange = (data: CandlestickData[]) => {
    setChartData(data);
  };

  const handleAnalysis = async () => {
    if (!symbol) {
      toast({
        title: "Error",
        description: "Please enter a stock symbol",
        variant: "destructive",
      });
      return;
    }

    if (chartData.length === 0) {
      toast({
        title: "Error", 
        description: "No chart data available. Please wait for the chart to load.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chart-analysis', {
        body: { 
          symbol: symbol.toUpperCase(), 
          chartData: chartData.map(candle => ({
            time: candle.time as number,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
          })),
          timeframe,
          analysisType: 'comprehensive'
        }
      });

      if (error) throw error;
      
      setAnalysis(data.result);
      toast({
        title: "Analysis Complete",
        description: `AI chart analysis for ${symbol.toUpperCase()} has been generated`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to generate chart analysis. Please try again.",
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
            AI Chart Analysis
          </h1>
          <p className="text-muted-foreground">
            Comprehensive technical analysis powered by AI using live chart data
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Chart and Analysis Input */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart */}
            <TradingChart 
              symbol={symbol}
            />
            
            {/* Analysis Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Chart Analysis Controls
                </CardTitle>
                <CardDescription>
                  Analyze the chart above with AI-powered technical analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <SelectItem value="1min">1 Minute</SelectItem>
                        <SelectItem value="5min">5 Minutes</SelectItem>
                        <SelectItem value="15min">15 Minutes</SelectItem>
                        <SelectItem value="1hour">1 Hour</SelectItem>
                        <SelectItem value="1day">1 Day</SelectItem>
                        <SelectItem value="1week">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleAnalysis} 
                      disabled={loading || chartData.length === 0}
                      className="w-full"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? 'Analyzing Chart...' : 'Analyze Chart'}
                    </Button>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Chart data loaded: {chartData.length} data points ready for analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Market Data Panel */}
          <div className="lg:col-span-1">
            <MarketDataPanel symbol={symbol} />
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-8 space-y-6">
            {/* Main Analysis Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{analysis.symbol} Chart Analysis</span>
                  <Badge className={getRecommendationColor(analysis.recommendation)}>
                    {getRecommendationIcon(analysis.recommendation)}
                    <span className="ml-1 capitalize">{analysis.recommendation}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {analysis.analysis}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Recommendation</p>
                    <p className="text-lg font-semibold capitalize">{analysis.recommendation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-lg font-semibold">{Math.round(analysis.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className="text-lg font-semibold capitalize">{analysis.riskAssessment.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RSI</p>
                    <p className="text-lg font-semibold">{analysis.technicalIndicators.rsi.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Key Levels */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-bull">Support Levels</h4>
                      <div className="space-y-1">
                        {analysis.keyLevels.support.map((level, index) => (
                          <div key={index} className="text-sm bg-bull/10 px-2 py-1 rounded">
                            ${level.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-bear">Resistance Levels</h4>
                      <div className="space-y-1">
                        {analysis.keyLevels.resistance.map((level, index) => (
                          <div key={index} className="text-sm bg-bear/10 px-2 py-1 rounded">
                            ${level.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Price Targets */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Bullish Target</p>
                      <p className="text-lg font-semibold text-bull">
                        ${analysis.priceTargets.bullish.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bearish Target</p>
                      <p className="text-lg font-semibold text-bear">
                        ${analysis.priceTargets.bearish.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Patterns & Risk */}
              <Card>
                <CardHeader>
                  <CardTitle>Patterns & Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.chartPatterns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Chart Patterns</h4>
                        <div className="flex gap-2 flex-wrap">
                          {analysis.chartPatterns.map((pattern, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Risk Factors</h4>
                      <ul className="space-y-1">
                        {analysis.riskAssessment.factors.map((risk, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!analysis && !loading && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Enter a stock symbol above and click "Analyze Chart" to get AI-powered technical analysis
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};