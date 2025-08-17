import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import TechnicalChart from "@/components/TechnicalChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type LWBar } from "@/features/ai/collectBars";
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
  // Major Stocks
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'CRM',
  'UBER', 'SHOP', 'SQ', 'PYPL', 'COIN', 'RBLX', 'SNOW', 'PLTR', 'ARKK', 'SPY',
  
  // Major Crypto
  'BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOGEUSD', 'LTCUSD', 'XRPUSD', 
  'AVAXUSD', 'MATICUSD', 'DOTUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'ALGOUSD',
  
  // Major Forex Pairs
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY'
];

const SYMBOL_CATEGORIES = {
  'Stocks': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'CRM', 'UBER', 'SHOP', 'SQ', 'PYPL', 'COIN', 'RBLX', 'SNOW', 'PLTR', 'ARKK', 'SPY'],
  'Crypto': ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'DOGEUSD', 'LTCUSD', 'XRPUSD', 'AVAXUSD', 'MATICUSD', 'DOTUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'ALGOUSD'],
  'Forex': ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY']
};

const getAssetType = (symbol: string): 'STOCK' | 'CRYPTO' | 'FOREX' => {
  symbol = symbol.toUpperCase();
  
  // Crypto patterns
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('ADA') || 
      symbol.includes('SOL') || symbol.includes('DOGE') || symbol.includes('LTC') ||
      symbol.includes('XRP') || symbol.includes('AVAX') || symbol.includes('MATIC') ||
      symbol.includes('DOT') || symbol.includes('LINK') || symbol.includes('UNI') ||
      symbol.includes('ATOM') || symbol.includes('ALGO') ||
      (symbol.includes('USD') && symbol.length <= 6 && symbol !== 'USDJPY')) {
    return 'CRYPTO';
  }
  
  // Forex patterns  
  if (['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY'].includes(symbol)) {
    return 'FOREX';
  }
  
  // Default to stock
  return 'STOCK';
};

export const AIAnalysis = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<'1'|'5'|'15'|'30'|'60'|'240'|'D'>("60");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [chartData, setChartData] = useState<LWBar[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    console.log('Generate Analysis button clicked');
    console.log('Chart data length:', chartData.length);
    console.log('Symbol:', symbol);
    console.log('Timeframe:', timeframe);
    
    setLoading(true);
    setAiError(null);
    
    try {
      // Always proceed with analysis - use screenshot + any available data
      console.log('Starting comprehensive analysis...');
      
      // Take chart screenshot - capture the entire chart area
      let snapshotBase64: string | null = null;
      try {
        console.log('Capturing chart screenshot...');
        const chartContainer = document.querySelector('.tradingview-chart-container') as HTMLElement;
        if (chartContainer) {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(chartContainer, {
            allowTaint: true,
            useCORS: true,
            scale: 0.8,
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
          });
          snapshotBase64 = canvas.toDataURL("image/webp", 0.8);
          console.log('Chart screenshot captured successfully');
        } else {
          console.warn('Chart container not found for screenshot');
        }
      } catch (error) {
        console.warn('Screenshot capture failed, proceeding without:', error);
      }

      // Use available chart data (from Polygon) - even if minimal
      const ohlcv = chartData.length > 0 ? chartData.slice(-100).map(bar => ({
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume || 0
      })) : [];

      console.log(`Sending analysis request with ${ohlcv.length} bars and ${snapshotBase64 ? 'screenshot' : 'no screenshot'}`);
      
      if (ohlcv.length > 0) {
        console.log('Chart data sample (last 3 bars):', ohlcv.slice(-3));
        console.log('Current price from chart data:', ohlcv[ohlcv.length - 1]?.close);
        console.log('Data timestamps (first/last):', {
          first: ohlcv[0] ? new Date(ohlcv[0].time * 1000).toISOString() : 'N/A',
          last: ohlcv[ohlcv.length - 1] ? new Date(ohlcv[ohlcv.length - 1].time * 1000).toISOString() : 'N/A'
        });
      }

      // Map timeframe for display
      const timeframeMap: Record<string, string> = {
        '1': '1m', '5': '5m', '15': '15m', '30': '30m', 
        '60': '1h', '240': '4h', 'D': '1d'
      };

      const requestBody = {
        symbol: symbol.toUpperCase(),
        timeframe: timeframeMap[timeframe] || timeframe,
        analysisType: 'comprehensive',
        pageScreenshot: snapshotBase64,
        chartData: ohlcv
      };

      console.log('Sending request to AI analysis API...');

      // Call ai-chart-analysis function
      const response = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/ai-chart-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZXRvZmtoeWJseWlqZ2h1d3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTIyNTEsImV4cCI6MjA2OTgyODI1MX0.nOzUHck9fqOxvOHPOY8FE2YzmVAX1cohmb64wS9J5MQ`,
        },
        body: JSON.stringify(requestBody)
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Analysis result:', data.result);
      setAnalysis(data.result);
      toast({
        title: 'Analysis Complete',
        description: `AI analyzed ${symbol.toUpperCase()} with ${snapshotBase64 ? 'visual chart and' : ''} ${ohlcv.length} data points`,
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      // Create fallback analysis
      const fallback = {
        analysis: `Analysis failed: ${error?.message || 'Unknown error'}. Please try again.`,
        recommendation: 'hold',
        confidence: 0,
        keyLevels: { support: [], resistance: [] },
        technicalIndicators: { rsi: 50, trend: 'neutral' as const, momentum: 'neutral' as const },
        chartPatterns: [] as string[],
        priceTargets: { bullish: 0, bearish: 0 },
        riskAssessment: { level: 'medium' as const, factors: ['Analysis service error'] },
        timestamp: new Date().toISOString(),
      };
      setAnalysis(fallback);
      setAiError(error.message);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Unable to analyze chart. Please try again.',
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
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getAssetType(symbol) === 'STOCK' ? 'default' : 'secondary'}>
                    {getAssetType(symbol)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Live Market Data
                  </span>
                </div>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Symbol" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <div className="p-2">
                      <div className="font-semibold text-sm mb-2 text-green-600">📈 Stocks</div>
                      {SYMBOL_CATEGORIES.Stocks.map((sym) => (
                        <SelectItem key={sym} value={sym} className="pl-4">
                          {sym}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm mb-2 text-orange-600">₿ Crypto</div>
                      {SYMBOL_CATEGORIES.Crypto.map((sym) => (
                        <SelectItem key={sym} value={sym} className="pl-4">
                          {sym}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm mb-2 text-blue-600">💱 Forex</div>
                      {SYMBOL_CATEGORIES.Forex.map((sym) => (
                        <SelectItem key={sym} value={sym} className="pl-4">
                          {sym}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
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
                disabled={loading}
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
                      Generate Analysis ({chartData.length} bars)
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
                Professional AI technical analysis using live chart data and visual analysis. Select a symbol and timeframe above, 
                then click "Generate Analysis" to get comprehensive analysis with trade ideas.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                📊 {chartData.length} candles loaded • 📸 Chart snapshot • Powered by GPT-4
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};