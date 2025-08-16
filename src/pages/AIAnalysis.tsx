import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import TechnicalChart from "@/components/TechnicalChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      // Capture screenshot of the entire analysis page
      const html2canvas = (await import('html2canvas')).default;
      
      // Wait a moment for the page to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capture the main content area
      const element = document.querySelector('.analysis-container') as HTMLElement || document.body;
      const canvas = await html2canvas(element, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true,
        allowTaint: true,
        scale: 1,
        backgroundColor: '#ffffff'
      });

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png', 0.8);
      
      console.log('Screenshot captured, sending to AI for analysis...');

      // Send screenshot to AI for visual analysis
      const analysisResponse = await fetch(`https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/ai-chart-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          symbol: symbol.toUpperCase(), 
          timeframe: timeframe,
          analysisType: 'comprehensive',
          pageScreenshot: imageData
        })
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.text();
        console.error('Analysis error response:', errorData);
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }
      
      const analysisData = await analysisResponse.json();
      console.log('Analysis result:', analysisData);
      
      setAnalysis(analysisData.result || analysisData);
      toast({
        title: "Visual Analysis Complete",
        description: `AI analyzed the entire page and chart for ${symbol.toUpperCase()} (${timeframe})`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to capture page or generate analysis. Please try again.",
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
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Capturing & Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Visual Analysis
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
            />
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-8 space-y-6">
            {/* Main Analysis Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{analysis.symbol} Analysis ({timeframe})</span>
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
              <p className="text-muted-foreground text-center max-w-md">
                Advanced AI visual analysis system ready. Select a symbol and timeframe above, then click "AI Analysis" to capture a screenshot of this entire page and get comprehensive analysis.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                📸 Visual analysis powered by OpenAI GPT-4 Vision
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};