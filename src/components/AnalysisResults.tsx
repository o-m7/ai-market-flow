import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, AlertTriangle, Clock, TrendingUp, TrendingDown, Activity, Award } from "lucide-react";
import { useHistoricalAccuracy } from "@/hooks/useHistoricalAccuracy";

interface AnalysisResultsProps {
  data: any;
  symbol: string;
  timeframe?: string;
  includeQuantSignals?: boolean;
}

export const AnalysisResults = ({ data, symbol, timeframe = '60', includeQuantSignals = true }: AnalysisResultsProps) => {
  const { data: historicalData } = useHistoricalAccuracy(symbol, 30);
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'sell': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'hold': return 'text-terminal-accent bg-terminal-accent/10 border-terminal-accent/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const safeFormatNumber = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || typeof value !== 'number' || !isFinite(value)) {
      return '—';
    }
    return value.toFixed(decimals);
  };

  const analysisText = data.analysis || data.action_text || data.summary || 'No analysis available';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Historical Accuracy Banner */}
      {historicalData && historicalData.total_analyses > 0 && (
        <Card className="bg-gradient-to-r from-terminal-accent/10 to-terminal-green/10 border-2 border-terminal-accent">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-terminal-accent" />
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">
                    HISTORICAL ACCURACY (LAST 30 DAYS)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-mono-tabular font-bold ${
                      historicalData.accuracy_percentage >= 70 ? 'text-terminal-green' :
                      historicalData.accuracy_percentage >= 50 ? 'text-terminal-accent' :
                      'text-terminal-red'
                    }`}>
                      {historicalData.accuracy_percentage}%
                    </span>
                    <span className="text-sm font-mono-tabular text-terminal-secondary">
                      ({historicalData.target_hit_count}/{historicalData.target_hit_count + historicalData.stop_hit_count} wins)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TOTAL TRADES</div>
                  <div className="text-xl font-mono-tabular font-bold text-terminal-text">
                    {historicalData.total_analyses}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">AVG TIME</div>
                  <div className="text-xl font-mono-tabular font-bold text-terminal-text">
                    {historicalData.avg_hours_to_target ? `${historicalData.avg_hours_to_target.toFixed(1)}h` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">AVG WIN</div>
                  <div className="text-xl font-mono-tabular font-bold text-terminal-green">
                    {historicalData.avg_pnl_on_wins ? `+${historicalData.avg_pnl_on_wins.toFixed(2)}%` : '—'}
                  </div>
                </div>
              </div>
            </div>
            
            {historicalData.pending_count > 0 && (
              <div className="mt-3 pt-3 border-t border-terminal-border/30">
                <p className="text-xs font-mono-tabular text-terminal-secondary">
                  📊 {historicalData.pending_count} trade(s) still pending • System checks outcomes every hour
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: SUMMARY - Header Card */}
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
                {data.recommendation === 'buy' ? '↑ LONG (BUY)' : 
                 data.recommendation === 'sell' ? '↓ SHORT (SELL)' : 
                 data.recommendation === 'long' ? '↑ LONG (BUY)' : 
                 data.recommendation === 'short' ? '↓ SHORT (SELL)' : 
                 '⏸️ HOLD'}
              </Badge>
              <div className="text-xs font-mono-tabular text-terminal-secondary">
                CONFIDENCE: {data.recommendation === 'hold' ? '0' : Math.round((data.confidence_calibrated || data.confidence || 0.5))}%
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm font-mono leading-relaxed text-terminal-foreground whitespace-pre-wrap">
            {analysisText}
          </p>
        </CardContent>
      </Card>

      {/* Hold Signal Notice */}
      {data.recommendation === 'hold' && data.holdReason && (
        <Card className="border-2 bg-terminal-accent/5 border-terminal-accent">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 flex-shrink-0 mt-0.5 text-terminal-accent" />
              <div className="flex-1 space-y-2">
                <Badge className="font-mono-tabular bg-terminal-accent/20 text-terminal-accent border-terminal-accent">
                  ⏸️ HOLD - NO TRADE
                </Badge>
                <p className="text-sm font-mono-tabular text-terminal-text">
                  {data.holdReason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: MAIN TRADE - Primary Trade Idea */}
      {data.trade_idea && data.trade_idea.entry && data.recommendation !== 'hold' && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Target className="h-4 w-4" />
              MAIN TRADE SETUP
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Trade Direction */}
              <div className="flex items-center gap-2">
                <Badge className={`${
                  data.trade_idea.direction === 'long' || data.recommendation === 'buy' 
                    ? 'bg-terminal-green/20 text-terminal-green border-terminal-green' 
                    : 'bg-terminal-red/20 text-terminal-red border-terminal-red'
                } font-mono-tabular flex items-center gap-1`}>
                  {data.trade_idea.direction === 'long' || data.recommendation === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {data.trade_idea.direction === 'long' || data.recommendation === 'buy' ? 'LONG' : 'SHORT'}
                </Badge>
              </div>

              {/* Trade Levels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                  <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                    {safeFormatNumber(data.trade_idea.entry)}
                  </div>
                </div>
                <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                  <div className="text-lg font-mono-tabular text-terminal-red font-bold">
                    {safeFormatNumber(data.trade_idea.stop)}
                  </div>
                </div>
                {data.trade_idea.targets?.slice(0, 2).map((target: number, idx: number) => (
                  <div key={idx} className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                    <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TARGET {idx + 1}</div>
                    <div className="text-lg font-mono-tabular text-terminal-green font-bold">
                      {safeFormatNumber(target)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Signal Confidence */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-tabular text-terminal-secondary">SIGNAL STRENGTH</span>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: SIGNALS - Timeframe Profiles (Scalp, Intraday, Swing) */}
      {includeQuantSignals && 
       data.timeframe_profile && 
       Object.keys(data.timeframe_profile).length > 0 &&
       data.recommendation !== 'hold' && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              TRADING SIGNALS - ALL TIMEFRAMES
            </CardTitle>
            <p className="text-xs font-mono-tabular text-terminal-secondary mt-2">
              3 unique strategies for different trading styles
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {(() => {
                const signalsToUse = data.timeframe_profile;
                if (!signalsToUse.scalp && !signalsToUse.intraday && !signalsToUse.swing) return null;
                
                const tradeDirection = data.trade_idea?.direction || data.recommendation || 'hold';
                const isLong = tradeDirection === 'long' || tradeDirection === 'buy';
                const direction = isLong ? 'LONG' : 'SHORT';
                const directionColor = isLong ? 'text-terminal-green' : 'text-terminal-red';
                const directionIcon = isLong ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;

                const calculateRR = (entry: number, stop: number, target: number) => {
                  if (!entry || !stop || !target) return '0.00';
                  const risk = Math.abs(entry - stop);
                  const reward = Math.abs(target - entry);
                  return risk > 0 ? (reward / risk).toFixed(2) : '0.00';
                };

                const calculatePercent = (entry: number, target: number) => {
                  if (!entry || !target || entry === 0) return '0.00';
                  return (((target - entry) / entry) * 100).toFixed(2);
                };

                return (
                  <>
                    {/* SCALP - Instant Execution */}
                    {signalsToUse.scalp && signalsToUse.scalp.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-yellow-400 uppercase flex items-center gap-1">
                              ⚡ SCALP
                            </span>
                          </div>
                          {signalsToUse.scalp.probability && (
                            <span className={`text-xs font-mono-tabular font-bold ${
                              signalsToUse.scalp.probability >= 70 ? 'text-terminal-green' :
                              signalsToUse.scalp.probability >= 50 ? 'text-terminal-accent' :
                              'text-terminal-red'
                            }`}>
                              {signalsToUse.scalp.probability}%
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-yellow-400/80 mb-2">
                          ⚡ INSTANT MARKET EXECUTION • Entry at current price • Tight 0.5 ATR stop
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(signalsToUse.scalp.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.scalp.stop)}
                            </div>
                          </div>
                          {signalsToUse.scalp.targets?.map((target: number, idx: number) => (
                            <div key={idx}>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TP{idx + 1}</div>
                              <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                {safeFormatNumber(target)}
                              </div>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                R:{calculateRR(signalsToUse.scalp.entry, signalsToUse.scalp.stop, target)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* INTRADAY - EMA20 Pullback */}
                    {signalsToUse.intraday && signalsToUse.intraday.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-blue-400 uppercase flex items-center gap-1">
                              📊 INTRADAY
                            </span>
                          </div>
                          {signalsToUse.intraday.probability && (
                            <span className={`text-xs font-mono-tabular font-bold ${
                              signalsToUse.intraday.probability >= 70 ? 'text-terminal-green' :
                              signalsToUse.intraday.probability >= 50 ? 'text-terminal-accent' :
                              'text-terminal-red'
                            }`}>
                              {signalsToUse.intraday.probability}%
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-blue-400/80 mb-2">
                          📊 EMA20 PULLBACK STRATEGY • Wait for EMA20 retest • Moderate 1.5 ATR stop
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(signalsToUse.intraday.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.intraday.stop)}
                            </div>
                          </div>
                          {signalsToUse.intraday.targets?.map((target: number, idx: number) => (
                            <div key={idx}>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TP{idx + 1}</div>
                              <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                {safeFormatNumber(target)}
                              </div>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                R:{calculateRR(signalsToUse.intraday.entry, signalsToUse.intraday.stop, target)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SWING - Position Trade */}
                    {signalsToUse.swing && signalsToUse.swing.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-purple-400 uppercase flex items-center gap-1">
                              🎯 SWING
                            </span>
                          </div>
                          {signalsToUse.swing.probability && (
                            <span className={`text-xs font-mono-tabular font-bold ${
                              signalsToUse.swing.probability >= 70 ? 'text-terminal-green' :
                              signalsToUse.swing.probability >= 50 ? 'text-terminal-accent' :
                              'text-terminal-red'
                            }`}>
                              {signalsToUse.swing.probability}%
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono-tabular text-purple-400/80 mb-2">
                          🎯 POSITION TRADE • Entry at EMA50 or Fib 38.2% • Wide 2.0 ATR stop
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY</div>
                            <div className="text-sm font-mono-tabular text-terminal-foreground font-bold">
                              {safeFormatNumber(signalsToUse.swing.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.swing.stop)}
                            </div>
                          </div>
                          {signalsToUse.swing.targets?.map((target: number, idx: number) => (
                            <div key={idx}>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">TP{idx + 1}</div>
                              <div className="text-sm font-mono-tabular text-terminal-green font-bold">
                                {safeFormatNumber(target)}
                              </div>
                              <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                                R:{calculateRR(signalsToUse.swing.entry, signalsToUse.swing.stop, target)}
                              </div>
                            </div>
                          ))}
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

      {/* SECTION 4: QUANT METRICS - Quantitative Data */}
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
                    <div key={idx} className="text-xs font-mono text-terminal-secondary">
                      • {typeof factor === 'string' ? factor : JSON.stringify(factor)}
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