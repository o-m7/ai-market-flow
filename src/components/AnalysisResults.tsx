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

  // Safe formatting function
  const safeFormatNumber = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || typeof value !== 'number' || !isFinite(value)) {
      return '—';
    }
    return value.toFixed(decimals);
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

      {/* Trading Signals - All Timeframes */}
      {data.timeframe_profile && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              TRADING SIGNALS - ALL TIMEFRAMES
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Helper function to determine if signal is long or short */}
              {(() => {
                // Use trade_idea.direction for accurate signal direction (always long or short now)
                const tradeDirection = data.trade_idea?.direction || 'long';
                const isLong = tradeDirection === 'long';
                const direction = isLong ? 'LONG' : 'SHORT';
                const directionColor = isLong ? 'text-terminal-green' : 'text-terminal-red';
                const directionIcon = isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;

                // Calculate risk/reward for display
                const calculateRR = (entry: number, stop: number, target: number) => {
                  if (!entry || !stop || !target || typeof entry !== 'number' || typeof stop !== 'number' || typeof target !== 'number') {
                    return '0.00';
                  }
                  const risk = Math.abs(entry - stop);
                  const reward = Math.abs(target - entry);
                  return risk > 0 ? (reward / risk).toFixed(2) : '0.00';
                };

                // Calculate percentage move
                const calculatePercent = (entry: number, target: number) => {
                  if (!entry || !target || typeof entry !== 'number' || typeof target !== 'number' || entry === 0) {
                    return '0.00';
                  }
                  return (((target - entry) / entry) * 100).toFixed(2);
                };

                return (
                  <>
                    {/* Scalp Signals - Quick exits, tight stops, 1-5 min holding */}
                    {data.timeframe_profile?.scalp && data.timeframe_profile.scalp.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">SCALP</span>
                            {data.timeframe_profile.scalp.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {data.timeframe_profile.scalp.strategy}
                              </Badge>
                            )}
                          </div>
                          {data.timeframe_profile.scalp.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                data.timeframe_profile.scalp.probability >= 70 ? 'text-terminal-green' :
                                data.timeframe_profile.scalp.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {data.timeframe_profile.scalp.probability}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 italic">
                          Timeframe: 1-5 min • Tight stops • Quick profit taking • Est. Duration: 1-15 minutes
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(data.timeframe_profile.scalp.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(data.timeframe_profile.scalp.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(data.timeframe_profile.scalp.entry, data.timeframe_profile.scalp.stop)}%
                            </div>
                          </div>
                          {data.timeframe_profile.scalp.targets?.map((target: number, idx: number) => {
                            const timeEstimates = ['2-5 min', '5-10 min', '10-15 min'];
                            return (
                              <div key={idx}>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">
                                  TP{idx + 1} • {timeEstimates[idx]}
                                </div>
                                <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                  {safeFormatNumber(target)}
                                </div>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                  {calculatePercent(data.timeframe_profile.scalp.entry, target)}% • R:{calculateRR(data.timeframe_profile.scalp.entry, data.timeframe_profile.scalp.stop, target)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Intraday Signals - Same-day exits, moderate stops, 15min-4hr holding */}
                    {data.timeframe_profile?.intraday && data.timeframe_profile.intraday.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">INTRADAY</span>
                            {data.timeframe_profile.intraday.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {data.timeframe_profile.intraday.strategy}
                              </Badge>
                            )}
                          </div>
                          {data.timeframe_profile.intraday.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                data.timeframe_profile.intraday.probability >= 70 ? 'text-terminal-green' :
                                data.timeframe_profile.intraday.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {data.timeframe_profile.intraday.probability}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 italic">
                          Timeframe: 15min-4hr • Same-day exit • Moderate risk/reward • Est. Duration: 1-8 hours
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(data.timeframe_profile.intraday.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(data.timeframe_profile.intraday.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(data.timeframe_profile.intraday.entry, data.timeframe_profile.intraday.stop)}%
                            </div>
                          </div>
                          {data.timeframe_profile.intraday.targets?.map((target: number, idx: number) => {
                            const timeEstimates = ['1-3 hrs', '3-5 hrs', '5-8 hrs'];
                            return (
                              <div key={idx}>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">
                                  TP{idx + 1} • {timeEstimates[idx]}
                                </div>
                                <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                  {safeFormatNumber(target)}
                                </div>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                  {calculatePercent(data.timeframe_profile.intraday.entry, target)}% • R:{calculateRR(data.timeframe_profile.intraday.entry, data.timeframe_profile.intraday.stop, target)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Swing Signals - Multi-day holds, wider stops, larger targets */}
                    {data.timeframe_profile?.swing && data.timeframe_profile.swing.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">SWING</span>
                            {data.timeframe_profile.swing.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {data.timeframe_profile.swing.strategy}
                              </Badge>
                            )}
                          </div>
                          {data.timeframe_profile.swing.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                data.timeframe_profile.swing.probability >= 70 ? 'text-terminal-green' :
                                data.timeframe_profile.swing.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {data.timeframe_profile.swing.probability}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-terminal-secondary mb-3 italic">
                          Timeframe: 4hr-Daily • Multi-day hold • Larger targets & stops • Est. Duration: 1-7 days
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(data.timeframe_profile.swing.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(data.timeframe_profile.swing.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(data.timeframe_profile.swing.entry, data.timeframe_profile.swing.stop)}%
                            </div>
                          </div>
                          {data.timeframe_profile.swing.targets?.map((target: number, idx: number) => {
                            const timeEstimates = ['1-2 days', '2-4 days', '4-7 days'];
                            return (
                              <div key={idx}>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">
                                  TP{idx + 1} • {timeEstimates[idx]}
                                </div>
                                <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                  {safeFormatNumber(target)}
                                </div>
                                <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                  {calculatePercent(data.timeframe_profile.swing.entry, target)}% • R:{calculateRR(data.timeframe_profile.swing.entry, data.timeframe_profile.swing.stop, target)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

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
                      {safeFormatNumber(data.technical.rsi14, 1)}
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
                      {safeFormatNumber(data.technical.stoch_k, 1)}
                    </div>
                  </div>
                )}
                {data.technical.stoch_d !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOCH %D</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.stoch_d, 1)}
                    </div>
                  </div>
                )}
                {data.technical.macd?.hist !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MACD HIST</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {data.technical.macd.hist > 0 ? '+' : ''}{safeFormatNumber(data.technical.macd.hist, 4)}
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
                      {safeFormatNumber(data.technical.macd.line, 4)}
                    </div>
                  </div>
                )}
                {data.technical.macd?.signal !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MACD SIGNAL</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.macd.signal, 4)}
                    </div>
                  </div>
                )}
                {data.technical.cci !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">CCI (20)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.cci, 1)}
                    </div>
                  </div>
                )}
                {data.technical.adx !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ADX (14)</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.adx, 1)}
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
                      {safeFormatNumber(data.technical.sma20, 2)}
                    </div>
                  </div>
                )}
                {data.technical.sma50 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SMA 50</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.sma50, 2)}
                    </div>
                  </div>
                )}
                {data.technical.sma200 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SMA 200</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.sma200, 2)}
                    </div>
                  </div>
                )}
                {data.technical.ema9 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 9</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.ema9, 2)}
                    </div>
                  </div>
                )}
                {data.technical.ema20 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 20</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.ema20, 2)}
                    </div>
                  </div>
                )}
                {data.technical.ema50 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 50</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.ema50, 2)}
                    </div>
                  </div>
                )}
                {data.technical.vwma !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VWMA</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.vwma, 2)}
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
                      {safeFormatNumber(data.technical.atr14, 4)}
                    </div>
                  </div>
                )}
                {data.technical.bb?.upper !== undefined && (
                  <>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB UPPER</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {safeFormatNumber(data.technical.bb.upper, 2)}
                      </div>
                    </div>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB MIDDLE</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {safeFormatNumber(data.technical.bb.mid, 2)}
                      </div>
                    </div>
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB LOWER</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground">
                        {safeFormatNumber(data.technical.bb.lower, 2)}
                      </div>
                    </div>
                  </>
                )}
                {data.technical.volume_analysis?.obv !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">OBV</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.volume_analysis.obv / 1000000, 2)}M
                    </div>
                  </div>
                )}
                {data.technical.volume_sma20 !== undefined && (
                  <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VOL SMA 20</div>
                    <div className="text-lg font-mono-tabular text-terminal-foreground">
                      {safeFormatNumber(data.technical.volume_sma20 / 1000000, 2)}M
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Idea - Always shows since direction is always long or short */}
      {data.trade_idea && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Target className="h-4 w-4" />
              TRADE IDEA • {data.trade_idea.direction?.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${
                data.trade_idea.direction === 'long' ? 'text-terminal-green bg-terminal-green/10 border-terminal-green/20' :
                'text-terminal-red bg-terminal-red/10 border-terminal-red/20'
              } font-mono-tabular`}>
                {data.trade_idea.direction === 'long' ? '↑ LONG' : '↓ SHORT'}
              </Badge>
              {data.trade_idea.setup_type && (
                <Badge variant="outline" className="font-mono-tabular text-xs">
                  {data.trade_idea.setup_type.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                <div className="text-lg font-mono-tabular text-terminal-accent font-bold">
                  {safeFormatNumber(data.trade_idea.entry, 5)}
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                <div className="text-lg font-mono-tabular text-terminal-red font-bold">
                  {safeFormatNumber(data.trade_idea.stop, 5)}
                </div>
              </div>
              {data.trade_idea.targets?.slice(0, 2).map((target: number, idx: number) => (
                <div key={idx} className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TARGET {idx + 1}</div>
                  <div className="text-lg font-mono-tabular text-terminal-green font-bold">
                    {safeFormatNumber(target, 5)}
                  </div>
                </div>
              ))}
            </div>
            {data.trade_idea.rationale && (
              <div className="mt-4 bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">RATIONALE</div>
                <div className="text-xs font-mono text-terminal-foreground leading-relaxed">
                  {data.trade_idea.rationale}
                </div>
              </div>
            )}
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
                      <span className="text-sm font-mono-tabular text-terminal-green">{safeFormatNumber(level, 2)}</span>
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
                      <span className="text-sm font-mono-tabular text-terminal-red">{safeFormatNumber(level, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liquidity Zones */}
      {data.keyLevels?.liquidity_zones && data.keyLevels.liquidity_zones.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">LIQUIDITY ZONES</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {data.keyLevels.liquidity_zones.map((zone: any, idx: number) => (
                <div key={idx} className={`p-3 border-l-2 ${
                  zone.type === 'buy' ? 'bg-terminal-green/5 border-terminal-green' : 'bg-terminal-red/5 border-terminal-red'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        zone.type === 'buy' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-terminal-red/20 text-terminal-red'
                      } text-xs font-mono-tabular`}>
                        {zone.type.toUpperCase()} SIDE
                      </Badge>
                      <Badge className="bg-terminal-darker text-terminal-secondary text-xs font-mono-tabular">
                        {zone.strength.toUpperCase()}
                      </Badge>
                    </div>
                    <span className={`text-sm font-mono-tabular font-bold ${
                      zone.type === 'buy' ? 'text-terminal-green' : 'text-terminal-red'
                    }`}>
                      {safeFormatNumber(zone.price, 2)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-terminal-secondary">
                    {zone.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakout Zones */}
      {data.keyLevels?.breakout_zones && data.keyLevels.breakout_zones.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">BREAKOUT ZONES</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {data.keyLevels.breakout_zones.map((zone: any, idx: number) => (
                <div key={idx} className={`p-3 border-l-2 ${
                  zone.type === 'bullish' ? 'bg-terminal-green/5 border-terminal-green' : 'bg-terminal-red/5 border-terminal-red'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        zone.type === 'bullish' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-terminal-red/20 text-terminal-red'
                      } text-xs font-mono-tabular`}>
                        {zone.type.toUpperCase()}
                      </Badge>
                      <Badge className="bg-terminal-darker text-terminal-secondary text-xs font-mono-tabular">
                        {zone.strength.toUpperCase()}
                      </Badge>
                    </div>
                    <span className={`text-sm font-mono-tabular font-bold ${
                      zone.type === 'bullish' ? 'text-terminal-green' : 'text-terminal-red'
                    }`}>
                      {safeFormatNumber(zone.price, 2)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-terminal-secondary">
                    {zone.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Blocks */}
      {data.keyLevels?.order_blocks && data.keyLevels.order_blocks.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">ORDER BLOCKS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {data.keyLevels.order_blocks.map((block: any, idx: number) => (
                <div key={idx} className={`p-3 border-l-2 ${
                  block.type === 'bullish' ? 'bg-terminal-green/5 border-terminal-green' : 'bg-terminal-red/5 border-terminal-red'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        block.type === 'bullish' ? 'bg-terminal-green/20 text-terminal-green' : 'bg-terminal-red/20 text-terminal-red'
                      } text-xs font-mono-tabular`}>
                        {block.type.toUpperCase()}
                      </Badge>
                      <Badge className="bg-terminal-darker text-terminal-secondary text-xs font-mono-tabular">
                        {block.strength.toUpperCase()}
                      </Badge>
                    </div>
                    <span className={`text-xs font-mono-tabular ${
                      block.type === 'bullish' ? 'text-terminal-green' : 'text-terminal-red'
                    }`}>
                      {safeFormatNumber(block.low, 2)} - {safeFormatNumber(block.high, 2)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-terminal-secondary">
                    {block.description}
                  </div>
                </div>
              ))}
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
                    {typeof value === 'number' ? safeFormatNumber(value, 4) : String(value)}
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
                        <span className="text-sm font-mono-tabular text-terminal-accent">{safeFormatNumber(Number(price), 2)}</span>
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
                        <span className="text-sm font-mono-tabular text-terminal-accent">{safeFormatNumber(Number(price), 2)}</span>
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
                <div className="space-y-2">
                  {data.riskAssessment.factors.map((factor: any, idx: number) => (
                    <div key={idx}>
                      {typeof factor === 'string' ? (
                        <div className="text-xs font-mono text-terminal-secondary">• {factor}</div>
                      ) : (
                        <div className="space-y-1">
                          {factor.level && (
                            <div className="text-xs font-mono-tabular text-terminal-accent uppercase">{factor.level}</div>
                          )}
                          {factor.bullets && factor.bullets.length > 0 && (
                            <div className="space-y-1 ml-2">
                              {factor.bullets.map((bullet: string, bIdx: number) => (
                                <div key={bIdx} className="text-xs font-mono text-terminal-secondary">• {bullet}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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