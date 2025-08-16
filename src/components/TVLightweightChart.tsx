import { useEffect, useRef } from 'react';
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
  CandlestickSeries
} from 'lightweight-charts';
import type { LWBar } from '../lib/marketData';
import { fetchCandles, fetchQuote } from '../lib/marketData';

type Props = {
  symbol: string;                // e.g., "AAPL", "X:BTCUSD", "C:EURUSD"
  tf?: '1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d';
  height?: number;
  theme?: 'light'|'dark';
  series?: 'candles'|'line'|'area';
  live?: boolean;
};

export default function TVLightweightChart({ symbol, tf='1m', height=420, theme='light', series='candles', live=true }: Props) {
  const ref = useRef<HTMLDivElement|null>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const lastBar = useRef<LWBar|undefined>();

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
        
        if (series === 'candles') {
          seriesRef.current.setData(data);
        } else {
          seriesRef.current.setData(data.map(b => ({ time: b.time as Time, value: b.close })));
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

          if (series === 'candles') {
            seriesRef.current.update(patched);
          } else {
            seriesRef.current.update({ time: patched.time as Time, value: patched.close });
          }
        } catch (error) {
          console.error('Live update error:', error);
        }
      }, 1000);
    }

    return () => {
      if (tickTimer) clearInterval(tickTimer);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [symbol, tf, height, theme, series, live]);

  return <div ref={ref} style={{ width:'100%', height }} />;
}