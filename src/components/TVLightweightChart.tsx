import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  Time,
  ISeriesApi,
  CandlestickData,
  LineData,
  LineSeries,
  AreaSeries,
  CandlestickSeries,
  IPriceLine
} from 'lightweight-charts';
import type { LWBar } from '../lib/marketData';
import { fetchCandles, fetchQuote } from '../lib/marketData';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react';

type Props = {
  symbol: string;                // e.g., "AAPL", "X:BTCUSD", "C:EURUSD"
  tf?: '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d';
  height?: number;
  theme?: 'light'|'dark';
  series?: 'candles'|'line'|'area';
  live?: boolean;
  onDataChange?: (data: LWBar[]) => void;
  tradingOverlays?: {
    entry?: number;
    stop?: number;
    targets?: number[];
    horizontalLines?: Array<{
      price: number;
      label: string;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    }>;
  };
  riskBadges?: Array<{
    type: 'EVENT_RISK' | 'HIGH_VOL' | 'SPREAD_WIDE' | 'STALE_DATA';
    active: boolean;
    reason?: string;
  }>;
};

export default function TVLightweightChart({ 
  symbol, 
  tf='1m', 
  height=420, 
  theme='dark', 
  series='candles', 
  live=true, 
  onDataChange,
  tradingOverlays,
  riskBadges 
}: Props) {
  const ref = useRef<HTMLDivElement|null>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const lastBar = useRef<LWBar|undefined>();
  const dataRef = useRef<LWBar[]>([]);
  const overlayLinesRef = useRef<IPriceLine[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const chart = createChart(ref.current, {
      height,
      layout: { 
        background: { type: ColorType.Solid, color: theme==='dark' ? '#0b0f14' : '#fff' }, 
        textColor: theme==='dark' ? '#e5e7eb' : '#111' 
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, secondsVisible: tf.endsWith('m') },
      grid: { 
        vertLines: { color: theme==='dark' ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' }, 
        horzLines: { color: theme==='dark' ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)' } 
      }
    });
    chartRef.current = chart;

    // Create series based on type using correct v5 API
    if (series === 'candles') {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
    } else if (series === 'area') {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineWidth: 2,
        topColor: 'rgba(38,166,154,.4)',
        bottomColor: 'rgba(38,166,154,.05)',
        lineColor: '#26a69a'
      });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        lineWidth: 2,
        color: '#26a69a'
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
        const data = await fetchCandles(symbol, tf);
        lastBar.current = data.at(-1);
        dataRef.current = data;
        onDataChange?.(data);
        
        if (series === 'candles') {
          seriesRef.current.setData(data);
        } else {
          seriesRef.current.setData(data.map(b => ({ time: b.time as Time, value: b.close })));
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
    })();

    // Live updates - tick every second to update current bar
    let tickTimer: NodeJS.Timeout | null = null;
    
    // Full refresh every 30 seconds to capture completed candles
    let refreshTimer: NodeJS.Timeout | null = null;
    
    if (live) {
      // Update current bar every second with live price
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

          // Patch last element in dataRef and notify parent
          if (dataRef.current.length > 0) {
            dataRef.current[dataRef.current.length - 1] = patched;
            onDataChange?.([...dataRef.current]);
          }

          if (series === 'candles') {
            seriesRef.current.update(patched);
          } else {
            seriesRef.current.update({ time: patched.time as Time, value: patched.close });
          }
        } catch (error) {
          console.error('Live update error:', error);
        }
      }, 1000);

      // Refresh full dataset every 30 seconds to get completed candles
      refreshTimer = setInterval(async () => {
        try {
          console.log(`[Live Refresh] Fetching fresh candles for ${symbol}`);
          const freshData = await fetchCandles(symbol, tf);
          lastBar.current = freshData.at(-1);
          dataRef.current = freshData;
          onDataChange?.(freshData);
          
          if (series === 'candles') {
            seriesRef.current.setData(freshData);
          } else {
            seriesRef.current.setData(freshData.map(b => ({ time: b.time as Time, value: b.close })));
          }
        } catch (error) {
          console.error('Live refresh error:', error);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (tickTimer) clearInterval(tickTimer);
      if (refreshTimer) clearInterval(refreshTimer);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        overlayLinesRef.current = [];
      }
    };
  }, [symbol, tf, height, theme, series, live]);

  // Add trading overlays when they change
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !tradingOverlays) return;

    // Clear existing overlay lines
    overlayLinesRef.current.forEach(line => {
      seriesRef.current?.removePriceLine(line);
    });
    overlayLinesRef.current = [];

    // Add horizontal lines from trading overlays
    if (tradingOverlays.horizontalLines) {
      tradingOverlays.horizontalLines.forEach(line => {
        const priceLine = seriesRef.current!.createPriceLine({
          price: line.price,
          color: line.color,
          lineWidth: 2,
          lineStyle: line.style === 'dashed' ? 1 : line.style === 'dotted' ? 2 : 0,
          axisLabelVisible: true,
          title: line.label,
        });
        overlayLinesRef.current.push(priceLine);
      });
    }

  }, [tradingOverlays]);

  // Fetch AI analysis for risk badges and overlays
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`https://ifetofkhyblyijghuwzs.functions.supabase.co/ai-chart-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, timeframe: tf })
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalysisData(data);
        }
      } catch (error) {
        console.error('Failed to fetch AI analysis:', error);
      }
    };

    if (live) {
      fetchAnalysis();
      const interval = setInterval(fetchAnalysis, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [symbol, tf, live]);

  const getRiskBadgeIcon = (type: string) => {
    switch (type) {
      case 'EVENT_RISK': return <AlertTriangle className="h-3 w-3" />;
      case 'HIGH_VOL': return <TrendingUp className="h-3 w-3" />;
      case 'STALE_DATA': return <Clock className="h-3 w-3" />;
      case 'SPREAD_WIDE': return <Zap className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getRiskBadgeColor = (type: string) => {
    switch (type) {
      case 'EVENT_RISK': return 'destructive';
      case 'HIGH_VOL': return 'secondary';
      case 'STALE_DATA': return 'outline';
      case 'SPREAD_WIDE': return 'secondary';
      default: return 'secondary';
    }
  };

  const activeBadges = riskBadges?.filter(badge => badge.active) || 
                      analysisData?.riskBadges?.filter((badge: any) => badge.active) || [];

  return (
    <div className="relative">
      <div ref={ref} style={{ width:'100%', height }} />
      
      {/* Risk badges overlay */}
      {activeBadges.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[200px]">
          {activeBadges.map((badge: any, index: number) => (
            <Badge
              key={index}
              variant={getRiskBadgeColor(badge.type) as any}
              className="text-xs flex items-center gap-1"
              title={badge.reason}
            >
              {getRiskBadgeIcon(badge.type)}
              {badge.type.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}