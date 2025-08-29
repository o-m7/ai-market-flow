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
  const [chartMeta, setChartMeta] = useState<any>(null);

// Function to detect asset type
const getAssetType = (symbol: string): 'STOCK' | 'CRYPTO' | 'FOREX' => {
  const s = symbol.toUpperCase();

  // Known forex pairs (expanded)
  const FOREX_SET = new Set([
    'EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD',
    'EURGBP','EURJPY','GBPJPY','AUDJPY','EURCHF','GBPCHF','CHFJPY',
    'CADJPY','EURAUD','GBPAUD','AUDCHF','NZDJPY','EURCAD','GBPCAD',
    'AUDCAD','EURNZD','GBPNZD','USDSEK','USDNOK','USDDKK','EURSEK',
    'EURNOK','GBPSEK'
  ]);
  if (FOREX_SET.has(s)) return 'FOREX';

  // Common crypto tickers
  const isCrypto = (
    s.includes('BTC') || s.includes('ETH') || s.includes('BNB') || s.includes('XRP') ||
    s.includes('ADA') || s.includes('SOL') || s.includes('DOT') || s.includes('MATIC') ||
    s.includes('AVAX') || s.includes('LINK') || s.includes('UNI') || s.includes('ATOM') ||
    s.includes('ALGO') || s.includes('VET') || s.includes('ICP') || s.includes('FIL') ||
    s.includes('THETA') || s.includes('TRX') || s.includes('ETC') || s.includes('XMR') ||
    s.includes('BCH') || s.includes('LTC') || s.includes('DOGE') || s.includes('SHIB') ||
    s.includes('NEAR') || s.includes('FTM') || s.includes('SAND') || s.includes('MANA') ||
    s.includes('CRV') || s.includes('AAVE')
  );
  if (isCrypto) return 'CRYPTO';

  return 'STOCK';
};

// Fetch chart data and notify parent with rate limiting
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Convert timeframe for API with asset-specific adjustments
        const assetType = getAssetType(symbol);
        
        console.log(`Fetching ${assetType} data for ${symbol} (${timeframe} timeframe)`);
        
        const response = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol,
            timeframe: timeframe === 'D' ? '1d' : (timeframe === '240' ? '4h' : `${timeframe}m`),
            asset: assetType.toLowerCase(),
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
          
          console.log(`Loaded ${bars.length} ${assetType} candles for ${symbol}`);
          console.log(`Data meta: ${data.meta || 'N/A'}`);
          console.log(`Last price: ${data.lastClose} @ ${data.lastTimeUTC}`);
          
          setChartData(bars);
          onDataChange?.(bars);
          
          // Store metadata for data verification
          setChartMeta({
            provider: data.provider,
            providerSymbol: data.providerSymbol,
            asset: data.asset,
            timeframe: data.timeframe,
            source: data.source,
            lastClose: data.lastClose,
            lastTimeUTC: data.lastTimeUTC,
            prevClose: data.prevClose,
            prevTime: data.prevTime,
            snapshotLastTrade: data.snapshotLastTrade,
            snapshotTimeUTC: data.snapshotTimeUTC,
            isDelayed: data.isLikelyDelayed,
            meta: data.meta
          });
        } else {
          console.warn(`No chart data available for ${symbol}`);
          setChartData([]);
          onDataChange?.([]);
          setChartMeta(null);
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


  // Live meta (barLast & snapshot) refresher every 3 seconds
  useEffect(() => {
    let active = true;

    const fetchMetaOnly = async () => {
      try {
        const assetType = getAssetType(symbol);
        const response = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: symbol,
            timeframe: timeframe === 'D' ? '1d' : (timeframe === '240' ? '4h' : `${timeframe}m`),
            asset: assetType.toLowerCase(),
            limit: 2,
            lite: true
          })
        });
        const data = await response.json();
        if (!active) return;
        if (data) {
          setChartMeta({
            provider: data.provider,
            providerSymbol: data.providerSymbol,
            asset: data.asset,
            timeframe: data.timeframe,
            source: data.source,
            lastClose: data.lastClose,
            lastTimeUTC: data.lastTimeUTC,
            prevClose: data.prevClose,
            prevTime: data.prevTime,
            snapshotLastTrade: data.snapshotLastTrade,
            snapshotTimeUTC: data.snapshotTimeUTC,
            isDelayed: data.isLikelyDelayed,
            meta: data.meta
          });
        }
      } catch (_) {
        // no-op
      }
    };

    fetchMetaOnly();
    const id = setInterval(fetchMetaOnly, 3000);
    return () => { active = false; clearInterval(id); };
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
          {/* Data verification echo */}
          {chartMeta && (
            <div className="px-4 py-2 bg-muted/50 border-b text-xs text-muted-foreground font-mono space-y-1">
              <div>
                <span className="font-semibold">{chartMeta.providerSymbol}</span> • {chartMeta.timeframe} • 
                <span className="text-green-600">barLast={chartMeta.lastClose}</span> @ {chartMeta.lastTimeUTC?.slice(0, -5)}Z
              </div>
              <div>
                <span className="text-blue-600">prevClose={chartMeta.prevClose ?? 'N/A'}</span> @ {chartMeta.prevTime?.slice(0, -5)}Z • 
                <span className="text-purple-600">snapshotTrade={chartMeta.snapshotLastTrade ?? 'N/A'}</span> @ {chartMeta.snapshotTimeUTC?.slice(0, -5)}Z
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">source: {chartMeta.source || 'unknown'}</span>
                {chartMeta.isDelayed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    May be delayed 15min
                  </span>
                )}
              </div>
            </div>
          )}
          
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