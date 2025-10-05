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

      {/* Quick Stats Grid - Technical Indicators */}
      {data.technical && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent flex items-center gap-2">
              <Activity className="h-4 w-4" />
              TECHNICAL INDICATORS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
              {data.technical.atr14 !== undefined && (
                <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">ATR (14)</div>
                  <div className="text-lg font-mono-tabular text-terminal-foreground">
                    {data.technical.atr14.toFixed(4)}
                  </div>
                </div>
              )}
              {data.technical.bb?.middle !== undefined && (
                <div className="bg-terminal-darker/50 p-3 border border-terminal-border/30">
                  <div className="text-xs font-mono-tabular text-terminal-secondary mb-1">BB MIDDLE</div>
                  <div className="text-lg font-mono-tabular text-terminal-foreground">
                    {data.technical.bb.middle.toFixed(2)}
                  </div>
                </div>
              )}
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

      {/* Evidence & Signals */}
      {data.evidence && Array.isArray(data.evidence) && data.evidence.length > 0 && (
        <Card className="bg-terminal border-terminal-border">
          <CardHeader className="bg-terminal-darker border-b border-terminal-border pb-3">
            <CardTitle className="text-sm font-mono-tabular text-terminal-accent">EVIDENCE & SIGNALS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {data.evidence.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-terminal-darker/30 border-l-2 border-terminal-accent">
                  <div className="text-xs font-mono-tabular text-terminal-accent mt-0.5">•</div>
                  <div className="text-xs font-mono text-terminal-foreground flex-1">{item}</div>
                </div>
              ))}
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
            <div className="space-y-2">
              {data.chartPatterns.map((item: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-terminal-darker/30 border-l-2 border-terminal-accent">
                  <div className="text-xs font-mono-tabular text-terminal-accent mt-0.5">•</div>
                  <div className="text-xs font-mono text-terminal-foreground flex-1">{item}</div>
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