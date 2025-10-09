// src/features/ai/Result.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, Target, Shield, Brain, BarChart3, Activity, Calculator } from "lucide-react";
import { SymbolNews } from "@/components/SymbolNews";

interface InstitutionalAnalysis {
  summary: string;
  action: 'buy' | 'sell' | 'hold';
  action_text: string;
  outlook: 'bullish' | 'bearish' | 'neutral';
  news_impact?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact_level: 'high' | 'medium' | 'low';
    key_factors: string[];
    headline_count: number;
  };
  market_structure?: {
    trend_direction: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    market_phase: 'trending' | 'range_bound' | 'consolidation' | 'breakout';
    volatility_regime: 'low' | 'normal' | 'high' | 'extreme';
    session_context: string;
  };
  levels: { 
    support: number[]; 
    resistance: number[]; 
    vwap?: number | null;
  };
  fibonacci: {
    pivot_high: number; pivot_low: number;
    retracements: { "23.6": number; "38.2": number; "50.0": number; "61.8": number; };
    direction: 'up' | 'down';
  };
  trade_idea: {
    direction: 'long' | 'short' | 'none';
    entry: number; stop: number; targets: number[];
    rationale: string;
    time_horizon: 'scalp' | 'intraday' | 'swing' | 'position';
    rr_estimate: number;
  };
  technical: {
    ema20: number; ema50: number; ema200: number;
    rsi14: number;
    macd: { 
      line: number; signal: number; hist: number;
    };
    atr14: number;
    bb: { 
      mid: number; upper: number; lower: number;
    };
  };
  confidence_model: number;
  confidence_calibrated: number;
  evidence: string[];
  risks: string;
  analyzed_at?: string;
  json_version?: string;
  _inputs?: { technical_used?: { lastClose?: number } };
}

/* ---------- Safe helpers ---------- */
const safeUpper = (v: unknown, fb = "—") => (typeof v === "string" ? v.toUpperCase() : fb);
const safeText  = (v: unknown, fb = "—") => (typeof v === "string" && v.trim() ? v : fb);
const safeNum   = (v: unknown, digits = 4, fb = "—") => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : fb;
};
const isInstitutionalShape = (d: any) =>
  d && typeof d === "object" && !("error" in d) && d.fibonacci && d.technical && typeof d.confidence_calibrated !== "undefined";

interface AiResultProps {
  data: any;
  symbol?: string;
}

