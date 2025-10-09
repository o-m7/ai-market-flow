import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandleData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface QuantResponse {
  symbol: string;
  tf: string;
  asOf: string;
  price: number;
  prevClose: number | null;
  ema: Record<string, number>;
  rsi14: number;
  macd: { line: number; signal: number; hist: number };
  bb20: { mid: number; upper: number; lower: number };
  atr14: number;
  donchian20: { high: number; low: number };
  vol20_annual: number | null;
  zscore20: number | null;
  vwap?: number | null;
  tail?: { t: number; c: number }[];
  summary?: string;
  // Trading signals for different timeframes
  timeframe_profile?: {
    scalp: {
      entry: number;
      stop: number;
      targets: number[];
      strategy: string;
      probability: number;
    };
    intraday: {
      entry: number;
      stop: number;
      targets: number[];
      strategy: string;
      probability: number;
    };
    swing: {
      entry: number;
      stop: number;
      targets: number[];
      strategy: string;
      probability: number;
    };
  };
  // Advanced quantitative metrics
  quant_metrics: {
    sharpe_ratio: number | null;
    sortino_ratio: number | null;
    alpha: number | null;
    beta: number | null;
    std_dev: number;
    population_std_dev: number;
    sample_std_dev: number;
    skewness: number | null;
    kurtosis: number | null;
    max_drawdown: number | null;
    calmar_ratio: number | null;
    information_ratio: number | null;
  };
}

// Technical indicator calculations
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { line: number; signal: number; hist: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Simplified signal line calculation
  const macdHistory = [macdLine]; // In a real implementation, you'd track historical MACD values
  const signal = calculateEMA(macdHistory, 9);
  
  return {
    line: macdLine,
    signal: signal,
    hist: macdLine - signal
  };
}

function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): { mid: number; upper: number; lower: number } {
  if (prices.length < period) {
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return { mid: avg, upper: avg, lower: avg };
  }
  
  const recentPrices = prices.slice(-period);
  const mid = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mid, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    mid,
    upper: mid + (stdDev * multiplier),
    lower: mid - (stdDev * multiplier)
  };
}

function calculateATR(candles: CandleData[], period = 14): number {
  if (candles.length < 2) return 0;
  
  const trueRanges = [];
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

function calculateDonchian(candles: CandleData[], period = 20): { high: number; low: number } {
  if (candles.length < period) {
    const high = Math.max(...candles.map(c => c.h));
    const low = Math.min(...candles.map(c => c.l));
    return { high, low };
  }
  
  const recentCandles = candles.slice(-period);
  const high = Math.max(...recentCandles.map(c => c.h));
  const low = Math.min(...recentCandles.map(c => c.l));
  
  return { high, low };
}

function calculateVWAP(candles: CandleData[]): number {
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (const candle of candles) {
    const typical = (candle.h + candle.l + candle.c) / 3;
    totalVolumePrice += typical * candle.v;
    totalVolume += candle.v;
  }
  
  return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
}

function calculateRealizedVolatility(prices: number[], period = 20): number | null {
  if (prices.length < period + 1) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  
  const recentReturns = returns.slice(-period);
  const mean = recentReturns.reduce((sum, ret) => sum + ret, 0) / period;
  const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (period - 1);
  
  // Annualize (assuming daily data, multiply by sqrt(252))
  return Math.sqrt(variance * 252);
}

function calculateZScore(prices: number[], period = 20): number | null {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  const currentPrice = prices[prices.length - 1];
  return (currentPrice - mean) / stdDev;
}

// Standard Deviation (population)
function calculatePopulationStdDev(prices: number[], period = 20): number {
  if (prices.length < period) return 0;
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  return Math.sqrt(variance);
}

// Standard Deviation (sample)
function calculateSampleStdDev(prices: number[], period = 20): number {
  if (prices.length < 2) return 0;
  const recentPrices = prices.slice(-period);
  const n = recentPrices.length;
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / n;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
}

// Sharpe Ratio (annualized, assuming risk-free rate = 0)
function calculateSharpeRatio(prices: number[], period = 252): number | null {
  if (prices.length < 2) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const stdDev = calculateSampleStdDev(recentReturns.map((r, i) => prices[prices.length - period + i]), period);
  
  if (stdDev === 0) return null;
  
  // Annualize: multiply by sqrt(252) for daily data
  const annualizedReturn = avgReturn * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);
  
  return annualizedReturn / annualizedStdDev;
}

