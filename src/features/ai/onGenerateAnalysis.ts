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

  // 3) Call backend to analyze (do NOT call OpenAI from browser)
  const res = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/ai-generate-analysis', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, asset: assetClass, timeframe, ohlcv, snapshotBase64 })
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {}

  if (json?.analysis) return json.analysis; // prefer analysis even if status != 200

  if (!res.ok) throw new Error(json?.error || `Analysis failed (${res.status})`);
  throw new Error("Analysis failed");
}