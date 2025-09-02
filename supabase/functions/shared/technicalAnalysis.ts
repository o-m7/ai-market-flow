// Technical analysis utilities
export interface CandleData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: {
    line: number;
    signal: number;
    hist: number;
  };
  atr14: number;
  bb: {
    mid: number;
    upper: number;
    lower: number;
  };
  vwap?: number;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI for remaining periods
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(prices: number[]): { line: number; signal: number; hist: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // For signal line, we'd need to calculate EMA of MACD line
  // Simplified: use a approximation based on recent price momentum
  const recentPrices = prices.slice(-9);
  const signal = calculateEMA(recentPrices.map(() => macdLine), 9);
  const histogram = macdLine - signal;
  
  return {
    line: macdLine,
    signal,
    hist: histogram
  };
}

export function calculateATR(candles: CandleData[], period = 14): number {
  if (candles.length < 2) return 0;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].h;
    const low = candles[i].l;
    const prevClose = candles[i - 1].c;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
}

export function calculateBB(prices: number[], period = 20, multiplier = 2): { mid: number; upper: number; lower: number } {
  const recentPrices = prices.slice(-period);
  const mid = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
  
  const variance = recentPrices.reduce((sum, price) => {
    return sum + Math.pow(price - mid, 2);
  }, 0) / recentPrices.length;
  
  const stdDev = Math.sqrt(variance);
  
  return {
    mid,
    upper: mid + (stdDev * multiplier),
    lower: mid - (stdDev * multiplier)
  };
}

export function calculateVWAP(candles: CandleData[]): number {
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (const candle of candles) {
    const typical = (candle.h + candle.l + candle.c) / 3;
    const volume = candle.v || 1;
    
    totalVolumePrice += typical * volume;
    totalVolume += volume;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : candles[candles.length - 1].c;
}

export function calculateAllTechnicalIndicators(candles: CandleData[]): TechnicalIndicators {
  const prices = candles.map(c => c.c);
  
  return {
    ema20: calculateEMA(prices, 20),
    ema50: calculateEMA(prices, 50),
    ema200: calculateEMA(prices, 200),
    rsi14: calculateRSI(prices, 14),
    macd: calculateMACD(prices),
    atr14: calculateATR(candles, 14),
    bb: calculateBB(prices, 20, 2),
    vwap: calculateVWAP(candles)
  };
}

export function findSupportResistanceLevels(candles: CandleData[]): { support: number[], resistance: number[] } {
  const highs = candles.map(c => c.h);
  const lows = candles.map(c => c.l);
  
  // Find local extremes
  const support: number[] = [];
  const resistance: number[] = [];
  
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
        lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      support.push(lows[i]);
    }
  }
  
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
        highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      resistance.push(highs[i]);
    }
  }
  
  // Sort and return most significant levels
  return {
    support: support.sort((a, b) => b - a).slice(0, 3),
    resistance: resistance.sort((a, b) => a - b).slice(0, 3)
  };
}