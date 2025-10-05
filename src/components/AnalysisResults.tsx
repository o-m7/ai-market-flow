import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, AlertTriangle, Clock, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AnalysisResultsProps {
  data: any;
  symbol: string;
}

export const AnalysisResults = ({ data, symbol }: AnalysisResultsProps) => {
  // Log the data structure for debugging
  console.log('AnalysisResults data:', data);
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'sell': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Extract analysis text - check multiple possible fields
  const analysisText = data.analysis || data.action_text || data.summary || 'No analysis available';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header Card - Action & Confidence */}
      <Card className="bg-terminal border-terminal-border">
        <CardHeader className="bg-terminal-darker border-b border-terminal-border">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-mono-tabular text-terminal-accent">
                <Brain className="h-5 w-5" />
                {data.symbol} • AI ANALYSIS
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono-tabular text-terminal-secondary">
                <Clock className="h-3 w-3" />
                {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${getRecommendationColor(data.recommendation)} font-mono-tabular text-sm mb-2`}>
                {data.recommendation?.toUpperCase() || 'HOLD'}
              </Badge>
              <div className="text-xs font-mono-tabular text-terminal-secondary">
                CONFIDENCE: {Math.round((data.confidence_calibrated || data.confidence || 50) * 100)}%
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Analysis Summary */}
      <Card className="bg-terminal border-terminal-border">
        <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
          <CardTitle className="text-sm font-mono-tabular text-terminal-accent">ANALYSIS SUMMARY</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="leading-relaxed font-mono text-sm text-terminal-foreground whitespace-pre-wrap">{analysisText}</p>
        </CardContent>
      </Card>

      {/* Main Signal - Detailed Recommendation */}
      <Card className="bg-terminal border-terminal-border">
        <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
          <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
            <Target className="h-4 w-4" />
            MAIN SIGNAL & REASONING
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono-tabular text-terminal-secondary">SIGNAL STRENGTH</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-terminal-darker rounded-full overflow-hidden border border-terminal-border/50">
                  <div 
                    className={`h-full ${
                      (data.confidence_calibrated || data.confidence || 0.5) > 0.7 ? 'bg-terminal-green' :
                      (data.confidence_calibrated || data.confidence || 0.5) > 0.5 ? 'bg-terminal-accent' :
                      'bg-terminal-red'
                    }`}
                    style={{ width: `${((data.confidence_calibrated || data.confidence || 0.5) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono-tabular text-terminal-accent">
                  {Math.round((data.confidence_calibrated || data.confidence || 0.5) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono-tabular text-terminal-secondary min-w-24">ACTION:</span>
                <span className="text-sm font-mono-tabular text-terminal-foreground uppercase font-bold">
                  {data.recommendation || 'HOLD'}
                </span>
              </div>
              
              {data.action_text && (
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono-tabular text-terminal-secondary min-w-24">REASONING:</span>
                  <span className="text-sm font-mono text-terminal-foreground flex-1">
                    {data.action_text}
                  </span>
                </div>
              )}
              
              {data.outlook && (
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono-tabular text-terminal-secondary min-w-24">OUTLOOK:</span>
                  <span className="text-sm font-mono-tabular text-terminal-accent uppercase">
                    {data.outlook}
                  </span>
                </div>
              )}

              {data.timeframe_profile?.trend && (
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono-tabular text-terminal-secondary min-w-24">TREND:</span>
                  <span className={`text-sm font-mono-tabular uppercase ${
                    data.timeframe_profile.trend === 'bullish' ? 'text-terminal-green' :
                    data.timeframe_profile.trend === 'bearish' ? 'text-terminal-red' :
                    'text-terminal-accent'
                  }`}>
                    {data.timeframe_profile.trend}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Technical Indicators Grid */}
      {data.technical && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Activity className="h-4 w-4" />
              COMPREHENSIVE TECHNICAL INDICATORS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Oscillators */}
            <div className="mb-6">
              <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-terminal-border/50" />
                <span>OSCILLATORS & MOMENTUM</span>
                <div className="h-px flex-1 bg-terminal-border/50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.technical.rsi14 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">RSI (14)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.rsi14.toFixed(1)}
                    </div>
                    <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                      {data.technical.rsi14 > 70 ? 'Overbought' : data.technical.rsi14 < 30 ? 'Oversold' : 'Neutral'}
                    </div>
                  </div>
                )}
                {data.technical.stoch_k !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOCH %K</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.stoch_k.toFixed(1)}
                    </div>
                  </div>
                )}
                {data.technical.stoch_d !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOCH %D</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.stoch_d.toFixed(1)}
                    </div>
                  </div>
                )}
                {data.technical.macd?.hist !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MACD HIST</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.macd.hist > 0 ? '+' : ''}{data.technical.macd.hist.toFixed(4)}
                    </div>
                    <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                      {data.technical.macd.hist > 0 ? 'Bullish' : 'Bearish'}
                    </div>
                  </div>
                )}
                {data.technical.macd?.line !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MACD LINE</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.macd.line.toFixed(4)}
                    </div>
                  </div>
                )}
                {data.technical.macd?.signal !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MACD SIGNAL</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.macd.signal.toFixed(4)}
                    </div>
                  </div>
                )}
                {data.technical.cci !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">CCI (20)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.cci.toFixed(1)}
                    </div>
                  </div>
                )}
                {data.technical.adx !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ADX (14)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.adx.toFixed(1)}
                    </div>
                    <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                      {data.technical.adx > 25 ? 'Strong Trend' : 'Weak Trend'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Moving Averages */}
            <div className="mb-6">
              <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-terminal-border/50" />
                <span>MOVING AVERAGES</span>
                <div className="h-px flex-1 bg-terminal-border/50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.technical.sma20 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SMA 20</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.sma20.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.sma50 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SMA 50</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.sma50.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.sma200 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SMA 200</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.sma200.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.ema9 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 9</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.ema9.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.ema20 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 20</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.ema20.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.ema50 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 50</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.ema50.toFixed(2)}
                    </div>
                  </div>
                )}
                {data.technical.vwma !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VWMA</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.vwma.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Volatility & Volume */}
            <div>
              <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-terminal-border/50" />
                <span>VOLATILITY & VOLUME</span>
                <div className="h-px flex-1 bg-terminal-border/50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.technical.atr14 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ATR (14)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.atr14.toFixed(4)}
                    </div>
                  </div>
                )}
                {data.technical.bb?.upper !== undefined && (
                  <>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB UPPER</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {data.technical.bb.upper.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB MIDDLE</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {data.technical.bb.mid.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB LOWER</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {data.technical.bb.lower.toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
                {data.technical.volume_analysis?.obv !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">OBV</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {(data.technical.volume_analysis.obv / 1000000).toFixed(2)}M
                    </div>
                  </div>
                )}
                {data.technical.volume_sma20 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VOL SMA 20</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {(data.technical.volume_sma20 / 1000000).toFixed(2)}M
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Idea */}
      {data.trade_idea && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Target className="h-4 w-4" />
              TRADE IDEA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                <div className="text-lg font-mono-tabular text-terminal-green">
                  {data.trade_idea.entry?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                <div className="text-lg font-mono-tabular text-terminal-red">
                  {data.trade_idea.stop?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TARGET 1</div>
                <div className="text-lg font-mono-tabular text-terminal-accent">
                  {data.trade_idea.targets?.[0]?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">RISK/REWARD</div>
                <div className="text-lg font-mono-tabular text-terminal-accent">
                  {data.trade_idea.risk_reward?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Levels */}
      {data.keyLevels && (data.keyLevels.support?.length > 0 || data.keyLevels.resistance?.length > 0) && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">KEY LEVELS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-terminal-green" />
                  <div className="text-xs font-mono-tabular text-terminal-secondary">SUPPORT LEVELS</div>
                </div>
                <div className="space-y-2">
                  {data.keyLevels.support?.map((level: number, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-terminal-darker/50 p-2 border border-terminal-border/30">
                      <span className="text-xs font-mono-tabular text-terminal-secondary">S{idx + 1}</span>
                      <span className="text-sm font-mono-tabular text-terminal-green">{level.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-terminal-red" />
                  <div className="text-xs font-mono-tabular text-terminal-secondary">RESISTANCE LEVELS</div>
                </div>
                <div className="space-y-2">
                  {data.keyLevels.resistance?.map((level: number, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-terminal-darker/50 p-2 border border-terminal-border/30">
                      <span className="text-xs font-mono-tabular text-terminal-secondary">R{idx + 1}</span>
                      <span className="text-sm font-mono-tabular text-terminal-red">{level.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence & Signals - Comprehensive */}
      {data.evidence && Array.isArray(data.evidence) && data.evidence.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">COMPREHENSIVE SIGNALS & EVIDENCE</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2">
              {data.evidence.map((item: string, idx: number) => {
                // Determine signal type based on content
                const isBullish = item.toLowerCase().includes('bull') || item.toLowerCase().includes('buy') || item.toLowerCase().includes('support');
                const isBearish = item.toLowerCase().includes('bear') || item.toLowerCase().includes('sell') || item.toLowerCase().includes('resistance');
                
                return (
                  <div key={idx} className={`flex items-start gap-3 p-3 border-l-2 ${
                    isBullish ? 'bg-terminal-green/5 border-terminal-green' :
                    isBearish ? 'bg-terminal-red/5 border-terminal-red' :
                    'bg-terminal-darker/30 border-terminal-accent'
                  }`}>
                    <div className={`text-sm font-mono-tabular mt-0.5 font-bold ${
                      isBullish ? 'text-terminal-green' :
                      isBearish ? 'text-terminal-red' :
                      'text-terminal-accent'
                    }`}>
                      {idx + 1}.
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-mono text-terminal-foreground">{item}</div>
                    </div>
                    {isBullish && (
                      <Badge className="bg-terminal-green/20 text-terminal-green text-xs">BULLISH</Badge>
                    )}
                    {isBearish && (
                      <Badge className="bg-terminal-red/20 text-terminal-red text-xs">BEARISH</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Patterns - Alternative to evidence */}
      {(!data.evidence || data.evidence.length === 0) && data.chartPatterns && Array.isArray(data.chartPatterns) && data.chartPatterns.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">CHART PATTERNS & SIGNALS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2">
              {data.chartPatterns.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-terminal-darker/30 border-l-2 border-terminal-accent">
                  <div className="text-sm font-mono-tabular text-terminal-accent mt-0.5 font-bold">{idx + 1}.</div>
                  <div className="text-sm font-mono text-terminal-foreground flex-1">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantitative Metrics */}
      {data.quantitative_metrics && Object.keys(data.quantitative_metrics).length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">QUANTITATIVE METRICS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data.quantitative_metrics).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-lg font-mono-tabular text-terminal-foreground">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fibonacci Levels */}
      {data.fibonacci && (data.fibonacci.retracement || data.fibonacci.extension) && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">FIBONACCI LEVELS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.fibonacci.retracement && (
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-3">RETRACEMENT</div>
                  <div className="space-y-2">
                    {Object.entries(data.fibonacci.retracement).map(([level, price]: [string, any]) => (
                      <div key={level} className="flex justify-between items-center bg-terminal-darker/50 p-2 border border-terminal-border/30">
                        <span className="text-xs font-mono-tabular text-terminal-secondary">{level}</span>
                        <span className="text-sm font-mono-tabular text-terminal-accent">{Number(price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.fibonacci.extension && (
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-3">EXTENSION</div>
                  <div className="space-y-2">
                    {Object.entries(data.fibonacci.extension).map(([level, price]: [string, any]) => (
                      <div key={level} className="flex justify-between items-center bg-terminal-darker/50 p-2 border border-terminal-border/30">
                        <span className="text-xs font-mono-tabular text-terminal-secondary">{level}</span>
                        <span className="text-sm font-mono-tabular text-terminal-accent">{Number(price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {data.riskAssessment && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              RISK ASSESSMENT
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-tabular text-terminal-secondary">RISK LEVEL</span>
                <Badge className={
                  data.riskAssessment.level === 'low' ? 'bg-terminal-green/20 text-terminal-green' :
                  data.riskAssessment.level === 'medium' ? 'bg-terminal-accent/20 text-terminal-accent' :
                  'bg-terminal-red/20 text-terminal-red'
                }>
                  {data.riskAssessment.level?.toUpperCase() || 'MEDIUM'}
                </Badge>
              </div>
              {data.riskAssessment.factors && data.riskAssessment.factors.length > 0 && (
                <div className="space-y-1">
                  {data.riskAssessment.factors.map((factor: string, idx: number) => (
                    <div key={idx} className="text-xs font-mono text-terminal-secondary">• {factor}</div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};