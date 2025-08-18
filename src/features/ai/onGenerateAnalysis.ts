export async function onGenerateAnalysis({ 
  chart, 
  seriesData, 
  symbol, 
  assetClass, 
  timeframe 
}: {
  chart: any;                       // TradingView/Lightweight chart ref
  seriesData: { t:number;o:number;h:number;l:number;c:number;v:number }[]; // SAME data used to render chart
  symbol: string;                   // e.g. "XRP/USD", "AAPL", "EUR/USD"
  assetClass: "crypto"|"stock"|"forex";
  timeframe: "1m"|"5m"|"15m"|"30m"|"1h"|"4h"|"1d";
}) {
  // 1) Snapshot (WEBP), fallback to null if unsupported
  let snapshotBase64: string | null = null;
  try {
    const canvas = chart?.takeScreenshot?.();
    if (canvas?.toDataURL) snapshotBase64 = canvas.toDataURL("image/webp", 0.85);
  } catch {}

  // 2) Use EXACT candles you render on the chart (last 150)
  const ohlcv = (seriesData || []).slice(-150);

  // 3) Fetch Finnhub fundamental data for stocks
  let finnhubData = null;
  if (assetClass === "stock") {
    try {
      const finnhubRes = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/finnhub-data', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          symbol, 
          asset: assetClass, 
          dataType: "all" // Get profile, metrics, and financials
        })
      });
      
      if (finnhubRes.ok) {
        const finnhubResult = await finnhubRes.json();
        if (finnhubResult.success) {
          finnhubData = finnhubResult.data;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Finnhub data:', error);
      // Continue without fundamental data
    }
  }

  // 4) Call backend to analyze (do NOT call OpenAI from browser)
  const res = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/ai-generate-analysis', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, asset: assetClass, timeframe, ohlcv, snapshotBase64, finnhubData })
  });

  const json = await res.json();
  if (!res.ok || !json?.analysis) throw new Error(json?.error || "Analysis failed");
  return json.analysis; // strict JSON
}