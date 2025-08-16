export interface TechnicalIndicators {
  rsi: number[];
  ema12: number[];
  ema26: number[];
  macd: number[];
  macdSignal: number[];
  macdHistogram: number[];
}

export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  
  if (prices.length < period + 1) {
    return new Array(prices.length).fill(50);
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial gains and losses
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Fill initial values
  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }

  // Calculate RSI for remaining values
  for (let i = period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }

  return rsi;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  
  if (prices.length === 0) return ema;

  const multiplier = 2 / (period + 1);
  
  // First EMA value is the first price
  ema.push(prices[0]);

  // Calculate remaining EMA values
  for (let i = 1; i < prices.length; i++) {
    const emaValue = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(emaValue);
  }

  return ema;
}

export function calculateMACD(prices: number[]): { 
  macd: number[], 
  signal: number[], 
  histogram: number[] 
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macd: number[] = [];
  
  // Calculate MACD line (EMA12 - EMA26)
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macd.push(ema12[i] - ema26[i]);
  }

  // Calculate Signal line (9-period EMA of MACD)
  const signal = calculateEMA(macd, 9);
  
  // Calculate Histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
    histogram.push(macd[i] - signal[i]);
  }

  return { macd, signal, histogram };
}

export function calculateAllIndicators(prices: number[]): TechnicalIndicators {
  const rsi = calculateRSI(prices);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(prices);

  return {
    rsi,
    ema12,
    ema26,
    macd,
    macdSignal,
    macdHistogram
  };
}