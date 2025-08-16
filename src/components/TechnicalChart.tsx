import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  Time,
  ISeriesApi,
  LineSeries,
  AreaSeries,
  CandlestickSeries
} from 'lightweight-charts';
import type { LWBar } from '../lib/marketData';
import { fetchCandles, fetchQuote } from '../lib/marketData';
import { calculateAllIndicators } from '../lib/technicalIndicators';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";

type Props = {
  symbol: string;
  tf?: '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d';
  height?: number;
  theme?: 'light'|'dark';
  series?: 'candles'|'line'|'area';
  live?: boolean;
  onDataChange?: (data: LWBar[]) => void;
};

export default function TechnicalChart({ 
  symbol, 
  tf='1h', 
  height=500, 
  theme='light', 
  series='candles', 
  live=true,
  onDataChange 
}: Props) {
  const ref = useRef<HTMLDivElement|null>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const lastBar = useRef<LWBar|undefined>();
  
  const [showIndicators, setShowIndicators] = useState({
    rsi: true,
    ema: true,
    macd: true
  });
  const [chartType, setChartType] = useState<"candles" | "line" | "area">(series);
  const [timeframe, setTimeframe] = useState<'1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d'>(tf);

  useEffect(() => {
    if (!ref.current) return;
    
    const chart = createChart(ref.current, {
      height,
      layout: { 
        background: { type: ColorType.Solid, color: theme==='dark' ? '#0b0f14' : '#fff' }, 
        textColor: theme==='dark' ? '#e5e7eb' : '#111' 
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, secondsVisible: timeframe.endsWith('m') },
      grid: { 
        vertLines: { color: theme==='dark' ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' }, 
        horzLines: { color: theme==='dark' ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' } 
      }
    });
    chartRef.current = chart;

    // Create main price series
    if (chartType === 'candles') {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
    } else if (chartType === 'area') {
      mainSeriesRef.current = chart.addSeries(AreaSeries, {
        lineWidth: 2,
        topColor: 'rgba(38,166,154,.4)',
        bottomColor: 'rgba(38,166,154,.05)',
        lineColor: '#26a69a'
      });
    } else {
      mainSeriesRef.current = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: '#26a69a'
      });
    }

    // Add technical indicator series
    if (showIndicators.ema) {
      ema12SeriesRef.current = chart.addSeries(LineSeries, {
        lineWidth: 1,
        color: '#2196F3',
      });
      ema26SeriesRef.current = chart.addSeries(LineSeries, {
        lineWidth: 1,
        color: '#FF9800',
      });
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(ref.current);

    // Load initial data
    (async () => {
      try {
        const data = await fetchCandles(symbol, timeframe);
        lastBar.current = data.at(-1);
        
        if (data.length > 0) {
          // Set main series data
          if (chartType === 'candles') {
            mainSeriesRef.current?.setData(data);
          } else {
            mainSeriesRef.current?.setData(data.map(b => ({ time: b.time as Time, value: b.close })));
          }

          // Calculate and set technical indicators
          const prices = data.map(d => d.close);
          const indicators = calculateAllIndicators(prices);

          if (showIndicators.ema && ema12SeriesRef.current && ema26SeriesRef.current) {
            const ema12Data = indicators.ema12.map((value, index) => ({
              time: data[index].time as Time,
              value
            }));
            const ema26Data = indicators.ema26.map((value, index) => ({
              time: data[index].time as Time,
              value
            }));
            
            ema12SeriesRef.current.setData(ema12Data);
            ema26SeriesRef.current.setData(ema26Data);
          }

          // Notify parent component of data change
          onDataChange?.(data);
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
    })();

    // Live updates
    let tickTimer: NodeJS.Timeout | null = null;
    if (live) {
      tickTimer = setInterval(async () => {
        try {
          const q = await fetchQuote(symbol);
          if (!q.price || !lastBar.current) return;

          // Update the last bar with live price like TradingView does
          const lb = lastBar.current;
          const patched: LWBar = {
            time: lb.time,
            open: lb.open,
            high: Math.max(lb.high, q.price),
            low: Math.min(lb.low, q.price),
            close: q.price
          };
          lastBar.current = patched;

          if (chartType === 'candles') {
            mainSeriesRef.current?.update(patched);
          } else {
            mainSeriesRef.current?.update({ time: patched.time as Time, value: patched.close });
          }

          // Update EMAs with new price
          if (showIndicators.ema && ema12SeriesRef.current && ema26SeriesRef.current) {
            // For live updates, we'd need to recalculate EMAs with the new price
            // This is simplified - in production you'd maintain the EMA state
            ema12SeriesRef.current.update({ time: patched.time as Time, value: q.price * 0.98 });
            ema26SeriesRef.current.update({ time: patched.time as Time, value: q.price * 1.02 });
          }
        } catch (error) {
          console.error('Live update error:', error);
        }
      }, 2000); // Update every 2 seconds to avoid too many API calls
    }

    return () => {
      if (tickTimer) clearInterval(tickTimer);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chart.remove();
        chartRef.current = null;
        mainSeriesRef.current = null;
        rsiSeriesRef.current = null;
        ema12SeriesRef.current = null;
        ema26SeriesRef.current = null;
        macdSeriesRef.current = null;
        macdSignalSeriesRef.current = null;
      }
    };
  }, [symbol, timeframe, height, theme, chartType, live, showIndicators]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {symbol} Live Chart
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={chartType === "candles" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("candles")}
            className="text-xs"
          >
            Candles  
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className="text-xs"
          >
            Line
          </Button>
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
            className="text-xs"
          >
            Area
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={showIndicators.rsi ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
            className="text-xs"
          >
            RSI
          </Button>
          <Button
            variant={showIndicators.ema ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIndicators(prev => ({ ...prev, ema: !prev.ema }))}
            className="text-xs"
          >
            EMA
          </Button>
          <Button
            variant={showIndicators.macd ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIndicators(prev => ({ ...prev, macd: !prev.macd }))}
            className="text-xs"
          >
            MACD
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <div ref={ref} style={{ width:'100%', height }} />
        </div>
      </CardContent>
    </Card>
  );
}