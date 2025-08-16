// Collect candles currently plotted for AI analysis
export type LWBar = { 
  time: number; 
  open: number; 
  high: number; 
  low: number; 
  close: number; 
  volume?: number; 
};

export function collectBarsForAnalysis(allBars: LWBar[], maxBars = 500) {
  // Take the last N bars to cap token usage
  const bars = allBars.slice(-maxBars);
  return bars.map(b => ({
    t: b.time, 
    o: +b.open, 
    h: +b.high, 
    l: +b.low, 
    c: +b.close, 
    v: +(b.volume ?? 0)
  }));
}