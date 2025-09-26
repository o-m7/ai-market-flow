import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import TechnicalChart from "@/components/TechnicalChart";
import { OrderBookPanel } from "@/components/OrderBookPanel";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3, Search, Settings, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { type LWBar } from "@/features/ai/collectBars";
import { analyzeWithAI, type AnalysisRequest } from "@/features/ai/analyze";

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
  const s = symbol.toUpperCase();

  // Known forex pairs (expanded)
  const FOREX_SET = new Set([
    'EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD',
    'EURGBP','EURJPY','GBPJPY','AUDJPY','EURCHF','GBPCHF','CHFJPY',
    'CADJPY','EURAUD','GBPAUD','AUDCHF','NZDJPY','EURCAD','GBPCAD',
    'AUDCAD','EURNZD','GBPNZD','USDSEK','USDNOK','USDDKK','EURSEK',
    'EURNOK','GBPSEK'
  ]);

  if (FOREX_SET.has(s)) return 'FOREX';

  // Common crypto tickers
  const isCrypto = (
    s.includes('BTC') || s.includes('ETH') || s.includes('BNB') || s.includes('XRP') ||
    s.includes('ADA') || s.includes('SOL') || s.includes('DOT') || s.includes('MATIC') ||
    s.includes('AVAX') || s.includes('LINK') || s.includes('UNI') || s.includes('ATOM') ||
    s.includes('ALGO') || s.includes('VET') || s.includes('ICP') || s.includes('FIL') ||
    s.includes('THETA') || s.includes('TRX') || s.includes('ETC') || s.includes('XMR') ||
    s.includes('BCH') || s.includes('LTC') || s.includes('DOGE') || s.includes('SHIB') ||
    s.includes('NEAR') || s.includes('FTM') || s.includes('SAND') || s.includes('MANA') ||
    s.includes('CRV') || s.includes('AAVE')
  );
  if (isCrypto) return 'CRYPTO';

  return 'STOCK';
};

