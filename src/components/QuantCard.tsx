import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Gauge, Activity, TrendingUp, TrendingDown, Waves, LineChart, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Types matching the backend JSON contract
interface QuantResponse {
  symbol: string;
  tf: string;
  asOf: string;
  price: number;
  prevClose: number | null;
  ema: Record<string, number>;
  rsi14: number;
  macd: { line: number; signal: number; hist: number };
  bb20: { mid: number; upper: number; lower: number };
  atr14: number;
  donchian20: { high: number; low: number };
  vol20_annual: number | null;
  zscore20: number | null;
  vwap?: number | null;
  tail?: { t: number; c: number }[];
  summary?: string;
}

const TF_OPTIONS = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "1d", label: "1d" },
];

function useQuant(symbol: string, tf: string, withSummary: boolean) {
  const [data, setData] = useState<QuantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOnce(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'quant-data',
        {
          body: { symbol, tf, withSummary }
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setData(response);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchOnce(ctrl.signal);
    return () => ctrl.abort();
  }, [symbol, tf, withSummary]);

  return { data, loading, error, refetch: () => fetchOnce() };
}

function prettyPct(x: number) {
  const s = (x * 100).toFixed(2);
  return `${Number(s)}%`;
}

function formatPrice(n?: number | null) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n);
}

function formatTime(ts?: string) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function StatRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default function QuantCard({ symbol: initialSymbol = "BTCUSD" }: { symbol?: string }) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [tf, setTf] = useState("1h");
  const [withSummary, setWithSummary] = useState(false);
  const { data, loading, error, refetch } = useQuant(symbol, tf, withSummary);

  const change = useMemo(() => {
    if (!data?.prevClose || !data?.price) return null;
    return (data.price / data.prevClose) - 1;
  }, [data?.price, data?.prevClose]);

  const up = (change ?? 0) >= 0;

  const chartData = useMemo(() => {
    if (!data?.tail) return [];
    return data.tail.map(p => ({
      t: new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      c: p.c,
    }));
  }, [data?.tail]);

  return (
    <Card className="w-full max-w-6xl mx-auto border rounded-2xl shadow-sm">
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="w-40" placeholder="Symbol" />
            <Select value={tf} onValueChange={setTf}>
              <SelectTrigger className="w-28"><SelectValue placeholder="TF" /></SelectTrigger>
              <SelectContent>
                {TF_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Last price</div>
              <div className="text-2xl font-semibold tabular-nums">{formatPrice(data?.price)}</div>
            </div>
            <Badge variant={up ? "default" : "destructive"} className="text-sm">
              {change === null ? "—" : (
                <span className="flex items-center gap-1">
                  {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {prettyPct(change!)}
                </span>
              )}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Summary</span>
              <Switch checked={withSummary} onCheckedChange={setWithSummary} />
            </div>
          </div>
        </div>

        {/* Status / errors */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton className="h-24 w-full rounded-xl" />
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <div className="flex items-center gap-2 text-amber-600 text-sm"><AlertTriangle className="h-4 w-4" />{error}</div>
        )}

        {/* Sparkline */}
        {chartData.length > 0 && (
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="qGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip formatter={(v: any) => formatPrice(v)} labelFormatter={() => ""} />
                <Area type="monotone" dataKey="c" stroke="currentColor" fill="url(#qGradient)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Indicators grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IndicatorCard title="Trend (EMA)" icon={<LineChart className="h-4 w-4" />}
            items={[
              { k: "EMA20", v: data?.ema?.["20"] },
              { k: "EMA50", v: data?.ema?.["50"] },
              { k: "EMA200", v: data?.ema?.["200"] },
            ]}
          />

          <IndicatorCard title="Momentum" icon={<Activity className="h-4 w-4" />}
            items={[
              { k: "RSI14", v: data?.rsi14 },
              { k: "MACD line", v: data?.macd?.line },
              { k: "MACD signal", v: data?.macd?.signal },
              { k: "MACD hist", v: data?.macd?.hist },
            ]}
          />

          <IndicatorCard title="Volatility" icon={<Waves className="h-4 w-4" />}
            items={[
              { k: "ATR14", v: data?.atr14 },
              { k: "BB mid", v: data?.bb20?.mid },
              { k: "BB upper", v: data?.bb20?.upper },
              { k: "BB lower", v: data?.bb20?.lower },
            ]}
          />

          <IndicatorCard title="Breakouts" icon={<Gauge className="h-4 w-4" />}
            items={[
              { k: "Donchian High", v: data?.donchian20?.high },
              { k: "Donchian Low", v: data?.donchian20?.low },
            ]}
          />

          <IndicatorCard title="Regime & Stats" icon={<TrendingUp className="h-4 w-4" />}
            items={[
              { k: "Realized Vol 20d (ann)", v: data?.vol20_annual },
              { k: "Z-Score 20", v: data?.zscore20 },
            ]}
          />

          {data?.vwap !== undefined && (
            <IndicatorCard title="VWAP (session)" icon={<LineChart className="h-4 w-4" />}
              items={[{ k: "VWAP", v: data?.vwap }]}
            />
          )}
        </div>

        {/* Summary */}
        {withSummary && data?.summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border p-4 bg-muted/30">
            <div className="text-sm font-medium mb-1">Model Summary</div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{data.summary}</div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>Timeframe: <span className="font-medium">{data?.tf || tf}</span> • Updated: {formatTime(data?.asOf)}</div>
          <div>Source: Polygon OHLCV • Indicators computed on server</div>
        </div>
      </CardContent>
    </Card>
  );
}

function IndicatorCard({ title, icon, items }: { title: string; icon?: React.ReactNode; items: { k: string; v: number | null | undefined }[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <StatRow key={it.k} label={it.k} value={formatPrice(it.v ?? null)} />
        ))}
      </div>
    </motion.div>
  );
}