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
  onSymbolChange 
}: Props) {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const widgetRef = useRef<any>(null);
  
  const [timeframe, setTimeframe] = useState<'1'|'5'|'15'|'30'|'60'|'240'|'D'>(tf);
  const [showIndicators, setShowIndicators] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize TradingView widget
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create new widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = `${height}px`;
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';

    widgetContainer.appendChild(widgetDiv);
    containerRef.current.appendChild(widgetContainer);

    // Configure widget
    const config = {
      autosize: true,
      symbol: symbol,
      interval: timeframe,
      timezone: "Etc/UTC",
      theme: theme === 'dark' ? 'dark' : 'light',
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: true,
      save_image: false,
      studies: showIndicators ? [
        "RSI@tv-basicstudies",
        "MACD@tv-basicstudies", 
        "EMA@tv-basicstudies"
      ] : [],
      container_id: widgetDiv,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      calendar: true,
      studies_overrides: {},
      overrides: {
        "paneProperties.background": theme === 'dark' ? "#0b0f14" : "#ffffff",
        "paneProperties.vertGridProperties.color": theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
        "paneProperties.horzGridProperties.color": theme === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": theme === 'dark' ? "#e5e7eb" : "#111111",
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.drawWick": true,
        "mainSeriesProperties.candleStyle.drawBorder": true,
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
      }
    };

    // Create script tag with configuration
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      new TradingView.widget(${JSON.stringify(config)});
    `;

    widgetDiv.appendChild(script);
    widgetRef.current = widgetContainer;

  }, [scriptLoaded, symbol, timeframe, height, theme, showIndicators]);

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
            style={{ width: '100%', height: `${height}px` }}
            className="tradingview-chart-container"
          />
        </div>
        
        {!scriptLoaded && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading TradingView Chart...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}