export const AIAnalysis = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { usage, loading: usageLoading, trackAnalysis, isSubscribed } = useUsageTracking();
  
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
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [includeQuantData, setIncludeQuantData] = useState(true);
  const chartRef = useRef<any>(null);
  const { toast } = useToast();

  // Optional: allow a local OpenAI key for AI analysis (stored in browser)
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [hasLocalKey, setHasLocalKey] = useState<boolean>(false);

  useEffect(() => {
    try {
      const k = window.localStorage?.getItem('OPENAI_API_KEY') || '';
      setOpenaiKey(k);
      setHasLocalKey(!!k);
    } catch {}
  }, []);

  const handleAnalysis = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to use AI analysis features.',
        variant: 'destructive',
      });
      return;
    }

    // Check usage limits for non-subscribed users
    if (!isSubscribed && !usage.canAnalyzeSymbol(symbol)) {
      toast({
        title: 'Usage Limit Reached',
        description: `You've reached your daily limit of 5 analyses. Upgrade to Premium for unlimited access.`,
        variant: 'destructive',
      });
      return;
    }

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
    
    // Show progress feedback
    toast({
      title: "Starting Analysis",
      description: "Processing chart data...",
    });
    
    try {
      // Track usage for non-subscribed users
      if (!isSubscribed) {
        const trackingResult = await trackAnalysis(symbol);
        if (!trackingResult) {
          throw new Error('Failed to track usage');
        }
      }

      // Show next step
      toast({
        title: "Analyzing Market Data",
        description: "Running AI technical analysis...",
      });

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

      // Call Edge Function ai-analyze with OHLCV-only payload
      const payload: AnalysisRequest = {
        symbol: symbol.toUpperCase(),
        timeframe: timeframeMap[timeframe],
        market: getAssetType(symbol),
        candles: seriesData,
      };

      const result = await analyzeWithAI(payload);
      console.log('Analysis result:', result);

      // Convert to the format expected by AiResult component
      const analysisForDisplay = {
        symbol: symbol.toUpperCase(),
        analysis: result.summary || 'Analysis completed successfully',
        recommendation: result.action || 'hold',
        confidence: result.confidence_calibrated || result.confidence_model || 0.5,
        keyLevels: result.levels || { support: [], resistance: [] },
        technicalIndicators: {
          rsi: result.technical?.rsi14 || 50,
          trend: result.outlook || 'neutral',
          momentum: result.technical?.macd?.hist > 0 ? 'strong' : 
                   result.technical?.macd?.hist < 0 ? 'weak' : 'neutral'
        },
        chartPatterns: result.evidence || [],
        priceTargets: { 
          bullish: result.trade_idea?.targets?.[0] || 0, 
          bearish: result.trade_idea?.stop || 0 
        },
        riskAssessment: {
          level: result.confidence_calibrated > 70 ? 'low' : 
                 result.confidence_calibrated > 50 ? 'medium' : 'high',
          factors: result.risks ? [result.risks] : []
        },
        timestamp: new Date().toISOString(),
        // Add new institutional-grade fields
        action_text: result.action_text,
        fibonacci: result.fibonacci,
        trade_idea: result.trade_idea,
        technical: result.technical,
        confidence_model: result.confidence_model,
        confidence_calibrated: result.confidence_calibrated,
        evidence: result.evidence,
        timeframe_profile: result.timeframe_profile,
        quantitative_metrics: result.quantitative_metrics
      };

      setAnalysis(analysisForDisplay);
      toast({
        title: 'Analysis Complete ✅',
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
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Technical Analysis
          </h1>
          <p className="text-muted-foreground">
            Professional market analysis with institutional-grade AI and quantitative metrics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Analysis Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-6 space-y-6">
              {/* Symbol Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Market Symbol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Symbol" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="p-2">
                          <div className="font-semibold text-sm mb-2 text-orange-600">₿ Crypto</div>
                          {SYMBOL_CATEGORIES.Crypto.slice(0, 15).map((sym) => (
                            <SelectItem key={sym} value={sym} className="pl-4">
                              {sym}
                            </SelectItem>
                          ))}
                        </div>
                        <div className="p-2">
                          <div className="font-semibold text-sm mb-2 text-blue-600">💱 Forex</div>
                          {SYMBOL_CATEGORIES.Forex.slice(0, 15).map((sym) => (
                            <SelectItem key={sym} value={sym} className="pl-4">
                              {sym}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <Badge variant={getAssetType(symbol) === 'STOCK' ? 'default' : 'secondary'} className="text-xs">
                      {getAssetType(symbol)} Market
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Minute</SelectItem>
                        <SelectItem value="5">5 Minutes</SelectItem>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="240">4 Hours</SelectItem>
                        <SelectItem value="D">1 Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="quant-data"
                      checked={includeQuantData}
                      onCheckedChange={setIncludeQuantData}
                    />
                    <Label htmlFor="quant-data" className="text-sm">Include Quant Metrics</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleAnalysis} 
                    disabled={loading || chartData.length < 30}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>

                  {chartData.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                      📊 {chartData.length} data points loaded
                    </div>
                  )}

                  {user && !isSubscribed && !usageLoading && (
                    <div className="text-xs text-muted-foreground">
                      {usage.remainingAnalyses}/5 free analyses remaining today
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    AI Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKeySettings(!showKeySettings)}
                    className="w-full"
                  >
                    {hasLocalKey ? '✅ Custom AI Key Set' : 'Set Custom AI Key'}
                  </Button>

                  {showKeySettings && (
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Enter OpenAI API key (sk-...)"
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            try {
                              window.localStorage?.setItem('OPENAI_API_KEY', openaiKey);
                              setHasLocalKey(!!openaiKey);
                              toast({ title: 'AI Key Saved', description: 'Stored locally for analysis.' });
                            } catch {
                              toast({ title: 'Failed to Save', variant: 'destructive' });
                            }
                          }}
                        >
                          Save
                        </Button>
                        {hasLocalKey && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                window.localStorage?.removeItem('OPENAI_API_KEY');
                                setOpenaiKey('');
                                setHasLocalKey(false);
                                toast({ title: 'AI Key Cleared' });
                              } catch {}
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Key stored locally in browser only
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Right Panel - Chart and Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Chart Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Live Chart: {symbol}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOrderBook(!showOrderBook)}
                  >
                    {showOrderBook ? 'Hide' : 'Show'} Order Book
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${showOrderBook ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                  <div className={showOrderBook ? "lg:col-span-2" : "lg:col-span-1"}>
                    <TechnicalChart 
                      symbol={symbol}
                      tf={timeframe}
                      height={500}
                      theme="dark"
                      live
                      onDataChange={handleChartDataChange}
                    />
                  </div>
                  
                  {showOrderBook && (
                    <div className="lg:col-span-1">
                      <OrderBookPanel symbol={symbol} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing {chartData.length} candles for {symbol.toUpperCase()}...
                  </p>
                </CardContent>
              </Card>
            )}

            {aiError && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">Analysis Error</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">{aiError}</p>
                </CardContent>
              </Card>
            )}

            {analysis && <AnalysisResults data={analysis} symbol={symbol} />}

            {!analysis && !loading && !aiError && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Ready for Analysis</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Configure your analysis parameters and click "Run AI Analysis" to get professional technical insights.
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                    <span>Select symbol</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>Choose timeframe</span>
                    <ChevronRight className="h-4 w-4" />
                    <span>Run analysis</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;