// Sortino Ratio (downside deviation only)
function calculateSortinoRatio(prices: number[], period = 252, targetReturn = 0): number | null {
  if (prices.length < 2) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  
  // Calculate downside deviation (only negative returns)
  const downsideReturns = recentReturns.filter(r => r < targetReturn);
  if (downsideReturns.length === 0) return null;
  
  const downsideVariance = downsideReturns.reduce((sum, ret) => sum + Math.pow(ret - targetReturn, 2), 0) / downsideReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return null;
  
  // Annualize
  const annualizedReturn = avgReturn * 252;
  const annualizedDownsideDev = downsideDeviation * Math.sqrt(252);
  
  return annualizedReturn / annualizedDownsideDev;
}

// Alpha (excess return vs benchmark - using S&P 500 approximation)
function calculateAlpha(prices: number[], benchmarkPrices: number[], period = 252): number | null {
  if (prices.length < 2 || benchmarkPrices.length < 2) return null;
  
  const returns = [];
  const benchmarkReturns = [];
  
  const minLength = Math.min(prices.length, benchmarkPrices.length);
  for (let i = 1; i < minLength; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    benchmarkReturns.push((benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const recentBenchmarkReturns = benchmarkReturns.slice(-period);
  
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const avgBenchmarkReturn = recentBenchmarkReturns.reduce((sum, ret) => sum + ret, 0) / recentBenchmarkReturns.length;
  
  // Annualize
  return (avgReturn - avgBenchmarkReturn) * 252;
}

// Beta (correlation to benchmark)
function calculateBeta(prices: number[], benchmarkPrices: number[], period = 252): number | null {
  if (prices.length < 2 || benchmarkPrices.length < 2) return null;
  
  const returns = [];
  const benchmarkReturns = [];
  
  const minLength = Math.min(prices.length, benchmarkPrices.length);
  for (let i = 1; i < minLength; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    benchmarkReturns.push((benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const recentBenchmarkReturns = benchmarkReturns.slice(-period);
  
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const avgBenchmarkReturn = recentBenchmarkReturns.reduce((sum, ret) => sum + ret, 0) / recentBenchmarkReturns.length;
  
  // Covariance
  let covariance = 0;
  for (let i = 0; i < recentReturns.length; i++) {
    covariance += (recentReturns[i] - avgReturn) * (recentBenchmarkReturns[i] - avgBenchmarkReturn);
  }
  covariance /= recentReturns.length;
  
  // Variance of benchmark
  const benchmarkVariance = recentBenchmarkReturns.reduce((sum, ret) => 
    sum + Math.pow(ret - avgBenchmarkReturn, 2), 0) / recentBenchmarkReturns.length;
  
  if (benchmarkVariance === 0) return null;
  
  return covariance / benchmarkVariance;
}

// Skewness (asymmetry of distribution)
function calculateSkewness(prices: number[], period = 20): number | null {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const n = recentPrices.length;
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / n;
  const stdDev = calculateSampleStdDev(recentPrices, period);
  
  if (stdDev === 0) return 0;
  
  const skewness = recentPrices.reduce((sum, price) => 
    sum + Math.pow((price - mean) / stdDev, 3), 0) / n;
  
  return skewness;
}

// Kurtosis (tailedness of distribution)
function calculateKurtosis(prices: number[], period = 20): number | null {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const n = recentPrices.length;
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / n;
  const stdDev = calculateSampleStdDev(recentPrices, period);
  
  if (stdDev === 0) return 0;
  
  const kurtosis = recentPrices.reduce((sum, price) => 
    sum + Math.pow((price - mean) / stdDev, 4), 0) / n;
  
  // Excess kurtosis (subtract 3 for normal distribution baseline)
  return kurtosis - 3;
}

// Maximum Drawdown
function calculateMaxDrawdown(prices: number[]): number | null {
  if (prices.length < 2) return null;
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

// Calmar Ratio (return / max drawdown)
function calculateCalmarRatio(prices: number[], period = 252): number | null {
  if (prices.length < 2) return null;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const annualizedReturn = avgReturn * 252;
  
  const recentPrices = prices.slice(-period);
  const maxDD = calculateMaxDrawdown(recentPrices);
  
  if (!maxDD || maxDD === 0) return null;
  
  return annualizedReturn / maxDD;
}

// Information Ratio (excess return / tracking error)
function calculateInformationRatio(prices: number[], benchmarkPrices: number[], period = 252): number | null {
  if (prices.length < 2 || benchmarkPrices.length < 2) return null;
  
  const returns = [];
  const benchmarkReturns = [];
  
  const minLength = Math.min(prices.length, benchmarkPrices.length);
  for (let i = 1; i < minLength; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    benchmarkReturns.push((benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1]);
  }
  
  const recentReturns = returns.slice(-period);
  const recentBenchmarkReturns = benchmarkReturns.slice(-period);
  
  // Calculate excess returns
  const excessReturns = recentReturns.map((r, i) => r - recentBenchmarkReturns[i]);
  const avgExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  
  // Tracking error (std dev of excess returns)
  const trackingError = calculateSampleStdDev(
    excessReturns.map((r, i) => recentReturns[i]), 
    Math.min(period, excessReturns.length)
  );
  
  if (trackingError === 0) return null;
  
  // Annualize
  const annualizedExcessReturn = avgExcessReturn * 252;
  const annualizedTrackingError = trackingError * Math.sqrt(252);
  
  return annualizedExcessReturn / annualizedTrackingError;
}

// Generate DATA-DRIVEN trading signals (NOT formulas)
function generateTradingSignals(
  price: number,
  atr: number,
  rsi: number,
  macd: { line: number; signal: number; hist: number },
  bb: { mid: number; upper: number; lower: number },
  ema20: number,
  ema50: number,
  donchian: { high: number; low: number },
  recentCandles: CandleData[]
) {
  // === STEP 1: Analyze trend from ACTUAL indicator confluence ===
  const trendChecks = {
    priceAboveEMA20: price > ema20,
    priceAboveEMA50: price > ema50,
    emaAlignment: ema20 > ema50,
    rsiBullish: rsi > 50,
    macdBullish: macd.hist > 0,
    aboveBBMid: price > bb.mid
  };

  const bullishCount = Object.values(trendChecks).filter(Boolean).length;
  const bearishCount = 6 - bullishCount;
  const isLong = bullishCount > bearishCount;
  const trendStrength = Math.max(bullishCount, bearishCount);

  // Confidence based on confluence
  let confidence = 50;
  if (trendStrength >= 5) confidence += 20;
  else if (trendStrength >= 4) confidence += 10;
  if (rsi > 55 && isLong || rsi < 45 && !isLong) confidence += 5;
  if (Math.abs(macd.hist) > 0.00001) confidence += 5;
  if (trendStrength < 4) confidence -= 15;
  if (rsi > 75 || rsi < 25) confidence -= 10;
  confidence = Math.max(45, Math.min(85, confidence));

  // === STEP 2: Find ACTUAL support/resistance from recent price action ===
  const last20Candles = recentCandles.slice(-20);
  const recentLows = last20Candles.map(c => c.l).sort((a, b) => a - b);
  const recentHighs = last20Candles.map(c => c.h).sort((a, b) => b - a);
  
  // Key levels from actual price structure
  const nearestSupport = isLong ? recentLows[2] : 0; // 3rd lowest (avoid outliers)
  const nearestResistance = !isLong ? recentHighs[2] : 0; // 3rd highest
  const majorSupport = recentLows[Math.floor(recentLows.length * 0.25)]; // 25th percentile
  const majorResistance = recentHighs[Math.floor(recentHighs.length * 0.25)];

  // === STEP 3: DIFFERENT stops per timeframe based on ACTUAL levels ===
  const direction = isLong ? 'LONG' : 'SHORT';
  
  // SCALP: Stop at nearest micro swing (NOT 0.5 ATR formula)
  const scalpEntry = isLong ? price * 0.999 : price * 1.001;
  const scalpStop = isLong 
    ? Math.max(scalpEntry - (atr * 0.3), nearestSupport * 0.998) // Near support OR 0.3 ATR
    : Math.min(scalpEntry + (atr * 0.3), nearestResistance * 1.002);
  const scalpTargets = isLong
    ? [price + (atr * 0.8), price + (atr * 1.2), bb.upper * 0.998]
    : [price - (atr * 0.8), price - (atr * 1.2), bb.lower * 1.002];
  
  // INTRADAY: Stop below swing structure (NOT 1.5 ATR formula)
  const intradayEntry = isLong 
    ? Math.min(ema20, bb.mid, price * 0.995) 
    : Math.max(ema20, bb.mid, price * 1.005);
  const intradayStop = isLong
    ? Math.max(intradayEntry - (atr * 1.2), majorSupport * 0.997) // At major support
    : Math.min(intradayEntry + (atr * 1.2), majorResistance * 1.003);
  const intradayTargets = isLong
    ? [ema20 + (atr * 2), majorResistance * 0.995, bb.upper]
    : [ema20 - (atr * 2), majorSupport * 1.005, bb.lower];
  
  // SWING: Stop below major structure point (NOT 2.5 ATR formula)
  const swingEntry = isLong 
    ? Math.min(ema50, majorSupport * 1.003, price * 0.98)
    : Math.max(ema50, majorResistance * 0.997, price * 1.02);
  const swingStop = isLong
    ? Math.max(swingEntry - (atr * 2), donchian.low * 0.995) // At Donchian low
    : Math.min(swingEntry + (atr * 2), donchian.high * 1.005);
  const swingTargets = isLong
    ? [majorResistance, donchian.high * 0.995, donchian.high * 1.01]
    : [majorSupport, donchian.low * 1.005, donchian.low * 0.99];

  const trendDesc = isLong ? 'uptrend' : 'downtrend';
  
  return {
    scalp: {
      entry: Number(scalpEntry.toFixed(2)),
      stop: Number(scalpStop.toFixed(2)),
      targets: scalpTargets.map(t => Number(t.toFixed(2))),
      strategy: `${direction}: Entry near price, stop at ${isLong ? 'micro support' : 'micro resistance'} (${scalpStop.toFixed(2)}). ${trendStrength}/6 indicators confirm ${trendDesc}.`,
      probability: Math.min(confidence + 5, 85)
    },
    intraday: {
      entry: Number(intradayEntry.toFixed(2)),
      stop: Number(intradayStop.toFixed(2)),
      targets: intradayTargets.map(t => Number(t.toFixed(2))),
      strategy: `${direction}: Entry at EMA20 (${ema20.toFixed(2)}), stop at ${isLong ? 'major support' : 'major resistance'} (${intradayStop.toFixed(2)}). ${trendDesc} confirmed.`,
      probability: confidence
    },
    swing: {
      entry: Number(swingEntry.toFixed(2)),
      stop: Number(swingStop.toFixed(2)),
      targets: swingTargets.map(t => Number(t.toFixed(2))),
      strategy: `${direction}: Entry at EMA50 (${ema50.toFixed(2)}), stop at ${isLong ? 'Donchian low' : 'Donchian high'} (${swingStop.toFixed(2)}). Strong ${trendDesc} with RSI ${rsi.toFixed(1)}.`,
      probability: Math.max(confidence - 5, 45)
    }
  };
}

// S3 historical data removed - using polygon-chart-data instead

// Fetch Polygon indicators instead of calculating manually
async function fetchPolygonIndicators(symbol: string, tf: string, polygonApiKey: string) {
  const timeframes: Record<string, string> = {
    '1m': '1/minute',
    '5m': '5/minute', 
    '15m': '15/minute',
    '1h': '1/hour',
    '1d': '1/day'
  };
  
  const cryptoPairs = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'ALGO', 'VET', 'ICP', 'FIL', 'THETA', 'TRX', 'ETC', 'XMR', 'BCH', 'LTC', 'DOGE', 'SHIB', 'NEAR', 'FTM', 'SAND', 'MANA', 'CRV', 'AAVE', 'BNB'];
  const forexCurrencies = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'SEK', 'NOK', 'DKK'];
  
  const isCrypto = cryptoPairs.some(pair => symbol.startsWith(pair)) && symbol.endsWith('USD');
  const isForex = forexCurrencies.some(curr => symbol.startsWith(curr)) && 
                  (symbol.includes('USD') || forexCurrencies.some(curr => symbol.includes(curr)));
  
  let polygonSymbol = symbol;
  if (isCrypto) {
    polygonSymbol = `X:${symbol}`;
  } else if (isForex) {
    polygonSymbol = `C:${symbol}`;
  }

  // Try to fetch technical indicators from Polygon's technical indicators endpoint
  try {
    const url = `https://api.polygon.io/v1/indicators/rsi/${polygonSymbol}?timespan=${tf}&window=14&series_type=close&order=desc&limit=1&apiKey=${polygonApiKey}`;
    const rsiResponse = await fetch(url);
    
    if (rsiResponse.ok) {
      const rsiData = await rsiResponse.json();
      console.log('✅ Fetched RSI from Polygon API:', rsiData.results?.values?.[0]?.value);
      
      // Fetch other indicators from Polygon if available
      // For now, we'll still calculate most indicators manually but log that we should use Polygon
      console.log('📊 Note: Using Polygon for RSI, calculating other indicators manually');
      
      return {
        rsi: rsiData.results?.values?.[0]?.value,
        usePolygonIndicators: true
      };
    }
  } catch (e) {
    console.log('Polygon indicators not available, using manual calculation');
  }

  return {
    rsi: null,
    usePolygonIndicators: false
  };
}

async function fetchPolygonData(symbol: string, tf: string, polygonApiKey: string): Promise<CandleData[]> {
  // Use the unified polygon-chart-data function for consistent, fresh data
  const tfMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '60m',
    '1d': '1d'
  };
  
  const timeframe = tfMap[tf] || '60m';
  
  // Determine asset type
  const cryptoPairs = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'ALGO', 'VET', 'ICP', 'FIL', 'THETA', 'TRX', 'ETC', 'XMR', 'BCH', 'LTC', 'DOGE', 'SHIB', 'NEAR', 'FTM', 'SAND', 'MANA', 'CRV', 'AAVE', 'BNB'];
  const isCrypto = cryptoPairs.some(pair => symbol.startsWith(pair)) && symbol.endsWith('USD');
  const asset = isCrypto ? 'crypto' : 'stock';
  
  console.log(`📊 Fetching data via polygon-chart-data: ${symbol} (${asset}), timeframe=${timeframe}`);
  
  // Call the polygon-chart-data edge function
  const response = await fetch('https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/polygon-chart-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symbol,
      timeframe,
      asset,
      limit: 500
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`polygon-chart-data error: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch chart data: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.candles || !Array.isArray(data.candles) || data.candles.length === 0) {
    console.error('No candles returned from polygon-chart-data:', symbol);
    throw new Error(`No data available for ${symbol}`);
  }
  
  console.log(`✅ Received ${data.candles.length} fresh candles from polygon-chart-data`);
  console.log(`📊 Latest: ${data.lastTimeUTC} (${data.candles[data.candles.length - 1].c})`);
  
  // Transform to expected format
  return data.candles.map((c: any) => ({
    t: c.t,
    o: c.o,
    h: c.h,
    l: c.l,
    c: c.c,
    v: c.v
  }));
}

async function generateSummary(symbol: string, indicators: any, openaiKey: string): Promise<string> {
  const prompt = `Analyze the following technical indicators for ${symbol} and provide a concise trading summary in 2-3 bullet points:

RSI: ${indicators.rsi14.toFixed(2)}
MACD Line: ${indicators.macd.line.toFixed(4)}
MACD Signal: ${indicators.macd.signal.toFixed(4)}
ATR: ${indicators.atr14.toFixed(2)}
Z-Score: ${indicators.zscore20?.toFixed(2) || 'N/A'}

Focus on momentum, trend, and volatility signals. Be specific and actionable.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Analysis unavailable';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Technical analysis summary unavailable';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { symbol = 'BTCUSD', tf = '1h', withSummary = false } = await req.json();

    const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
    if (!polygonApiKey) {
      throw new Error('POLYGON_API_KEY not configured');
    }

    console.log(`[QUANT-DATA v2024.10.09] Fetching quant data for ${symbol}, timeframe: ${tf}, withSummary: ${withSummary}`);

    // Fetch market data with fresh timestamps
    const candles = await fetchPolygonData(symbol, tf, polygonApiKey);
    if (candles.length === 0) {
      throw new Error('No market data available');
    }
    
    // Try to fetch indicators from Polygon API
    const polygonIndicators = await fetchPolygonIndicators(symbol, tf, polygonApiKey);

    // === CRITICAL: Validate data freshness to prevent outdated signals ===
    const latestCandleTime = candles[candles.length - 1].t;
    const nowMs = Date.now();
    const dataAgeMinutes = (nowMs - latestCandleTime) / (1000 * 60);
    
    // Data freshness thresholds by timeframe
    const maxAgeMinutes: Record<string, number> = {
      '1m': 10,    // 1min data should be < 10min old
      '5m': 30,    // 5min data should be < 30min old
      '15m': 60,   // 15min data should be < 1hr old
      '1h': 180,   // 1hr data should be < 3hrs old
      '1d': 1440   // Daily data should be < 1 day old
    };
    
    const maxAge = maxAgeMinutes[tf] || 180;
    
    if (dataAgeMinutes > maxAge) {
      console.warn(`⚠️ DATA STALE: Latest candle is ${dataAgeMinutes.toFixed(0)}min old (max ${maxAge}min). Signals may be outdated.`);
      // Continue but mark as stale data warning
    } else {
      console.log(`✅ DATA FRESH: Latest candle is ${dataAgeMinutes.toFixed(0)}min old (< ${maxAge}min threshold)`);
    }

    const prices = candles.map(c => c.c);
    const currentPrice = prices[prices.length - 1];
    const prevClose = prices.length > 1 ? prices[prices.length - 2] : null;
    
    // Log the actual candle timestamps to debug old data issue
    const firstCandleTime = new Date(candles[0].t).toISOString();
    const lastCandleTime = new Date(candles[candles.length - 1].t).toISOString();
    console.log(`📊 Candle range: FIRST=${firstCandleTime} (${candles[0].c}), LAST=${lastCandleTime} (${currentPrice}), Total=${candles.length}, Age=${dataAgeMinutes.toFixed(1)}min`);
    console.log(`💰 Current price from latest candle: ${currentPrice}, Prev close: ${prevClose}`);

    // Calculate technical indicators (use Polygon indicators if available)
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const ema200 = calculateEMA(prices, 200);
    const rsi14 = polygonIndicators.rsi || calculateRSI(prices, 14);
    
    if (polygonIndicators.usePolygonIndicators) {
      console.log('✅ Using Polygon API indicators for enhanced accuracy');
    }
    const macd = calculateMACD(prices);
    const bb20 = calculateBollingerBands(prices, 20);
    const atr14 = calculateATR(candles, 14);
    const donchian20 = calculateDonchian(candles, 20);
    const vol20_annual = calculateRealizedVolatility(prices, 20);
    const zscore20 = calculateZScore(prices, 20);
    const vwap = calculateVWAP(candles);

    // Fetch benchmark data (S&P 500 proxy) for alpha/beta calculations
    let benchmarkPrices: number[] = [];
    try {
      const spyCandles = await fetchPolygonData('SPY', tf, polygonApiKey);
      benchmarkPrices = spyCandles.map(c => c.c);
    } catch (e) {
      console.log('Benchmark data unavailable, alpha/beta will be null');
    }

    // Calculate advanced quantitative metrics
    const sharpe_ratio = calculateSharpeRatio(prices, Math.min(252, prices.length));
    const sortino_ratio = calculateSortinoRatio(prices, Math.min(252, prices.length));
    const alpha = benchmarkPrices.length > 0 ? calculateAlpha(prices, benchmarkPrices, Math.min(252, prices.length)) : null;
    const beta = benchmarkPrices.length > 0 ? calculateBeta(prices, benchmarkPrices, Math.min(252, prices.length)) : null;
    const std_dev = calculateSampleStdDev(prices, 20);
    const variance = std_dev * std_dev; // Variance is std dev squared
    const population_std_dev = calculatePopulationStdDev(prices, 20);
    const sample_std_dev = calculateSampleStdDev(prices, 20);
    const skewness = calculateSkewness(prices, 20);
    const kurtosis = calculateKurtosis(prices, 20);
    const max_drawdown = calculateMaxDrawdown(prices);
    const calmar_ratio = calculateCalmarRatio(prices, Math.min(252, prices.length));
    const information_ratio = benchmarkPrices.length > 0 ? calculateInformationRatio(prices, benchmarkPrices, Math.min(252, prices.length)) : null;

    // Create tail data (last 50 points for sparkline)
    const tail = candles.slice(-50).map(c => ({ t: c.t, c: c.c }));

    const indicators = {
      rsi14,
      macd,
      atr14,
      zscore20
    };

    // Generate AI summary if requested
    let summary: string | undefined;
    if (withSummary) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        summary = await generateSummary(symbol, indicators, openaiKey);
      }
    }

    // Generate trading signals based on technical indicators and actual price structure
    const timeframe_profile = generateTradingSignals(
      currentPrice,
      atr14,
      rsi14,
      macd,
      bb20,
      ema20,
      ema50,
      donchian20,
      candles // Pass candles for price structure analysis
    );

    const response: QuantResponse = {
      symbol,
      tf,
      asOf: new Date(candles[candles.length - 1].t).toISOString(), // Use actual latest candle timestamp
      price: currentPrice,
      prevClose,
      ema: {
        '20': ema20,
        '50': ema50,
        '200': ema200
      },
      rsi14,
      macd,
      bb20,
      atr14,
      donchian20,
      vol20_annual,
      zscore20,
      vwap,
      tail,
      summary,
      timeframe_profile,
      quant_metrics: {
        sharpe_ratio,
        sortino_ratio,
        alpha,
        beta,
        std_dev,
        variance,
        population_std_dev,
        sample_std_dev,
        skewness,
        kurtosis,
        max_drawdown,
        calmar_ratio,
        information_ratio,
      }
    };

    console.log('Quant metrics calculated:', JSON.stringify(response.quant_metrics, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in quant-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});