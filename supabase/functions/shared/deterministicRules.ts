// Deterministic rules and thresholds for ai-analyze
export const THRESHOLDS = {
  // RSI levels
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,
  RSI_BULLISH_MIN: 35,
  RSI_BEARISH_MIN: 65,
  
  // MACD levels
  MACD_BULLISH_MIN: 0.00005,
  MACD_BEARISH_MAX: -0.00005,
  
  // ATR-based level proximity
  LEVEL_PROXIMITY_ATR_MULTIPLIER: 0.15,
  
  // Stop/target multipliers
  STOP_ATR_MULTIPLIER: 0.25,
  TARGET1_ATR_MULTIPLIER: 1,
  TARGET2_ATR_MULTIPLIER: 2,
  
  // Risk-reward minimum
  MIN_RR_RATIO: 1.5,
  
  // Volatility gates
  HIGH_ATR_PERCENTILE: 0.8,
  LOW_ATR_PERCENTILE: 0.2,
  ATR_VOLATILITY_MULTIPLIER: 1.5,
  
  // Spread gates
  WIDE_SPREAD_PERCENTILE: 0.8,
  
  // Order flow imbalance
  IMBALANCE_STRONG_BUY_MAX: 0.35,
  IMBALANCE_STRONG_SELL_MIN: 0.65,
  
  // Stale data threshold
  STALE_THRESHOLD_MS: 1500,
  
  // Confidence calculation
  BASE_CONFIDENCE: 50,
  CONFLUENCE_BONUS: 10,
  MAX_CONFLUENCE_BONUS: 30,
  CONFLICT_PENALTY: 10,
  HIGH_ATR_PENALTY: 15,
  MAX_CONFIDENCE: 88,
  MIN_CONFIDENCE: 1
} as const;

export const LOOKBACK_PERIODS = {
  scalp: 100,    // 1m-15m
  intraday: 150, // 30m-4h  
  swing: 200     // 1D-1W
} as const;

export const SESSIONS = {
  ASIA: { start: 22, end: 8 },    // 22:00-08:00 UTC
  LONDON: { start: 8, end: 16 },  // 08:00-16:00 UTC
  NY: { start: 13, end: 21 }      // 13:00-21:00 UTC
} as const;

export function round5(n: number): number {
  return Number(n.toFixed(5));
}

export function getSessionUTC(date: Date): "Asia" | "London" | "NY" {
  const hour = date.getUTCHours();
  
  if (hour >= SESSIONS.ASIA.start || hour < SESSIONS.ASIA.end) {
    return "Asia";
  } else if (hour >= SESSIONS.LONDON.start && hour < SESSIONS.LONDON.end) {
    return "London";
  } else {
    return "NY";
  }
}

export function getTimeframeType(tf: string): "scalp" | "intraday" | "swing" {
  const timeframe = tf.toLowerCase();
  
  if (timeframe.includes('m') || timeframe === '15' || timeframe === '5' || timeframe === '1') {
    return "scalp";
  } else if (timeframe.includes('h') || timeframe === '30' || timeframe === '60' || timeframe === '240') {
    return "intraday";
  } else {
    return "swing";
  }
}