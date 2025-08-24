import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, Target, Shield, Brain, BarChart3, Activity } from "lucide-react";

interface InstitutionalAnalysis {
  summary: string;
  action: 'buy' | 'sell' | 'hold';
  action_text: string;
  outlook: 'bullish' | 'bearish' | 'neutral';
  levels: {
    support: number[];
    resistance: number[];
    vwap?: number | null;
  };
  fibonacci: {
    pivot_high: number;
    pivot_low: number;
    retracements: {
      "23.6": number;
      "38.2": number;
      "50.0": number;
      "61.8": number;
      "78.6": number;
    };
    extensions: {
      "127.2": number;
      "161.8": number;
    };
    direction: 'up' | 'down';
  };
  trade_idea: {
    direction: 'long' | 'short' | 'none';
    entry: number;
    stop: number;
    targets: number[];
    rationale: string;
    time_horizon: 'scalp' | 'intraday' | 'swing' | 'position';
    setup_type: 'breakout' | 'pullback' | 'mean_reversion' | 'range' | 'other';
    rr_estimate: number;
  };
  technical: {
    ema20: number;
    ema50: number;
    ema200: number;
    rsi14: number;
    macd: { line: number; signal: number; hist: number };
    atr14: number;
    bb: { mid: number; upper: number; lower: number };
  };
  confidence_model: number;
  confidence_calibrated: number;
  evidence: string[];
  risks: string;
  timeframe_profile: {
    scalp: { entry: number; stop: number; targets: number[] };
    intraday: { entry: number; stop: number; targets: number[] };
    swing: { entry: number; stop: number; targets: number[] };
  };
}

