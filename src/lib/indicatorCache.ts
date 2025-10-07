/**
 * Simple in-memory cache for technical indicator values
 * Prevents redundant Polygon API calls for same symbol/timeframe within 30 seconds
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

export function getCachedIndicators(symbol: string, timeframe: string): any | null {
  const key = `${symbol}-${timeframe}`;
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Return cached data if still fresh
  if (age < CACHE_TTL) {
    console.log(`[Cache HIT] Indicators for ${key} (age: ${Math.round(age/1000)}s)`);
    return entry.data;
  }
  
  // Expired - remove from cache
  cache.delete(key);
  return null;
}

export function setCachedIndicators(symbol: string, timeframe: string, data: any): void {
  const key = `${symbol}-${timeframe}`;
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`[Cache SET] Indicators for ${key}`);
}

export function clearCache(): void {
  cache.clear();
  console.log('[Cache CLEAR] All cached indicators cleared');
}