export function AiResult({ data, symbol }: AiResultProps) {
  if (!data) return null;

  const isInstitutional = isInstitutionalShape(data);

  if (!isInstitutional) {
    const outlook = data?.technicalIndicators?.trend || data?.outlook || "neutral";
    const confidence = Number(data?.confidence ?? 50);
    const summary = data?.analysis || data?.summary || "Analysis not available";
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

  const analysis = data as InstitutionalAnalysis;

  const getActionColor = (action?: string) => {
    switch (action) {
      case "buy":  return "bg-green-500 text-white hover:bg-green-600";
      case "sell": return "bg-red-500 text-white hover:bg-red-600";
      default:     return "bg-yellow-500 text-white hover:bg-yellow-600";
    }
  };
  
  const getActionIcon = (action?: string) => {
    switch (action) {
      case "buy":  return <TrendingUp className="h-4 w-4" />;
      case "sell": return <TrendingDown className="h-4 w-4" />;
      default:     return <Minus className="h-4 w-4" />;
    }
  };
  
  const formatPrice = (p: unknown) => safeNum(p, 4, "0.0000");

  const supports = Array.isArray(analysis?.levels?.support) ? analysis.levels.support : [];
  const resistances = Array.isArray(analysis?.levels?.resistance) ? analysis.levels.resistance : [];
  const vwap = analysis?.levels?.vwap ?? null;
  const currentPrice = (data?._inputs?.technical_used?.lastClose as number) ?? undefined;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button className={getActionColor(analysis?.action)} size="sm">
                {getActionIcon(analysis?.action)}
                {safeUpper(analysis?.action)}
              </Button>
              <Badge variant="outline" className="font-mono">
                {safeUpper(analysis?.outlook)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                Model: {safeNum(analysis?.confidence_model, 0, "—")}%
              </Badge>
              <Badge variant="default">
                <Shield className="h-3 w-3 mr-1" />
                Calibrated: {safeNum(analysis?.confidence_calibrated, 0, "—")}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-medium text-sm">{safeText(analysis?.action_text)}</p>
          <p className="text-sm text-muted-foreground mt-2">{safeText(analysis?.summary)}</p>
        </CardContent>
      </Card>

      {/* News Impact Section */}
      {analysis?.news_impact && (
        <Card className={`border-2 ${
          analysis.news_impact.impact_level === 'high' ? 'bg-primary/5 border-primary' :
          analysis.news_impact.impact_level === 'medium' ? 'bg-accent/5 border-accent' :
          'bg-muted/5 border-border'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              News Impact Analysis
              <Badge variant="outline" className="ml-auto">
                {safeUpper(analysis.news_impact.impact_level)} Impact
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">SENTIMENT</p>
                <Badge variant={
                  analysis.news_impact.sentiment === 'bullish' ? 'default' :
                  analysis.news_impact.sentiment === 'bearish' ? 'destructive' : 'secondary'
                }>
                  {safeUpper(analysis.news_impact.sentiment)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">HEADLINES</p>
                <p className="font-mono text-sm">{analysis.news_impact.headline_count} articles</p>
              </div>
            </div>
            {analysis.news_impact.key_factors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">KEY FACTORS</p>
                <ul className="space-y-1">
                  {analysis.news_impact.key_factors.map((factor, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Structure Analysis */}
      {analysis?.market_structure && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Structure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">TREND</p>
                <Badge variant="outline" className="mt-1">
                  {safeUpper(analysis.market_structure.trend_direction?.replace('_', ' '))}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">PHASE</p>
                <Badge variant="outline" className="mt-1">
                  {safeUpper(analysis.market_structure.market_phase?.replace('_', ' '))}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">VOLATILITY</p>
                <Badge variant="outline" className="mt-1">
                  {safeUpper(analysis.market_structure.volatility_regime)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">SESSION</p>
                <p className="text-xs mt-1">{safeText(analysis.market_structure.session_context)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Trade Setup */}
      {analysis?.trade_idea?.direction !== "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI Trade Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">ENTRY</p>
                <p className="font-mono text-sm">{formatPrice(analysis?.trade_idea?.entry)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">STOP</p>
                <p className="font-mono text-sm text-red-600">{formatPrice(analysis?.trade_idea?.stop)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">TARGETS</p>
                <p className="font-mono text-sm text-green-600">
                  {Array.isArray(analysis?.trade_idea?.targets) && analysis.trade_idea.targets.length
                    ? analysis.trade_idea.targets.map((t) => formatPrice(t)).join(", ")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">R:R</p>
                <p className="font-mono text-sm">{safeNum(analysis?.trade_idea?.rr_estimate, 1, "—")}:1</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">RATIONALE</p>
              <p className="text-sm">{safeText(analysis?.trade_idea?.rationale)}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{safeUpper(analysis?.trade_idea?.time_horizon)}</Badge>
              <Badge variant="outline">{safeUpper(analysis?.trade_idea?.direction)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Technical Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Technical Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="font-medium">Current Price</p>
                <p className="font-mono text-xs">{currentPrice !== undefined ? formatPrice(currentPrice) : "—"}</p></div>
              <div><p className="font-medium">EMA 20</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.ema20)}</p></div>
              <div><p className="font-medium">EMA 50</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.ema50)}</p></div>
              <div><p className="font-medium">EMA 200</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.ema200)}</p></div>
              <div><p className="font-medium">RSI (14)</p><p className="font-mono text-xs">{safeNum(analysis?.technical?.rsi14, 1, "50.0")}</p></div>
              <div><p className="font-medium">MACD Line</p><p className="font-mono text-xs">{safeNum(analysis?.technical?.macd?.line, 4, "0.0000")}</p></div>
              <div><p className="font-medium">MACD Signal</p><p className="font-mono text-xs">{safeNum(analysis?.technical?.macd?.signal, 4, "0.0000")}</p></div>
              <div><p className="font-medium">MACD Hist</p><p className="font-mono text-xs">{safeNum(analysis?.technical?.macd?.hist, 4, "0.0000")}</p></div>
              <div><p className="font-medium">ATR (14)</p><p className="font-mono text-xs">{safeNum(analysis?.technical?.atr14, 4, "0.0000")}</p></div>
              <div><p className="font-medium">BB Mid</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.bb?.mid)}</p></div>
              <div><p className="font-medium">BB Upper</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.bb?.upper)}</p></div>
              <div><p className="font-medium">BB Lower</p><p className="font-mono text-xs">{formatPrice(analysis?.technical?.bb?.lower)}</p></div>
              <div><p className="font-medium">VWAP</p><p className="font-mono text-xs">{vwap === null || vwap === undefined ? "—" : formatPrice(vwap)}</p></div>
            </div>
          </CardContent>
        </Card>


        {/* Enhanced Key Levels & Fibonacci */}
        <Card>
          <CardHeader><CardTitle>Enhanced Levels & Fibonacci</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Support</p>
                <p className="font-mono text-xs text-green-600">
                  {supports.length ? supports.map((s) => formatPrice(s)).join(", ") : "N/A"}
                </p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Resistance</p>
                <p className="font-mono text-xs text-red-600">
                  {resistances.length ? resistances.map((r) => formatPrice(r)).join(", ") : "N/A"}
                </p>
              </div>
              {(vwap !== null && vwap !== undefined) && (
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">VWAP</p>
                  <p className="font-mono text-xs text-blue-600">{formatPrice(vwap)}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="font-medium text-sm mb-2">
                Fibonacci Analysis ({safeUpper(analysis?.fibonacci?.direction)})
              </p>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>Pivot High: {formatPrice(analysis?.fibonacci?.pivot_high)}</div>
                  <div>Pivot Low: {formatPrice(analysis?.fibonacci?.pivot_low)}</div>
                </div>
                <div className="mt-2">
                  <p className="font-medium mb-1">Retracements:</p>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <div>23.6%: {formatPrice(analysis?.fibonacci?.retracements?.["23.6"])}</div>
                    <div>38.2%: {formatPrice(analysis?.fibonacci?.retracements?.["38.2"])}</div>
                    <div>50.0%: {formatPrice(analysis?.fibonacci?.retracements?.["50.0"])}</div>
                    <div>61.8%: {formatPrice(analysis?.fibonacci?.retracements?.["61.8"])}</div>
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
            {Array.isArray(analysis?.evidence) && analysis.evidence.length ? (
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
            <p className="text-sm">{safeText(analysis?.risks)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Symbol-Specific News Section */}
      {symbol && <SymbolNews symbol={symbol} />}

      <div className="text-xs text-muted-foreground text-center">
        AI-Powered Analysis • Version {safeText((data as any)?.json_version, "3.0.0")} • Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}