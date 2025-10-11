import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, AlertTriangle, Clock, TrendingUp, TrendingDown, Activity, Award, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useHistoricalAccuracy } from "@/hooks/useHistoricalAccuracy";

interface AnalysisResultsProps {
  data: any;
  symbol: string;
  timeframe?: string;
  includeQuantSignals?: boolean;
}

export const AnalysisResults = ({ data, symbol, timeframe = '60', includeQuantSignals = true }: AnalysisResultsProps) => {
  // Log the data structure for debugging
  console.log('AnalysisResults data:', data);
  
  // Fetch historical accuracy for this symbol
  const { data: historicalData } = useHistoricalAccuracy(symbol, 30);
  
  // Only fetch quant metrics if needed and not already in AI analysis
  const [quantMetrics, setQuantMetrics] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (includeQuantSignals && !data.technical) {
      // Only fetch if technical data not already in analysis
      const fetchQuantMetrics = async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const timeframeMap: Record<string, string> = {
            '1': '1m', '5': '5m', '15': '15m', '30': '30m', 
            '60': '1h', '240': '4h', 'D': '1d'
          };
          const { data: response, error } = await supabase.functions.invoke('quant-data', {
            body: { symbol, tf: timeframeMap[timeframe] || '1h', withSummary: false }
          });
          
          if (!error && response) {
            const metrics = {
              rsi14: response.rsi14,
              ema20: response.ema?.['20'],
              ema50: response.ema?.['50'],
              ema200: response.ema?.['200'],
              atr14: response.atr14,
              zscore20: response.zscore20,
              vol20_annual: response.vol20_annual,
              vwap: response.vwap,
              macd: response.macd,
              bb20: response.bb20,
              donchian20: response.donchian20,
              ...response.quant_metrics
            };
            setQuantMetrics(metrics);
          }
        } catch (e) {
          console.error('Failed to fetch quant metrics:', e);
        }
      };
      fetchQuantMetrics();
    } else {
      setQuantMetrics(null);
    }
  }, [symbol, timeframe, includeQuantSignals, data.technical]);
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'sell': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'hold': return 'text-terminal-accent bg-terminal-accent/10 border-terminal-accent/20';
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
      </Card>

      {/* Hold Signal Notice - Shows when AI returns "hold" */}
      {data.recommendation === 'hold' && (data.holdReason || data.rejectionDetails) && (
        <Card className="border-2 bg-terminal-accent/5 border-terminal-accent">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 flex-shrink-0 mt-0.5 text-terminal-accent" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                <Badge className="font-mono-tabular bg-terminal-accent/20 text-terminal-accent border-terminal-accent">
                  ⏸️ HOLD - NO TRADE
                </Badge>
                <span className="text-xs font-mono-tabular text-terminal-secondary">
                  MARKET CONDITIONS UNCERTAIN OR TOO RISKY
                </span>
                </div>
                <p className="text-sm font-mono-tabular text-terminal-text">
                  {data.holdReason || 'Conditions unclear - waiting for better setup'}
                </p>
                {data.rejectionDetails && (
                  <div className="mt-2 space-y-1">
                    {data.rejectionDetails.confidence_agreement !== undefined && (
                      <p className="text-xs font-mono-tabular text-terminal-secondary">
                        • Confidence Agreement: {data.rejectionDetails.confidence_agreement}% (Minimum: {data.rejectionDetails.threshold}%)
                      </p>
                    )}
                    {data.rejectionDetails.rr_ratio && (
                      <p className="text-xs font-mono-tabular text-terminal-secondary">
                        • Risk:Reward Ratio: {data.rejectionDetails.rr_ratio} (Minimum: {data.rejectionDetails.threshold})
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs font-mono-tabular text-terminal-accent mt-2">
                  💡 Waiting for clearer setup with better risk:reward and stronger indicator confluence. Goal: Maximize profit while minimizing risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Staleness Warning - Critical Alert */}
      {data.data_staleness_warning && (
        <Card className={`border-2 ${
          data.data_staleness_warning.severity === 'HIGH' 
            ? 'bg-terminal-red/5 border-terminal-red' 
            : 'bg-terminal-accent/5 border-terminal-accent'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                data.data_staleness_warning.severity === 'HIGH' 
                  ? 'text-terminal-red' 
                  : 'text-terminal-accent'
              }`} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`font-mono-tabular ${
                    data.data_staleness_warning.severity === 'HIGH' 
                      ? 'bg-terminal-red/20 text-terminal-red border-terminal-red' 
                      : 'bg-terminal-accent/20 text-terminal-accent border-terminal-accent'
                  }`}>
                    {data.data_staleness_warning.severity} SEVERITY
                  </Badge>
                  <span className="text-xs font-mono-tabular text-terminal-secondary">
                    DATA AGE: {data.data_staleness_warning.data_age_seconds}s ({data.accuracy_metrics?.data_age_info?.age_minutes || 0}m)
                  </span>
                </div>
                <p className="text-sm font-mono-tabular text-terminal-text">
                  {data.data_staleness_warning.message}
                </p>
                <p className="text-xs font-mono-tabular text-terminal-secondary">
                  💡 {data.data_staleness_warning.recommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry Price Correction Notice */}
      {data.entry_correction_applied && data.entry_correction_details && (
        <Card className="border-2 bg-terminal-accent/5 border-terminal-accent">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 flex-shrink-0 mt-0.5 text-terminal-accent" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono-tabular bg-terminal-accent/20 text-terminal-accent border-terminal-accent">
                    AUTO-CORRECTED
                  </Badge>
                  <span className="text-xs font-mono-tabular text-terminal-secondary">
                    ENTRY PRICE VALIDATION
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-mono-tabular text-terminal-text">
                    Original Entry: <span className="text-terminal-red line-through">{safeFormatNumber(data.entry_correction_details.original_entry)}</span>
                  </p>
                  <p className="text-sm font-mono-tabular text-terminal-text">
                    Corrected Entry: <span className="text-terminal-green font-bold">{safeFormatNumber(data.entry_correction_details.corrected_entry)}</span>
                  </p>
                </div>
                <p className="text-xs font-mono-tabular text-terminal-secondary">
                  🔧 {data.entry_correction_details.reason}
                </p>
                {data.entry_correction_details.corrections.map((correction: string, idx: number) => (
                  <p key={idx} className="text-xs font-mono-tabular text-terminal-accent">
                    ✓ {correction}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Confidence Agreement Analysis */}
      {data.accuracy_metrics?.indicator_agreement && (
        <Card className={`border-2 ${
          data.accuracy_metrics.signal_confidence_agreement >= 75 ? 'bg-terminal-green/5 border-terminal-green' :
          data.accuracy_metrics.signal_confidence_agreement >= 50 ? 'bg-terminal-accent/5 border-terminal-accent' :
          'bg-terminal-red/5 border-terminal-red'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono-tabular flex items-center gap-2">
                <Activity className={`h-4 w-4 ${
                  data.accuracy_metrics.signal_confidence_agreement >= 75 ? 'text-terminal-green' :
                  data.accuracy_metrics.signal_confidence_agreement >= 50 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`} />
                SIGNAL CONFIDENCE AGREEMENT
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`font-mono-tabular ${
                  data.accuracy_metrics.signal_quality === 'STRONG' ? 'bg-terminal-green/20 text-terminal-green border-terminal-green' :
                  data.accuracy_metrics.signal_quality === 'MODERATE' ? 'bg-terminal-accent/20 text-terminal-accent border-terminal-accent' :
                  'bg-terminal-red/20 text-terminal-red border-terminal-red'
                }`}>
                  {data.accuracy_metrics.signal_quality}
                </Badge>
                <span className={`text-2xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.signal_confidence_agreement >= 75 ? 'text-terminal-green' :
                  data.accuracy_metrics.signal_confidence_agreement >= 50 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.signal_confidence_agreement}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              <div className="text-xs font-mono-tabular text-terminal-secondary mb-2">
                INDICATOR AGREEMENT: {data.accuracy_metrics.indicator_agreement.agreement_count}/{data.accuracy_metrics.indicator_agreement.total_checks} checks passed
              </div>
              
              {/* Indicator Checks */}
              <div className="space-y-2">
                {data.accuracy_metrics.indicator_agreement.checks.map((check: any, idx: number) => (
                  <div key={idx} className={`flex items-center justify-between p-2 border-l-2 text-xs font-mono ${
                    check.status === 'AGREE' ? 'bg-terminal-green/5 border-terminal-green text-terminal-green' :
                    check.status === 'CONFLICT' ? 'bg-terminal-red/5 border-terminal-red text-terminal-red' :
                    'bg-terminal-accent/5 border-terminal-accent text-terminal-accent'
                  }`}>
                    <span className="font-bold">{check.indicator}</span>
                    <span>{check.detail}</span>
                  </div>
                ))}
              </div>

              {/* Conflicting Signals Warning */}
              {data.accuracy_metrics.indicator_agreement.conflicting_signals.length > 0 && (
                <div className="bg-terminal-red/10 border-2 border-terminal-red p-3 space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-terminal-red flex-shrink-0" />
                    <span className="text-xs font-mono-tabular font-bold text-terminal-red">
                      {data.accuracy_metrics.indicator_agreement.conflicting_signals.length} CONFLICTING SIGNAL(S) DETECTED
                    </span>
                  </div>
                  <div className="space-y-1">
                    {data.accuracy_metrics.indicator_agreement.conflicting_signals.map((signal: string, idx: number) => (
                      <p key={idx} className="text-xs font-mono-tabular text-terminal-red pl-6">
                        • {signal}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs font-mono-tabular text-terminal-red/80 pt-2 border-t border-terminal-red/30">
                    ⚠️ Trade with caution: Indicators are not aligned with the signal direction. Consider waiting for better confluence or reducing position size.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accuracy Metrics - Quantitative Validation */}
      {data.accuracy_metrics && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ACCURACY & VALIDATION METRICS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">DATA FRESHNESS</div>
                <div className={`text-2xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.data_freshness_score >= 80 ? 'text-terminal-green' :
                  data.accuracy_metrics.data_freshness_score >= 60 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.data_freshness_score}%
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SIGNAL CLARITY</div>
                <div className={`text-2xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.signal_clarity_score >= 80 ? 'text-terminal-green' :
                  data.accuracy_metrics.signal_clarity_score >= 60 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.signal_clarity_score}%
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">LEVEL PRECISION</div>
                <div className={`text-2xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.level_precision_score >= 80 ? 'text-terminal-green' :
                  data.accuracy_metrics.level_precision_score >= 60 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.level_precision_score}%
                </div>
              </div>
              <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ENTRY VALIDITY</div>
                <div className={`text-2xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.entry_validity_score >= 80 ? 'text-terminal-green' :
                  data.accuracy_metrics.entry_validity_score >= 60 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.entry_validity_score}%
                </div>
              </div>
            </div>
            
            <div className="bg-terminal-darker p-4 border-2 border-terminal-accent/30 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono-tabular text-terminal-secondary">OVERALL ACCURACY SCORE</div>
                <div className={`text-3xl font-mono-tabular font-bold ${
                  data.accuracy_metrics.overall_accuracy >= 80 ? 'text-terminal-green' :
                  data.accuracy_metrics.overall_accuracy >= 60 ? 'text-terminal-accent' :
                  'text-terminal-red'
                }`}>
                  {data.accuracy_metrics.overall_accuracy}%
                </div>
              </div>
              <div className="h-3 bg-terminal-darker rounded-full overflow-hidden border border-terminal-border">
                <div 
                  className={`h-full ${
                    data.accuracy_metrics.overall_accuracy >= 80 ? 'bg-terminal-green' :
                    data.accuracy_metrics.overall_accuracy >= 60 ? 'bg-terminal-accent' :
                    'bg-terminal-red'
                  }`}
                  style={{ width: `${data.accuracy_metrics.overall_accuracy}%` }}
                />
              </div>
            </div>

            {data.accuracy_metrics.validation_notes && data.accuracy_metrics.validation_notes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono-tabular text-terminal-secondary mb-2">VALIDATION NOTES:</div>
                {data.accuracy_metrics.validation_notes.map((note: string, idx: number) => {
                  const isWarning = note.includes('⚠️');
                  const isSuccess = note.includes('✓');
                  const isCorrection = note.includes('🔧');
                  return (
                    <div key={idx} className={`flex items-start gap-2 p-2 border-l-2 text-xs font-mono ${
                      isWarning ? 'bg-terminal-red/5 border-terminal-red text-terminal-red' :
                      isSuccess ? 'bg-terminal-green/5 border-terminal-green text-terminal-green' :
                      isCorrection ? 'bg-terminal-accent/5 border-terminal-accent text-terminal-accent' :
                      'bg-terminal-accent/5 border-terminal-accent text-terminal-accent'
                    }`}>
                      {note}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                  {data.recommendation === 'buy' ? 'LONG (BUY)' : 
                   data.recommendation === 'sell' ? 'SHORT (SELL)' : 
                   data.recommendation === 'long' ? 'LONG (BUY)' : 
                   data.recommendation === 'short' ? 'SHORT (SELL)' : 
                   'HOLD - NO TRADE'}
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

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Signals - Only show once using fresh AI data */}
      {data.recommendation !== 'hold' && data.action !== 'hold' && 
       (data.timeframe_profile || data.trade_idea) && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              TRADING SIGNALS - ALL TIMEFRAMES
            </CardTitle>
            <p className="text-xs font-mono-tabular text-terminal-secondary mt-2">
              Live AI Analysis • Generated: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Helper function to determine if signal is long or short */}
              {(() => {
                // CRITICAL: Only use fresh AI analysis data, never cached quant signals
                const signalsToUse: any = {};
                
                if (data.timeframe_profile) {
                  // Use AI-generated timeframe profile from the fresh analysis
                  signalsToUse.scalp = data.timeframe_profile.scalp;
                  signalsToUse.intraday = data.timeframe_profile.intraday;
                  signalsToUse.swing = data.timeframe_profile.swing;
                } else if (data.trade_idea && data.trade_idea.entry) {
                  // Fallback: Use main trade idea for all timeframes
                  signalsToUse.scalp = data.trade_idea;
                  signalsToUse.intraday = data.trade_idea;
                  signalsToUse.swing = data.trade_idea;
                }
                
                // If no signals available, don't show this section
                if (!signalsToUse.scalp && !signalsToUse.intraday && !signalsToUse.swing) {
                  return null;
                }
                
                // Check for hold signal first - if recommendation is hold, don't show signals
                if (data.recommendation === 'hold' || data.action === 'hold') {
                  return null; // Don't show trading signals section for hold recommendations
                }
                
                // Use trade_idea.direction for accurate signal direction
                // Map buy -> long, sell -> short for clarity
                let tradeDirection = data.trade_idea?.direction || data.recommendation || 'hold';
                if (tradeDirection === 'buy') tradeDirection = 'long';
                if (tradeDirection === 'sell') tradeDirection = 'short';
                
                // If still no clear direction or hold, don't show signals
                if (tradeDirection === 'hold' || (!tradeDirection)) {
                  return null;
                }
                
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
                    {signalsToUse.scalp && signalsToUse.scalp.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">SCALP</span>
                            {signalsToUse.scalp.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {signalsToUse.scalp.strategy}
                              </Badge>
                            )}
                          </div>
                          {signalsToUse.scalp.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                signalsToUse.scalp.probability >= 70 ? 'text-terminal-green' :
                                signalsToUse.scalp.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {signalsToUse.scalp.probability}%
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
                              {safeFormatNumber(signalsToUse.scalp.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.scalp.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(signalsToUse.scalp.entry, signalsToUse.scalp.stop)}%
                            </div>
                          </div>
                          {signalsToUse.scalp.targets?.map((target: number, idx: number) => {
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
                                  {calculatePercent(signalsToUse.scalp.entry, target)}% • R:{calculateRR(signalsToUse.scalp.entry, signalsToUse.scalp.stop, target)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Intraday Signals - Same-day exits, moderate stops, 15min-4hr holding */}
                    {signalsToUse.intraday && signalsToUse.intraday.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">INTRADAY</span>
                            {signalsToUse.intraday.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {signalsToUse.intraday.strategy}
                              </Badge>
                            )}
                          </div>
                          {signalsToUse.intraday.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                signalsToUse.intraday.probability >= 70 ? 'text-terminal-green' :
                                signalsToUse.intraday.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {signalsToUse.intraday.probability}%
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
                              {safeFormatNumber(signalsToUse.intraday.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.intraday.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(signalsToUse.intraday.entry, signalsToUse.intraday.stop)}%
                            </div>
                          </div>
                          {signalsToUse.intraday.targets?.map((target: number, idx: number) => {
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
                                  {calculatePercent(signalsToUse.intraday.entry, target)}% • R:{calculateRR(signalsToUse.intraday.entry, signalsToUse.intraday.stop, target)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Swing Signals - Multi-day holds, wider stops, larger targets */}
                    {signalsToUse.swing && signalsToUse.swing.entry && (
                      <div className="bg-terminal-darker/50 p-4 border border-terminal-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${directionColor} bg-opacity-20 border ${isLong ? 'border-terminal-green' : 'border-terminal-red'} flex items-center gap-1`}>
                              {directionIcon}
                              {direction}
                            </Badge>
                            <span className="text-xs font-mono-tabular text-terminal-accent uppercase">SWING</span>
                            {signalsToUse.swing.strategy && (
                              <Badge variant="outline" className="text-xs font-mono-tabular">
                                {signalsToUse.swing.strategy}
                              </Badge>
                            )}
                          </div>
                          {signalsToUse.swing.probability && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-tabular text-terminal-secondary">CONFIDENCE:</span>
                              <span className={`text-xs font-mono-tabular font-bold ${
                                signalsToUse.swing.probability >= 70 ? 'text-terminal-green' :
                                signalsToUse.swing.probability >= 50 ? 'text-terminal-accent' :
                                'text-terminal-red'
                              }`}>
                                {signalsToUse.swing.probability}%
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
                              {safeFormatNumber(signalsToUse.swing.entry)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STOP LOSS</div>
                            <div className="text-sm font-mono-tabular text-terminal-red font-bold">
                              {safeFormatNumber(signalsToUse.swing.stop)}
                            </div>
                            <div className="text-xs font-mono-tabular text-terminal-secondary mt-0.5">
                              {calculatePercent(signalsToUse.swing.entry, signalsToUse.swing.stop)}%
                            </div>
                          </div>
                          {signalsToUse.swing.targets?.map((target: number, idx: number) => {
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
                                  {calculatePercent(signalsToUse.swing.entry, target)}% • R:{calculateRR(signalsToUse.swing.entry, signalsToUse.swing.stop, target)}
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

      {/* Trade Idea - Only show if there's actual trade data (not hold) */}
      {data.trade_idea && data.trade_idea._type !== 'undefined' && data.recommendation !== 'hold' && data.action !== 'hold' && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Target className="h-4 w-4" />
              TRADE IDEA • {data.trade_idea.direction === 'long' || data.trade_idea.direction === 'buy' ? 'LONG (BUY)' : 
                           data.trade_idea.direction === 'short' || data.trade_idea.direction === 'sell' ? 'SHORT (SELL)' : 
                           data.trade_idea.direction?.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${
                data.trade_idea.direction === 'long' || data.trade_idea.direction === 'buy' ? 
                  'text-terminal-green bg-terminal-green/10 border-terminal-green/20' :
                data.trade_idea.direction === 'short' || data.trade_idea.direction === 'sell' ?
                  'text-terminal-red bg-terminal-red/10 border-terminal-red/20' :
                  'text-terminal-accent bg-terminal-accent/10 border-terminal-accent/20'
              } font-mono-tabular`}>
                {data.trade_idea.direction === 'long' || data.trade_idea.direction === 'buy' ? '↑ LONG (BUY)' : 
                 data.trade_idea.direction === 'short' || data.trade_idea.direction === 'sell' ? '↓ SHORT (SELL)' : 
                 data.trade_idea.direction?.toUpperCase()}
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

      {/* Raw Quantitative Metrics - Z-score, Alpha, Sharpe, etc. */}
      {includeQuantSignals && quantMetrics && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              QUANTITATIVE METRICS • RAW DATA
            </CardTitle>
            <p className="text-xs font-mono-tabular text-terminal-secondary mt-2">
              Live calculated metrics from quant-data function • Refreshes with each analysis
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              {/* Technical Indicators */}
              <div>
                <div className="text-xs font-mono-tabular text-terminal-accent mb-3 font-bold">TECHNICAL INDICATORS</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quantMetrics.rsi14 !== undefined && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">RSI (14)</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.rsi14, 2)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.ema20 !== undefined && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 20</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.ema20, 2)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.ema50 !== undefined && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">EMA 50</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.ema50, 2)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.atr14 !== undefined && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ATR (14)</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.atr14, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistical Measures */}
              <div>
                <div className="text-xs font-mono-tabular text-terminal-accent mb-3 font-bold">STATISTICAL MEASURES</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quantMetrics.zscore20 !== undefined && quantMetrics.zscore20 !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">Z-SCORE (20)</div>
                      <div className={`text-lg font-mono-tabular font-bold ${
                        Math.abs(quantMetrics.zscore20) > 2 ? 'text-terminal-red' :
                        Math.abs(quantMetrics.zscore20) > 1 ? 'text-terminal-accent' :
                        'text-terminal-green'
                      }`}>
                        {safeFormatNumber(quantMetrics.zscore20, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.vol20_annual !== undefined && quantMetrics.vol20_annual !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VOLATILITY (20D)</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.vol20_annual, 2)}%
                      </div>
                    </div>
                  )}
                  {quantMetrics.variance !== undefined && quantMetrics.variance !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VARIANCE</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.variance, 2)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.std_dev !== undefined && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">STD DEV</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.std_dev, 2)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.skewness !== undefined && quantMetrics.skewness !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SKEWNESS</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.skewness, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.kurtosis !== undefined && quantMetrics.kurtosis !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">KURTOSIS</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.kurtosis, 3)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk-Adjusted Returns */}
              <div>
                <div className="text-xs font-mono-tabular text-terminal-accent mb-3 font-bold">RISK-ADJUSTED RETURNS</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quantMetrics.sharpe_ratio !== undefined && quantMetrics.sharpe_ratio !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SHARPE RATIO</div>
                      <div className={`text-lg font-mono-tabular font-bold ${
                        quantMetrics.sharpe_ratio > 1 ? 'text-terminal-green' :
                        quantMetrics.sharpe_ratio > 0 ? 'text-terminal-accent' :
                        'text-terminal-red'
                      }`}>
                        {safeFormatNumber(quantMetrics.sharpe_ratio, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.sortino_ratio !== undefined && quantMetrics.sortino_ratio !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">SORTINO RATIO</div>
                      <div className={`text-lg font-mono-tabular font-bold ${
                        quantMetrics.sortino_ratio > 1 ? 'text-terminal-green' :
                        quantMetrics.sortino_ratio > 0 ? 'text-terminal-accent' :
                        'text-terminal-red'
                      }`}>
                        {safeFormatNumber(quantMetrics.sortino_ratio, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.calmar_ratio !== undefined && quantMetrics.calmar_ratio !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">CALMAR RATIO</div>
                      <div className={`text-lg font-mono-tabular font-bold ${
                        quantMetrics.calmar_ratio > 1 ? 'text-terminal-green' :
                        quantMetrics.calmar_ratio > 0 ? 'text-terminal-accent' :
                        'text-terminal-red'
                      }`}>
                        {safeFormatNumber(quantMetrics.calmar_ratio, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.information_ratio !== undefined && quantMetrics.information_ratio !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">INFO RATIO</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.information_ratio, 3)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Market Exposure */}
              <div>
                <div className="text-xs font-mono-tabular text-terminal-accent mb-3 font-bold">MARKET EXPOSURE</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quantMetrics.alpha !== undefined && quantMetrics.alpha !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ALPHA</div>
                      <div className={`text-lg font-mono-tabular font-bold ${
                        quantMetrics.alpha > 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}>
                        {safeFormatNumber(quantMetrics.alpha, 4)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.beta !== undefined && quantMetrics.beta !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BETA</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.beta, 3)}
                      </div>
                    </div>
                  )}
                  {quantMetrics.max_drawdown !== undefined && quantMetrics.max_drawdown !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">MAX DRAWDOWN</div>
                      <div className="text-lg font-mono-tabular text-terminal-red font-bold">
                        {safeFormatNumber(quantMetrics.max_drawdown, 2)}%
                      </div>
                    </div>
                  )}
                  {quantMetrics.vwap !== undefined && quantMetrics.vwap !== null && (
                    <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                      <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">VWAP</div>
                      <div className="text-lg font-mono-tabular text-terminal-foreground font-bold">
                        {safeFormatNumber(quantMetrics.vwap, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Text Section */}
      {data.analysis && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">ANALYSIS SUMMARY</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm font-mono leading-relaxed text-terminal-foreground whitespace-pre-wrap">
              {data.analysis}
            </p>
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