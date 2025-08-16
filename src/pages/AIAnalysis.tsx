import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import TechnicalChart from "@/components/TechnicalChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collectBarsForAnalysis, type LWBar } from "@/features/ai/collectBars";
import { analyzeWithAI } from "@/features/ai/analyze";
import { AiResult } from "@/features/ai/Result";

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

const POPULAR_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'USDJPY'
];

export const AIAnalysis = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<'1'|'5'|'15'|'30'|'60'|'240'|'D'>("60");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [chartData, setChartData] = useState<LWBar[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();

  const getMarketType = (symbol: string): 'STOCK' | 'CRYPTO' | 'FOREX' => {
    if (symbol.includes('USD') && symbol !== 'USDJPY') return 'CRYPTO';
    if (['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'].includes(symbol)) return 'FOREX';
    return 'STOCK';
  };

  const handleAnalysis = async () => {
    setLoading(true);
    setAiError(null);
    
    try {
      if (!Array.isArray(chartData) || chartData.length < 20) {
        throw new Error('Need at least 20 candles for analysis. Please wait for chart to load more data.');
      }

      // Collect visible candles from the chart
      const candles = collectBarsForAnalysis(chartData, 400);
      console.log(`Analyzing ${symbol} with ${candles.length} candles`);

      // Determine market type and map timeframe
      const market = getMarketType(symbol);
      const timeframeMap: Record<string, string> = {
        '1': '1m', '5': '5m', '15': '15m', '30': '30m', 
        '60': '1h', '240': '4h', 'D': '1d'
      };

      const result = await analyzeWithAI({
        symbol: symbol.toUpperCase(),
        timeframe: timeframeMap[timeframe] || timeframe,
        market,
        candles
      });

      setAnalysis(result);
      toast({
        title: 'Analysis Complete',
        description: `AI analyzed ${candles.length} candles for ${symbol.toUpperCase()} with ${result.confidence}% confidence`,
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      setAiError(error.message);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Unable to analyze chart data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChartDataChange = (data: LWBar[]) => {
    setChartData(data);
    // Clear previous analysis when chart data changes
    setAnalysis(null);
    setAiError(null);
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
      
      <div className="container mx-auto px-4 py-8 analysis-container">
        {/* Header with Symbol Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                AI Technical Analysis
              </h1>
              <p className="text-muted-foreground">
                Real-time technical analysis with indicators and AI insights
              </p>
            </div>
            
            {/* Symbol Selector */}
            <div className="flex items-center gap-4">
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Symbol" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_SYMBOLS.map((sym) => (
                    <SelectItem key={sym} value={sym}>
                      {sym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Min</SelectItem>
                  <SelectItem value="5">5 Min</SelectItem>
                  <SelectItem value="15">15 Min</SelectItem>
                  <SelectItem value="30">30 Min</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                  <SelectItem value="240">4 Hours</SelectItem>
                  <SelectItem value="D">1 Day</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleAnalysis} 
                disabled={loading || chartData.length < 20}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Analysis ({chartData.length} bars)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Chart Section - Full Width */}
          <div className="w-full">
            <TechnicalChart 
              symbol={symbol}
              tf={timeframe}
              height={600}
              theme="light"
              live
              onDataChange={handleChartDataChange}
            />
          </div>
        </div>

        {/* AI Analysis Results */}
        {analysis && (
          <div className="mt-8">
            <AiResult data={analysis} />
          </div>
        )}

        {/* Error Display */}
        {aiError && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Analysis Error</span>
              </div>
              <p className="text-sm text-red-700 mt-2">{aiError}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Analyzing {chartData.length} candles for {symbol.toUpperCase()}...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!analysis && !loading && !aiError && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center max-w-md">
                Professional AI technical analysis using live chart data. Select a symbol and timeframe above, 
                then click "AI Analysis" to get structured analysis with trade ideas.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                📊 {chartData.length} candles loaded • Powered by GPT-4o-mini
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};