export function AiResult({ data }: { data: any }) {
  if (!data) return null;
  
  // Handle both new institutional format and legacy format
  const isInstitutional = data.fibonacci && data.technical && data.confidence_calibrated !== undefined;
  
  if (!isInstitutional) {
    // Legacy format fallback
    const outlook = data.technicalIndicators?.trend || data.outlook || 'neutral';
    const confidence = data.confidence || 50;
    const summary = data.analysis || data.summary || 'Analysis not available';
    
    return (
      <Card className="ai-analysis-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Technical Analysis</span>
            <Badge variant="secondary">{Math.round(confidence)}% Confidence</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </CardContent>
      </Card>
    );
  }

  // New institutional format
  const analysis = data as InstitutionalAnalysis;
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'sell':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const formatPrice = (price: number) => price?.toFixed(4) || '0.0000';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button className={getActionColor(analysis.action)} size="sm">
                {getActionIcon(analysis.action)}
                {analysis.action.toUpperCase()}
              </Button>
              <Badge variant="outline" className="font-mono">
                {analysis.outlook.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                Model: {analysis.confidence_model}%
              </Badge>
              <Badge variant="default">
                <Shield className="h-3 w-3 mr-1" />
                Calibrated: {analysis.confidence_calibrated}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-medium text-sm">{analysis.action_text}</p>
          <p className="text-sm text-muted-foreground mt-2">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Trade Setup */}
      {analysis.trade_idea?.direction !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Trade Setup - {analysis.trade_idea.setup_type.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">ENTRY</p>
                <p className="font-mono text-sm">{formatPrice(analysis.trade_idea.entry)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">STOP</p>
                <p className="font-mono text-sm text-red-600">{formatPrice(analysis.trade_idea.stop)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">TARGET</p>
                <p className="font-mono text-sm text-green-600">
                  {analysis.trade_idea.targets?.map(t => formatPrice(t)).join(', ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">R:R</p>
                <p className="font-mono text-sm">{analysis.trade_idea.rr_estimate?.toFixed(1)}:1</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">RATIONALE</p>
              <p className="text-sm">{analysis.trade_idea.rationale}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{analysis.trade_idea.time_horizon.toUpperCase()}</Badge>
              <Badge variant="outline">{analysis.trade_idea.direction.toUpperCase()}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium">EMA 20</p>
                <p className="font-mono text-xs">{formatPrice(analysis.technical.ema20)}</p>
              </div>
              <div>
                <p className="font-medium">EMA 50</p>
                <p className="font-mono text-xs">{formatPrice(analysis.technical.ema50)}</p>
              </div>
              <div>
                <p className="font-medium">EMA 200</p>
                <p className="font-mono text-xs">{formatPrice(analysis.technical.ema200)}</p>
              </div>
              <div>
                <p className="font-medium">RSI (14)</p>
                <p className="font-mono text-xs">{analysis.technical.rsi14?.toFixed(1) || '50.0'}</p>
              </div>
              <div>
                <p className="font-medium">MACD Line</p>
                <p className="font-mono text-xs">{analysis.technical.macd?.line?.toFixed(4) || '0.0000'}</p>
              </div>
              <div>
                <p className="font-medium">MACD Signal</p>
                <p className="font-mono text-xs">{analysis.technical.macd?.signal?.toFixed(4) || '0.0000'}</p>
              </div>
              <div>
                <p className="font-medium">ATR (14)</p>
                <p className="font-mono text-xs">{analysis.technical.atr14?.toFixed(4) || '0.0000'}</p>
              </div>
              <div>
                <p className="font-medium">BB Mid</p>
                <p className="font-mono text-xs">{formatPrice(analysis.technical.bb?.mid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Levels & Fibonacci */}
        <Card>
          <CardHeader>
            <CardTitle>Key Levels & Fibonacci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Support/Resistance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Support</p>
                <p className="font-mono text-xs text-green-600">
                  {analysis.levels.support?.map(s => formatPrice(s)).join(', ') || 'N/A'}
                </p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Resistance</p>
                <p className="font-mono text-xs text-red-600">
                  {analysis.levels.resistance?.map(r => formatPrice(r)).join(', ') || 'N/A'}
                </p>
              </div>
              {analysis.levels.vwap && (
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">VWAP</p>
                  <p className="font-mono text-xs text-blue-600">{formatPrice(analysis.levels.vwap)}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Fibonacci */}
            <div>
              <p className="font-medium text-sm mb-2">
                Fibonacci ({analysis.fibonacci.direction.toUpperCase()})
              </p>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>Pivot High: {formatPrice(analysis.fibonacci.pivot_high)}</div>
                  <div>Pivot Low: {formatPrice(analysis.fibonacci.pivot_low)}</div>
                </div>
                <div className="mt-2">
                  <p className="font-medium mb-1">Retracements:</p>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <div>23.6%: {formatPrice(analysis.fibonacci.retracements["23.6"])}</div>
                    <div>38.2%: {formatPrice(analysis.fibonacci.retracements["38.2"])}</div>
                    <div>50.0%: {formatPrice(analysis.fibonacci.retracements["50.0"])}</div>
                    <div>61.8%: {formatPrice(analysis.fibonacci.retracements["61.8"])}</div>
                    <div>78.6%: {formatPrice(analysis.fibonacci.retracements["78.6"])}</div>
                  </div>
                  <p className="font-medium mt-2 mb-1">Extensions:</p>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <div>127.2%: {formatPrice(analysis.fibonacci.extensions["127.2"])}</div>
                    <div>161.8%: {formatPrice(analysis.fibonacci.extensions["161.8"])}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence & Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Evidence & Confluences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.evidence?.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {analysis.evidence.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No specific confluences identified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{analysis.risks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeframe Profiles */}
      {analysis.timeframe_profile && (
        <Card>
          <CardHeader>
            <CardTitle>Multi-Timeframe Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analysis.timeframe_profile).map(([tf, profile]) => (
                <div key={tf} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize">{tf}</h4>
                  <div className="text-xs space-y-1 font-mono">
                    <div>Entry: {formatPrice(profile.entry)}</div>
                    <div>Stop: {formatPrice(profile.stop)}</div>
                    <div>Targets: {profile.targets?.map(t => formatPrice(t)).join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Institutional Analysis • Version {data.json_version || '1.0.0'} • Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}