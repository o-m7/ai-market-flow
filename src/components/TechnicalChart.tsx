import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";

type Props = {
  symbol: string;
  tf?: '1'|'5'|'15'|'30'|'60'|'240'|'D';
  height?: number;
  theme?: 'light'|'dark';
  live?: boolean;
  onSymbolChange?: (symbol: string) => void;
  onDataChange?: (data: LWBar[]) => void;
};

type LWBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TechnicalChart({ 
  symbol, 
  tf='60', 
  height=500, 
  theme='light', 
  live=true,
  onSymbolChange,
  onDataChange 
}: Props) {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const [timeframe, setTimeframe] = useState<'1'|'5'|'15'|'30'|'60'|'240'|'D'>(tf);
  const [showIndicators, setShowIndicators] = useState(true);
  const [chartData, setChartData] = useState<LWBar[]>([]);

  // Fetch chart data and notify parent
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Convert timeframe for API
        const { multiplier, timespan, from, to } = (() => {
          const now = new Date();
          const to = now.toISOString().slice(0, 10);
          const d = new Date(now);
          switch (timeframe) {
            case '1': d.setDate(now.getDate() - 2); return { multiplier: 1, timespan: 'minute', from: d.toISOString().slice(0,10), to };
            case '5': d.setDate(now.getDate() - 3); return { multiplier: 5, timespan: 'minute', from: d.toISOString().slice(0,10), to };
            case '15': d.setDate(now.getDate() - 7); return { multiplier: 15, timespan: 'minute', from: d.toISOString().slice(0,10), to };
            case '30': d.setDate(now.getDate() - 14); return { multiplier: 30, timespan: 'minute', from: d.toISOString().slice(0,10), to };
            case '60': d.setDate(now.getDate() - 60); return { multiplier: 1, timespan: 'hour', from: d.toISOString().slice(0,10), to };
            case '240': d.setDate(now.getDate() - 120); return { multiplier: 4, timespan: 'hour', from: d.toISOString().slice(0,10), to };
            case 'D': d.setDate(now.getDate() - 365); return { multiplier: 1, timespan: 'day', from: d.toISOString().slice(0,10), to };
            default: return { multiplier: 1, timespan: 'hour', from: to, to };
          }
        })();

        const response = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol.toUpperCase(),
            timeframe: timeframe === 'D' ? '1d' : (timeframe === '240' ? '4h' : `${timeframe}m`),
            multiplier,
            timespan,
            from,
            to,
            limit: 500
          })
        });

        const data = await response.json();
        
        if (Array.isArray(data.candles) && data.candles.length > 0) {
          const bars: LWBar[] = data.candles.map((c: any) => ({
            time: Math.floor(c.t / 1000),
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
            volume: c.v ?? 0
          }));
          
          setChartData(bars);
          onDataChange?.(bars);
        } else {
          setChartData([]);
          onDataChange?.([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        onDataChange?.([]);
      }
    };

    fetchChartData();
    // Note: Intentionally exclude onDataChange to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);


  // Initialize TradingView widget using iframe approach
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create TradingView iframe
    const iframe = document.createElement('iframe');
    
    // Build the TradingView URL with parameters
    const baseUrl = 'https://s.tradingview.com/widgetembed/';
    const params = new URLSearchParams({
      frameElementId: 'tradingview_chart',
      symbol: symbol,
      interval: timeframe,
      hidesidetoolbar: '0',
      symboledit: '1',
      saveimage: '1',
      toolbarbg: 'F1F3F6',
      studies: showIndicators ? 'RSI@tv-basicstudies,MACD@tv-basicstudies,EMA@tv-basicstudies' : '',
      theme: theme,
      style: '1',
      timezone: 'Etc/UTC',
      withdateranges: '1',
      details: '1',
      hotlist: '1',
      calendar: '1',
      allow_symbol_change: 'true',
      referral_id: 'lovable',
      utm_source: 'localhost',
      utm_medium: 'widget_new',
      utm_campaign: 'chart',
      utm_term: symbol
    });

    iframe.src = `${baseUrl}?${params.toString()}`;
    iframe.width = '100%';
    iframe.height = `${height}px`;
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.frameBorder = '0';
    iframe.allow = 'fullscreen';
    
    containerRef.current.appendChild(iframe);

  }, [symbol, timeframe, theme, showIndicators, height]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {symbol} Live Chart - TradingView
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={showIndicators ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIndicators(!showIndicators)}
            className="text-xs"
          >
            Indicators
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["1", "5", "15", "30", "60", "240", "D"] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="text-xs"
            >
              {tf === "1" ? "1m" : tf === "5" ? "5m" : tf === "15" ? "15m" : tf === "30" ? "30m" : tf === "60" ? "1h" : tf === "240" ? "4h" : "1D"}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div 
            ref={containerRef} 
            style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}
            className="tradingview-chart-container"
          />
        </div>
      </CardContent>
    </Card>
  );
}