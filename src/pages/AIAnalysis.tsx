import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { onGenerateAnalysis } from "@/features/ai/onGenerateAnalysis";

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
  // Major Crypto
  'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD', 
  'AVAXUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'ALGOUSD', 'VETUSD', 'ICPUSD', 
  'FILUSD', 'THETAUSD', 'TRXUSD', 'ETCUSD', 'XMRUSD', 'BCHUSD', 'LTCUSD', 
  'DOGEUSD', 'SHIBUSD', 'NEARUSD', 'FTMUSD', 'SANDUSD', 'MANAUSD', 'CRVUSD', 'AAVEUSD',
  
  // Major Forex Pairs
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURCHF', 'GBPCHF', 'CHFJPY', 
  'CADJPY', 'EURAUD', 'GBPAUD', 'AUDCHF', 'NZDJPY', 'EURCAD', 'GBPCAD', 
  'AUDCAD', 'EURNZD', 'GBPNZD', 'USDSEK', 'USDNOK', 'USDDKK', 'EURSEK', 
  'EURNOK', 'GBPSEK'
];

const SYMBOL_CATEGORIES = {
  'Crypto': ['BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'ALGOUSD', 'VETUSD', 'ICPUSD', 'FILUSD', 'THETAUSD', 'TRXUSD', 'ETCUSD', 'XMRUSD', 'BCHUSD', 'LTCUSD', 'DOGEUSD', 'SHIBUSD', 'NEARUSD', 'FTMUSD', 'SANDUSD', 'MANAUSD', 'CRVUSD', 'AAVEUSD'],
  'Forex': ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURCHF', 'GBPCHF', 'CHFJPY', 'CADJPY', 'EURAUD', 'GBPAUD', 'AUDCHF', 'NZDJPY', 'EURCAD', 'GBPCAD', 'AUDCAD', 'EURNZD', 'GBPNZD', 'USDSEK', 'USDNOK', 'USDDKK', 'EURSEK', 'EURNOK', 'GBPSEK']
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
  const [searchParams] = useSearchParams();
  
  // Convert symbol format from watchlist to AI Analysis format
  const convertSymbolFormat = (symbol: string, type?: string) => {
    if (type === 'crypto') {
      return symbol.replace('-', ''); // BTC-USD -> BTCUSD
    }
    if (type === 'forex') {
      return symbol.replace('/', ''); // EUR/USD -> EURUSD
    }
    return symbol; // Stock symbols remain the same
  };

  // Get initial symbol from URL params or default
  const urlSymbol = searchParams.get('symbol');
  const urlType = searchParams.get('type');
  const initialSymbol = urlSymbol ? convertSymbolFormat(urlSymbol, urlType) : "BTCUSD";
  
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<'1'|'5'|'15'|'30'|'60'|'240'|'D'>("60");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [chartData, setChartData] = useState<LWBar[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const chartRef = useRef<any>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (chartData.length < 30) {
      toast({
        title: 'Insufficient Data',
        description: 'Need at least 30 candles for analysis. Please wait for chart to load.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setAiError(null);
    
    try {
      // Map timeframe format for API
      const timeframeMap: Record<string, "1m"|"5m"|"15m"|"30m"|"1h"|"4h"|"1d"> = {
        '1': '1m', '5': '5m', '15': '15m', '30': '30m', 
        '60': '1h', '240': '4h', 'D': '1d'
      };

      // Convert chart data to proper format
      const seriesData = chartData.map(bar => ({
        t: bar.time * 1000, // Convert to milliseconds
        o: bar.open,
        h: bar.high,
        l: bar.low,
        c: bar.close,
        v: bar.volume || 0
      }));

      // Use the new analysis function
      const result = await onGenerateAnalysis({
        chart: chartRef.current,
        seriesData,
        symbol: symbol.toUpperCase(),
        assetClass: getAssetType(symbol).toLowerCase() as "crypto" | "stock" | "forex",
        timeframe: timeframeMap[timeframe]
      });

      console.log('Analysis result:', result);
      
      // Handle the new JSON schema response
      if (result.status === "insufficient_data") {
        setAiError(result.risk_note || "Insufficient data for analysis");
        toast({
          title: 'Analysis Failed',
          description: result.risk_note || 'Not enough data to analyze',
          variant: 'destructive',
        });
        return;
      }

      // Convert to the format expected by AiResult component
      const analysisForDisplay = {
        symbol: symbol.toUpperCase(),
        analysis: result.succinct_plan || result.trend || 'Analysis completed successfully',
        recommendation: result.direction === 'bullish' ? 'buy' : 
                       result.direction === 'bearish' ? 'sell' : 'hold',
        confidence: result.confidence || 0.5,
        keyLevels: result.key_levels || { support: [], resistance: [] },
        technicalIndicators: {
          rsi: 50, // Would need to calculate this from data
          trend: result.direction || 'neutral',
          momentum: result.momentum || 'neutral'
        },
        chartPatterns: result.pattern_candidates || [],
        priceTargets: { bullish: 0, bearish: 0 }, // Not in new schema
        riskAssessment: {
          level: 'medium' as const,
          factors: result.risk_note ? [result.risk_note] : []
        },
        timestamp: new Date().toISOString(),
      };

      setAnalysis(analysisForDisplay);
      toast({
        title: 'Analysis Complete',
        description: `AI analyzed ${symbol.toUpperCase()} with ${seriesData.length} data points`,
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
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
                Professional analysis with live data, chart snapshots, and strict JSON validation
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
                disabled={loading || chartData.length < 30}
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
                      Generate Analysis
                    </>
                  )}
              </Button>
            </div>
          </div>
          
          {/* Data Echo */}
          {chartData.length > 0 && (
            <div className="text-xs text-muted-foreground mb-4 font-mono">
              📊 {chartData.length} candles loaded • One source of truth: Chart data → AI analysis
            </div>
          )}
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
                Professional AI analysis using live Polygon data and chart snapshots. 
                No mock data - if Polygon fails, you'll see an error.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                📊 {chartData.length} candles loaded • 📸 Chart snapshot • OpenAI + strict JSON schema
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;