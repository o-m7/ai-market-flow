// src/features/ai/Result.tsx
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
  levels: { support: number[]; resistance: number[]; vwap?: number | null };
  fibonacci: {
    pivot_high: number; pivot_low: number;
    retracements: { "23.6": number; "38.2": number; "50.0": number; "61.8": number; "78.6": number; };
    extensions: { "127.2": number; "161.8": number; };
    direction: 'up' | 'down';
  };
  trade_idea: {
    direction: 'long' | 'short' | 'none';
    entry: number; stop: number; targets: number[];
    rationale: string;
    time_horizon: 'scalp' | 'intraday' | 'swing' | 'position';
    setup_type: 'breakout' | 'pullback' | 'mean_reversion' | 'range' | 'other';
    rr_estimate: number;
  };
  technical: {
    ema20: number; ema50: number; ema200: number;
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

export function AiResult({ data }: { data: any }) {
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

      {/* Trade Setup */}
      {analysis?.trade_idea?.direction !== "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Trade Setup — {safeUpper(analysis?.trade_idea?.setup_type?.replace?.("_", " "))}
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
                <p className="text-xs font-medium text-muted-foreground">TARGET</p>
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
              <div><p className="font-medium">VWAP (30)</p><p className="font-mono text-xs">{vwap === null || vwap === undefined ? "—" : formatPrice(vwap)}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Key Levels & Fibonacci */}
        <Card>
          <CardHeader><CardTitle>Key Levels & Fibonacci</CardTitle></CardHeader>
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
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">VWAP</p>
                  <p className="font-mono text-xs text-blue-600">{formatPrice(vwap)}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="font-medium text-sm mb-2">
                Fibonacci ({safeUpper(analysis?.fibonacci?.direction)})
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
                    <div>78.6%: {formatPrice(analysis?.fibonacci?.retracements?.["78.6"])}</div>
                  </div>
                  <p className="font-medium mt-2 mb-1">Extensions:</p>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <div>127.2%: {formatPrice(analysis?.fibonacci?.extensions?.["127.2"])}</div>
                    <div>161.8%: {formatPrice(analysis?.fibonacci?.extensions?.["161.8"])}</div>
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

      {/* Timeframe Profiles */}
      {analysis?.timeframe_profile && (
        <Card>
          <CardHeader><CardTitle>Multi-Timeframe Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analysis.timeframe_profile).map(([tf, profile]: any) => (
                <div key={tf} className="space-y-2">
                  <h4 className="font-medium text-sm capitalize">{tf}</h4>
                  <div className="text-xs space-y-1 font-mono">
                    <div>Entry: {formatPrice(profile?.entry)}</div>
                    <div>Stop: {formatPrice(profile?.stop)}</div>
                    <div>Targets: {Array.isArray(profile?.targets) && profile.targets.length
                      ? profile.targets.map((t: any) => formatPrice(t)).join(", ")
                      : "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Institutional Analysis • Version {safeText((data as any)?.json_version, "1.0.0")} • Generated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
