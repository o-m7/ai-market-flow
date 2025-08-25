// src/hooks/usePolygonData.ts
import { useCallback, useEffect, useRef, useState } from "react";

/** REPLACE WITH YOUR PROJECT ID */
const EDGE = "https://<PROJECT_ID>.functions.supabase.co";

/**
 * Calls the polygon-market-data Edge Function for one symbol.
 * We keep it resilient: 200-only, safe JSON, no throw on upstream empty/rate limit.
 */
async function fetchOne(symbol: string, timeframe = "1m") {
  const url = `${EDGE}/polygon-market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const payload = await res.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return { ok: false as const, symbol, lastPrice: null, note: "parse_fail" };
    }
    // payload has: { lastPrice, candles, notes, ... }
    return {
      ok: true as const,
      symbol: payload.input_symbol || symbol,
      lastPrice: payload.lastPrice ?? null,
      notes: payload.notes || [],
      raw: payload,
    };
  } catch (e) {
    return { ok: false as const, symbol, lastPrice: null, note: "network_error" };
  }
}

type Row = {
  symbol: string;
  price?: number | null;
  lastUpdatedAt?: number;
  aiSentiment?: "bullish" | "bearish" | "neutral";
  // keep any other fields SymbolCard expects:
  [k: string]: any;
};

export function usePolygonData(symbols: string[], timeframe = "1m") {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGoodRef = useRef<Record<string, Row>>({});

  // Build a map for quick merges
  const toMap = (rows: Row[]) => rows.reduce<Record<string, Row>>((m, r) => { m[r.symbol] = r; return m; }, {});

  const loadAll = useCallback(async (initial = false) => {
    if (!symbols?.length) {
      setLoading(false);
      return;
    }

    // Stagger requests to avoid 429s
    const promises = symbols.map((sym, i) =>
      new Promise<{ sym: string; res: Awaited<ReturnType<typeof fetchOne>> }>((resolve) => {
        setTimeout(async () => {
          const res = await fetchOne(sym, timeframe);
          resolve({ sym, res });
        }, i * 200); // 200ms spacing
      })
    );

    const results = await Promise.all(promises);

    // Merge into current state while keeping last good values
    const currentMap = toMap(data);
    const nextMap: Record<string, Row> = { ...lastGoodRef.current, ...currentMap };

    let anySuccess = false;

    for (const { sym, res } of results) {
      if (res.ok) {
        anySuccess = true;
        const prev = nextMap[sym] || { symbol: sym };
        nextMap[sym] = {
          ...prev,
          symbol: sym,
          price: res.lastPrice,
          lastUpdatedAt: Date.now(),
          // keep previous fields the card may need (aiSentiment, volume, etc.)
        };
        // update last-good cache
        lastGoodRef.current[sym] = nextMap[sym];
      } else {
        // keep last good value; do NOT set global error that triggers "fallback data"
        if (!nextMap[sym]) nextMap[sym] = { symbol: sym, price: null };
      }
    }

    const next = symbols.map((s) => nextMap[s] || { symbol: s, price: null });

    setData(next);
    setLastUpdated(Date.now());
    setLoading(false);

    // Only show an error if literally *everything* failed (network off, etc.)
    setError(anySuccess ? null : "Live feed unavailable (network/rate-limit). Keeping last prices.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols), timeframe, data]);

  const refetch = useCallback(() => loadAll(false), [loadAll]);

  useEffect(() => {
    setLoading(true);
    loadAll(true);
    // poll every 4s for the grid
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => loadAll(false), 4000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [loadAll]);

  return { data, loading, error, lastUpdated, refetch };
}
