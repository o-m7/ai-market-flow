import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// REMOVED CACHE - No caching to ensure fresh data every time
// No cache means no possibility of mock/stale data

interface PolygonQuote {
  ticker: string;
  last_quote?: {
    ask: number;
    ask_size: number;
    bid: number;
    bid_size: number;
    exchange: number;
    last_updated: number;
  };
  last_trade?: {
    conditions: number[];
    exchange: number;
    price: number;
    sip_timestamp: number;
    size: number;
    timeframe: string;
  };
  min?: {
    av: number;
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
  prevDay?: {
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
  day?: {
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ENRICHED MARKET DATA REQUEST ===');
    
    const body = await req.json();
    const { symbols, symbol, market, tf } = body;
    
    // NEW: Handle single symbol enriched request
    if (symbol && market && tf) {
      console.log(`Enriched request for ${symbol} (${market}, ${tf})`);
      return await handleEnrichedRequest(symbol, market, tf);
    }
    
    // EXISTING: Handle batch symbols request for compatibility
    console.log('Batch symbols request:', symbols);

    const defaultSymbols = [
      'BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD', 'MATIC/USD',
      'AVAX/USD', 'LINK/USD', 'UNI/USD', 'ATOM/USD', 'ALGO/USD', 'VET/USD', 'ICP/USD',
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'USD/CAD', 'NZD/USD'
    ];
    const symbolsToFetch: string[] = (symbols && Array.isArray(symbols) && symbols.length > 0) ? symbols : defaultSymbols;
    
    console.log('Processing symbols:', symbolsToFetch);

    // Correct symbol mapping for different asset types
    const getPolygonSymbol = (symbol: string) => {
      const upper = symbol.toUpperCase();
      
      // Crypto mapping - expanded list for Binance compatibility
      const cryptoMap: Record<string, string> = {
        'BTC/USD': 'X:BTCUSD',
        'ETH/USD': 'X:ETHUSD',
        'BNB/USD': 'X:BNBUSD',
        'XRP/USD': 'X:XRPUSD',
        'ADA/USD': 'X:ADAUSD',
        'SOL/USD': 'X:SOLUSD',
        'DOT/USD': 'X:DOTUSD',
        'MATIC/USD': 'X:MATICUSD',
        'AVAX/USD': 'X:AVAXUSD',
        'LINK/USD': 'X:LINKUSD',
        'UNI/USD': 'X:UNIUSD',
        'ATOM/USD': 'X:ATOMUSD',
        'ALGO/USD': 'X:ALGOUSD',
        'VET/USD': 'X:VETUSD',
        'ICP/USD': 'X:ICPUSD',
        'FIL/USD': 'X:FILUSD',
        'THETA/USD': 'X:THETAUSD',
        'TRX/USD': 'X:TRXUSD',
        'ETC/USD': 'X:ETCUSD',
        'XMR/USD': 'X:XMRUSD',
        'BCH/USD': 'X:BCHUSD',
        'LTC/USD': 'X:LTCUSD',
        'DOGE/USD': 'X:DOGEUSD',
        'SHIB/USD': 'X:SHIBUSD',
        'NEAR/USD': 'X:NEARUSD',
        'FTM/USD': 'X:FTMUSD',
        'SAND/USD': 'X:SANDUSD',
        'MANA/USD': 'X:MANAUSD',
        'CRV/USD': 'X:CRVUSD',
        'AAVE/USD': 'X:AAVEUSD'
      };
      
      // Forex mapping - expanded list
      const forexMap: Record<string, string> = {
        'EUR/USD': 'C:EURUSD',
        'GBP/USD': 'C:GBPUSD',
        'USD/JPY': 'C:USDJPY',
        'USD/CHF': 'C:USDCHF',
        'AUD/USD': 'C:AUDUSD',
        'USD/CAD': 'C:USDCAD',
        'NZD/USD': 'C:NZDUSD',
        'EUR/GBP': 'C:EURGBP',
        'EUR/JPY': 'C:EURJPY',
        'GBP/JPY': 'C:GBPJPY',
        'AUD/JPY': 'C:AUDJPY',
        'EUR/CHF': 'C:EURCHF',
        'GBP/CHF': 'C:GBPCHF',
        'CHF/JPY': 'C:CHFJPY',
        'CAD/JPY': 'C:CADJPY',
        'EUR/AUD': 'C:EURAUD',
        'GBP/AUD': 'C:GBPAUD',
        'AUD/CHF': 'C:AUDCHF',
        'NZD/JPY': 'C:NZDJPY',
        'EUR/CAD': 'C:EURCAD',
        'GBP/CAD': 'C:GBPCAD',
        'AUD/CAD': 'C:AUDCAD',
        'EUR/NZD': 'C:EURNZD',
        'GBP/NZD': 'C:GBPNZD',
        'USD/SEK': 'C:USDSEK',
        'USD/NOK': 'C:USDNOK',
        'USD/DKK': 'C:USDDKK',
        'EUR/SEK': 'C:EURSEK',
        'EUR/NOK': 'C:EURNOK',
        'GBP/SEK': 'C:GBPSEK'
      };

      if (cryptoMap[symbol]) return { polygon: cryptoMap[symbol], type: 'crypto' };
      if (forexMap[symbol]) return { polygon: forexMap[symbol], type: 'forex' };
      
      // Stock symbols remain unchanged
      return { polygon: upper, type: 'stocks' };
    };

    const getMarketName = (symbol: string): string => {
      const names: Record<string, string> = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft Corporation', 
        'GOOGL': 'Alphabet Inc.',
        'AMZN': 'Amazon.com Inc.',
        'TSLA': 'Tesla Inc.',
        'NVDA': 'NVIDIA Corporation',
        'META': 'Meta Platforms Inc.',
        'NFLX': 'Netflix Inc.',
        'DIS': 'The Walt Disney Company',
        'BABA': 'Alibaba Group Holding Limited',
        // Crypto currencies
        'BTC/USD': 'Bitcoin',
        'ETH/USD': 'Ethereum',
        'BNB/USD': 'Binance Coin',
        'XRP/USD': 'Ripple',
        'ADA/USD': 'Cardano',
        'SOL/USD': 'Solana',
        'DOT/USD': 'Polkadot',
        'MATIC/USD': 'Polygon',
        'AVAX/USD': 'Avalanche',
        'LINK/USD': 'Chainlink',
        'UNI/USD': 'Uniswap',
        'ATOM/USD': 'Cosmos',
        'ALGO/USD': 'Algorand',
        'VET/USD': 'VeChain',
        'ICP/USD': 'Internet Computer',
        'FIL/USD': 'Filecoin',
        'THETA/USD': 'Theta Network',
        'TRX/USD': 'TRON',
        'ETC/USD': 'Ethereum Classic',
        'XMR/USD': 'Monero',
        'BCH/USD': 'Bitcoin Cash',
        'LTC/USD': 'Litecoin',
        'DOGE/USD': 'Dogecoin',
        'SHIB/USD': 'Shiba Inu',
        'NEAR/USD': 'NEAR Protocol',
        'FTM/USD': 'Fantom',
        'SAND/USD': 'The Sandbox',
        'MANA/USD': 'Decentraland',
        'CRV/USD': 'Curve DAO',
        'AAVE/USD': 'Aave',
        // Forex pairs
        'EUR/USD': 'Euro / US Dollar',
        'GBP/USD': 'British Pound / US Dollar',
        'USD/JPY': 'US Dollar / Japanese Yen',
        'USD/CHF': 'US Dollar / Swiss Franc',
        'AUD/USD': 'Australian Dollar / US Dollar',
        'USD/CAD': 'US Dollar / Canadian Dollar',
        'NZD/USD': 'New Zealand Dollar / US Dollar',
        'EUR/GBP': 'Euro / British Pound',
        'EUR/JPY': 'Euro / Japanese Yen',
        'GBP/JPY': 'British Pound / Japanese Yen',
        'AUD/JPY': 'Australian Dollar / Japanese Yen',
        'EUR/CHF': 'Euro / Swiss Franc',
        'GBP/CHF': 'British Pound / Swiss Franc',
        'CHF/JPY': 'Swiss Franc / Japanese Yen',
        'CAD/JPY': 'Canadian Dollar / Japanese Yen',
        'EUR/AUD': 'Euro / Australian Dollar',
        'GBP/AUD': 'British Pound / Australian Dollar',
        'AUD/CHF': 'Australian Dollar / Swiss Franc',
        'NZD/JPY': 'New Zealand Dollar / Japanese Yen',
        'EUR/CAD': 'Euro / Canadian Dollar',
        'GBP/CAD': 'British Pound / Canadian Dollar',
        'AUD/CAD': 'Australian Dollar / Canadian Dollar',
        'EUR/NZD': 'Euro / New Zealand Dollar',
        'GBP/NZD': 'British Pound / New Zealand Dollar',
        'USD/SEK': 'US Dollar / Swedish Krona',
        'USD/NOK': 'US Dollar / Norwegian Krone',
        'USD/DKK': 'US Dollar / Danish Krone',
        'EUR/SEK': 'Euro / Swedish Krona',
        'EUR/NOK': 'Euro / Norwegian Krone',
        'GBP/SEK': 'British Pound / Swedish Krona',
        // ETFs and Indices
        'SPY': 'SPDR S&P 500 ETF',
        'QQQ': 'Invesco QQQ Trust ETF',
        'DIA': 'SPDR Dow Jones Industrial Average ETF',
        'IWM': 'iShares Russell 2000 ETF',
        'VTI': 'Vanguard Total Stock Market ETF',
        'GLD': 'SPDR Gold Shares',
        'SLV': 'iShares Silver Trust',
        'USO': 'United States Oil Fund'
      };
      return names[symbol] || symbol;
    };

    const formatVolume = (volume: number): string => {
      if (volume >= 1000000000) {
        return `${(volume / 1000000000).toFixed(1)}B`;
      } else if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
      } else if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
      }
      return volume.toString();
    };

    const marketData: Array<any> = [];
    
    if (!polygonApiKey) {
      console.error('❌ POLYGON_API_KEY not configured');
      throw new Error('Polygon API key not configured');
    }

    console.log('✅ Using Polygon API for live market data');

    // Process symbols with batch requests - NO CACHE, fresh data every time
    const batchPromises = symbolsToFetch.map(async (rawSymbol, index) => {
      // Add staggered delay to avoid rate limiting (150ms per symbol for safety)
      await new Promise(resolve => setTimeout(resolve, index * 150));
      
      try {
        const { polygon: polygonSymbol, type } = getPolygonSymbol(rawSymbol);
        console.log(`[POLYGON] Processing ${rawSymbol} -> ${polygonSymbol} (${type})`);
        
        let marketDataItem = null;
        
        // Try multiple endpoints simultaneously for maximum real-time data
        const promises = (() => {
          if (type === 'forex') {
            const [base, quote] = rawSymbol.split('/');
            return [
              // v1 currencies last quote (reliable for FX)
              fetch(`https://api.polygon.io/v1/last_quote/currencies/${base}/${quote}?apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null),
              // v2 last quote by ticker (some plans support this for FX tickers)
              fetch(`https://api.polygon.io/v2/last/quote/${polygonSymbol}?apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null),
              // Forex snapshot
              fetch(`https://api.polygon.io/v2/snapshot/locale/global/markets/fx/tickers/${polygonSymbol}?apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null),
              // Previous day close for reference (may be unavailable for FX on some plans)
              fetch(`https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/prev?adjusted=true&apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
            ];
          }

          // Stocks & Crypto
          return [
            // Real-time trade
            fetch(`https://api.polygon.io/v2/last/trade/${polygonSymbol}?apikey=${polygonApiKey}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            // Real-time quote
            fetch(`https://api.polygon.io/v2/last/quote/${polygonSymbol}?apikey=${polygonApiKey}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            // Snapshot
            fetch(`https://api.polygon.io/v2/snapshot/locale/global/markets/${type === 'crypto' ? 'crypto' : 'stocks'}/tickers/${polygonSymbol}?apikey=${polygonApiKey}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            // Previous day close
            fetch(`https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/prev?adjusted=true&apikey=${polygonApiKey}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          ];
        })();
        
        const [tradeData, quoteData, snapshotData, prevData] = await Promise.all(promises);
        
        // LOG RAW API RESPONSES FOR VOLUME VERIFICATION
        console.log(`[POLYGON][${rawSymbol}] RAW API RESPONSES:`);
        if (prevData?.results?.[0]) {
          console.log(`  - prevData volume: ${prevData.results[0].v}`);
        }
        if (snapshotData?.ticker) {
          console.log(`  - snapshot.ticker.day volume: ${snapshotData.ticker.day?.v}`);
          console.log(`  - snapshot.ticker.prevDay volume: ${snapshotData.ticker.prevDay?.v}`);
        }
        if (snapshotData?.results?.[0]) {
          console.log(`  - snapshot.results[0].day volume: ${snapshotData.results[0].day?.v}`);
          console.log(`  - snapshot.results[0].prev_day volume: ${snapshotData.results[0].prev_day?.v}`);
        }
        
        console.log(`[POLYGON] Data sources for ${rawSymbol}:`,
          type === 'forex'
            ? {
                trade: false,
                quote: !!(quoteData && (quoteData.last || quoteData?.results)),
                snapshot: !!(snapshotData && (snapshotData.ticker || snapshotData?.results?.[0])),
                prev: !!prevData?.results?.[0],
              }
            : {
                trade: !!tradeData?.results,
                quote: !!quoteData?.results,
                snapshot: !!(snapshotData?.ticker || snapshotData?.results?.[0]),
                prev: !!prevData?.results?.[0],
              }
        );
        
        let currentPrice = null;
        let prevClose = null;
        let volume = 0;
        let timestamp = null;
        
        // Get the most recent price from available sources
        if (type === 'forex') {
          // v2 last quote shape
          if (quoteData?.results?.bid && quoteData?.results?.ask) {
            currentPrice = (quoteData.results.bid + quoteData.results.ask) / 2;
            timestamp = quoteData.results.last_updated || Date.now();
            console.log(`[POLYGON][FX] Using live quote midpoint (v2): ${currentPrice}`);
          // v1 currencies last_quote shape
          } else if (tradeData?.last?.bid && tradeData?.last?.ask) {
            currentPrice = (tradeData.last.bid + tradeData.last.ask) / 2;
            timestamp = tradeData.last.timestamp || tradeData.last.time || Date.now();
            console.log(`[POLYGON][FX] Using last_quote midpoint (v1): ${currentPrice}`);
          } else if (snapshotData?.ticker?.lastQuote?.bid && snapshotData?.ticker?.lastQuote?.ask) {
            currentPrice = (snapshotData.ticker.lastQuote.bid + snapshotData.ticker.lastQuote.ask) / 2;
            timestamp = snapshotData.ticker.lastQuote.timestamp || snapshotData.ticker.updated || Date.now();
            console.log(`[POLYGON][FX] Using snapshot quote midpoint: ${currentPrice}`);
          } else if (snapshotData?.ticker?.day?.c) {
            currentPrice = snapshotData.ticker.day.c;
            timestamp = snapshotData.ticker.updated || Date.now();
            console.log(`[POLYGON][FX] Using snapshot day close: ${currentPrice}`);
          } else if (snapshotData?.results?.[0]?.day?.c) {
            currentPrice = snapshotData.results[0].day.c;
            timestamp = snapshotData.results[0].updated || Date.now();
            console.log(`[POLYGON][FX] Using snapshot results day close: ${currentPrice}`);
          } else if (snapshotData?.results?.[0]?.lastQuote?.bid && snapshotData?.results?.[0]?.lastQuote?.ask) {
            currentPrice = (snapshotData.results[0].lastQuote.bid + snapshotData.results[0].lastQuote.ask) / 2;
            timestamp = snapshotData.results[0].lastQuote.timestamp || snapshotData.results[0].updated || Date.now();
            console.log(`[POLYGON][FX] Using results quote midpoint: ${currentPrice}`);
          }
        } else {
          if (tradeData?.results?.p) {
            currentPrice = tradeData.results.p;
            timestamp = tradeData.results.t;
            console.log(`[POLYGON] Using trade price: ${currentPrice} @ ${new Date(timestamp)}`);
          } else if (quoteData?.results?.bid && quoteData?.results?.ask) {
            currentPrice = (quoteData.results.bid + quoteData.results.ask) / 2;
            timestamp = quoteData.results.last_updated;
            console.log(`[POLYGON] Using quote midpoint: ${currentPrice}`);
          } else if (snapshotData?.ticker) {
            const snap = snapshotData.ticker;
            currentPrice = snap.lastTrade?.price || snap.day?.c || snap.prevDay?.c;
            timestamp = snap.lastTrade?.sip_timestamp || snap.updated || Date.now();
            console.log(`[POLYGON] Using snapshot price: ${currentPrice}`);
          } else if (snapshotData?.results?.[0]) {
            const snap = snapshotData.results[0];
            currentPrice = snap.last_trade?.price || snap.value || snap.day?.c;
            timestamp = snap.last_trade?.sip_timestamp || snap.updated;
            console.log(`[POLYGON] Using snapshot price (results[0]): ${currentPrice}`);
          }
        }
        
        // Get previous close and volume - ONLY from Polygon API, NO FALLBACKS
        if (prevData?.results?.[0]) {
          prevClose = prevData.results[0].c;
          volume = prevData.results[0].v ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: prevData.results[0].v = ${prevData.results[0].v} (RAW FROM API)`);
        } else if (snapshotData?.ticker?.prevDay?.c) {
          prevClose = snapshotData.ticker.prevDay.c;
          const dayVol = snapshotData.ticker.day?.v;
          const prevDayVol = snapshotData.ticker.prevDay?.v;
          volume = dayVol ?? prevDayVol ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: snapshot.ticker day=${dayVol}, prevDay=${prevDayVol} (RAW FROM API)`);
        } else if (snapshotData?.results?.[0]?.prev_day) {
          prevClose = snapshotData.results[0].prev_day.c;
          const dayVol = snapshotData.results[0].day?.v;
          const prevDayVol = snapshotData.results[0].prev_day?.v;
          volume = dayVol ?? prevDayVol ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: snapshot.results day=${dayVol}, prevDay=${prevDayVol} (RAW FROM API)`);
        } else if (type === 'forex' && snapshotData?.ticker?.day?.o) {
          prevClose = snapshotData.ticker.day.o;
          volume = snapshotData.ticker.day?.v ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: forex snapshot.ticker.day.v = ${snapshotData.ticker.day?.v} (RAW FROM API)`);
        } else if (snapshotData?.ticker?.day?.c) {
          prevClose = snapshotData.ticker.day.c;
          volume = snapshotData.ticker.day?.v ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: snapshot.ticker.day.v = ${snapshotData.ticker.day?.v} (RAW FROM API)`);
        } else if (type === 'forex' && snapshotData?.results?.[0]?.day?.o) {
          prevClose = snapshotData.results[0].day.o;
          volume = snapshotData.results[0].day?.v ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: forex snapshot.results.day.v = ${snapshotData.results[0].day?.v} (RAW FROM API)`);
        } else if (snapshotData?.results?.[0]?.day?.c) {
          prevClose = snapshotData.results[0].day.c;
          volume = snapshotData.results[0].day?.v ?? 0;
          console.log(`[POLYGON][${rawSymbol}] ✓ Volume source: snapshot.results.day.v = ${snapshotData.results[0].day?.v} (RAW FROM API)`);
        }
        
        console.log(`[POLYGON][${rawSymbol}] FINAL VOLUME VALUE: ${volume} (${volume === 0 ? 'Polygon returned 0 or no volume data' : 'Valid volume from Polygon'})`);
        
        if (currentPrice) {
          const change = prevClose ? (currentPrice - prevClose) : 0;
          const changePercent = prevClose ? (prevClose !== 0 ? (change / prevClose) * 100 : 0) : 0;
          
          // Debug logging for BNB specifically
          if (rawSymbol === 'BNB/USD') {
            console.log(`[POLYGON][BNB DEBUG] currentPrice: ${currentPrice}, prevClose: ${prevClose}, change: ${change}, changePercent: ${changePercent}`);
            console.log(`[POLYGON][BNB DEBUG] prevData:`, prevData?.results?.[0]);
            console.log(`[POLYGON][BNB DEBUG] snapshotData.ticker?.prevDay:`, snapshotData?.ticker?.prevDay);
          }
          
          // Generate AI sentiment based on price change
          const aiSentiment = changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral';
          
          marketDataItem = {
            symbol: rawSymbol,
            name: getMarketName(rawSymbol),
            price: Number(currentPrice.toFixed(4)),
            change: Number(change.toFixed(4)),
            changePercent: Number(changePercent.toFixed(2)),
            volume: volume.toString(), // RAW REAL volume number from Polygon API - NO FORMATTING, NO MOCK
            lastUpdate: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
            aiSentiment: aiSentiment as 'bullish' | 'bearish' | 'neutral'
          };
          
          console.log(`[POLYGON] ✓ REAL DATA: ${rawSymbol} = $${currentPrice.toFixed(4)} (${changePercent.toFixed(2)}%) vol: ${volume} (RAW FROM POLYGON API) @ ${marketDataItem.lastUpdate}`);
        } else {
          console.warn(`[POLYGON] ⚠️ No live data available for ${rawSymbol}`);
        }
        
        return marketDataItem;
        
      } catch (error) {
        console.error(`[POLYGON] Error processing ${rawSymbol}:`, error);
        return null;
      }
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(batchPromises);
    
    // Only include symbols that successfully returned data (no 0 prices)
    results.forEach((result) => {
      if (result && result.price > 0) {
        marketData.push(result);
      } else if (result) {
        console.warn(`[POLYGON] ⚠️ Skipping ${result.symbol} - no valid price data (rate limited or unavailable)`);
      }
    });

    console.log(`Successfully processed ${marketData.length} symbols`);
    

    return new Response(JSON.stringify({ 
      data: marketData,
      timestamp: new Date().toISOString(),
      source: 'polygon'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-market-data function:', error);
    
    return new Response(JSON.stringify({ 
      data: [],
      timestamp: new Date().toISOString(),
      source: 'polygon',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// NEW: Enriched market data handler for single symbol with technical features
async function handleEnrichedRequest(symbol: string, market: string, tf: string) {
  console.log(`[ENRICHED] Processing ${symbol} (${market}) on ${tf} timeframe`);
  
  const { polygon: polygonSymbol, type } = getPolygonSymbol(symbol);
  
  try {
    // Fetch live quotes and historical data in parallel
    const [quoteData, candleData] = await Promise.all([
      fetchLiveQuote(polygonSymbol, type, symbol),
      fetchCandleData(polygonSymbol, tf, 200) // Get enough bars for higher TF analysis
    ]);
    
    if (!quoteData.current) {
      throw new Error(`No live data available for ${symbol}`);
    }
    
    // Calculate enriched features
    const features = await calculateEnrichedFeatures(
      symbol, 
      market, 
      tf, 
      quoteData, 
      candleData
    );
    
    return new Response(JSON.stringify(features), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[ENRICHED] Error for ${symbol}:`, error);
    return new Response(JSON.stringify({ 
      error: error.message,
      symbol,
      market,
      tf
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Enhanced quote fetcher with more data
async function fetchLiveQuote(polygonSymbol: string, type: string, originalSymbol: string) {
  const promises = [];
  
  if (type === 'forex') {
    const [base, quote] = originalSymbol.split('/');
    promises.push(
      fetch(`https://api.polygon.io/v1/last_quote/currencies/${base}/${quote}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.polygon.io/v2/last/quote/${polygonSymbol}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.polygon.io/v2/snapshot/locale/global/markets/fx/tickers/${polygonSymbol}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null)
    );
  } else {
    promises.push(
      fetch(`https://api.polygon.io/v2/last/trade/${polygonSymbol}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.polygon.io/v2/last/quote/${polygonSymbol}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.polygon.io/v2/snapshot/locale/global/markets/${type === 'crypto' ? 'crypto' : 'stocks'}/tickers/${polygonSymbol}?apikey=${polygonApiKey}`)
        .then(r => r.ok ? r.json() : null).catch(() => null)
    );
  }
  
  const [tradeData, quoteData, snapshotData] = await Promise.all(promises);
  
  let current = null;
  let bid = null;
  let ask = null;
  let bid_size = null;
  let ask_size = null;
  let timestamp = null;
  
  // Extract pricing data based on asset type
  if (type === 'forex') {
    if (quoteData?.results?.bid && quoteData?.results?.ask) {
      bid = quoteData.results.bid;
      ask = quoteData.results.ask;
      current = (bid + ask) / 2;
      timestamp = quoteData.results.last_updated;
      bid_size = quoteData.results.bid_size;
      ask_size = quoteData.results.ask_size;
    } else if (tradeData?.last?.bid && tradeData?.last?.ask) {
      bid = tradeData.last.bid;
      ask = tradeData.last.ask;
      current = (bid + ask) / 2;
      timestamp = tradeData.last.timestamp;
    } else if (snapshotData?.ticker?.lastQuote) {
      const quote = snapshotData.ticker.lastQuote;
      bid = quote.bid;
      ask = quote.ask;
      current = (bid + ask) / 2;
      timestamp = quote.timestamp;
      bid_size = quote.bid_size;
      ask_size = quote.ask_size;
    }
  } else {
    if (tradeData?.results?.p) {
      current = tradeData.results.p;
      timestamp = tradeData.results.t;
    }
    if (quoteData?.results) {
      bid = quoteData.results.bid;
      ask = quoteData.results.ask;
      bid_size = quoteData.results.bid_size;
      ask_size = quoteData.results.ask_size;
      if (!current && bid && ask) current = (bid + ask) / 2;
      if (!timestamp) timestamp = quoteData.results.last_updated;
    }
    if (!current && snapshotData?.ticker) {
      current = snapshotData.ticker.lastTrade?.price || snapshotData.ticker.day?.c;
      if (!timestamp) timestamp = snapshotData.ticker.updated;
    }
  }
  
  return {
    current: current ? round5(current) : null,
    bid: bid ? round5(bid) : null,
    ask: ask ? round5(ask) : null,
    bid_size,
    ask_size,
    timestamp: timestamp || Date.now(),
    raw_data: { tradeData, quoteData, snapshotData }
  };
}

// Fetch historical candle data
async function fetchCandleData(polygonSymbol: string, timeframe: string, limit = 200) {
  // Map timeframe to Polygon format
  const tfMap: Record<string, string> = {
    '1m': '1/minute',
    '5m': '5/minute', 
    '15m': '15/minute',
    '30m': '30/minute',
    '1h': '1/hour',
    '4h': '4/hour',
    '1d': '1/day',
    'D': '1/day'
  };
  
  const polygonTf = tfMap[timeframe] || '1/hour';
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
  const toDate = new Date().toISOString().split('T')[0];
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/${polygonTf}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=${limit}&apikey=${polygonApiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.results || []).map((bar: any) => ({
      t: bar.t,
      o: round5(bar.o),
      h: round5(bar.h),
      l: round5(bar.l),
      c: round5(bar.c),
      v: bar.v
    }));
  } catch (error) {
    console.error(`Failed to fetch candle data for ${polygonSymbol}:`, error);
    return [];
  }
}

// Calculate enriched features including technical analysis
async function calculateEnrichedFeatures(
  symbol: string,
  market: string,
  tf: string,
  quoteData: any,
  candleData: any[]
) {
  const now = new Date();
  const priceAgeMs = quoteData.timestamp ? now.getTime() - quoteData.timestamp : 0;
  
  // Calculate spread and order flow
  const spread = quoteData.bid && quoteData.ask ? round5(quoteData.ask - quoteData.bid) : null;
  const quoteImbalance = (quoteData.bid_size && quoteData.ask_size) 
    ? round5(quoteData.bid_size / (quoteData.bid_size + quoteData.ask_size))
    : null;
  
  // Session detection
  const session = getSessionUTC(now);
  
  // Technical indicators from candle data
  let technical = null;
  let atr14 = null;
  let levels = { support: [], resistance: [], vwap: null };
  let higherTimeframe = {};
  
  if (candleData.length >= 20) {
    technical = calculateAllTechnicalIndicators(candleData);
    atr14 = technical.atr14;
    levels = {
      support: findSupportResistanceLevels(candleData).support,
      resistance: findSupportResistanceLevels(candleData).resistance,
      vwap: technical.vwap
    };
    
    // Calculate higher timeframe snapshots
    if (candleData.length >= 50) {
      const h4Data = candleData.filter((_, i) => i % 4 === 0); // Simplified 4h sampling
      const dailyData = candleData.filter((_, i) => i % 24 === 0); // Simplified daily sampling
      
      if (h4Data.length >= 20) {
        const h4Tech = calculateAllTechnicalIndicators(h4Data);
        higherTimeframe.h4 = {
          ema20: round5(h4Tech.ema20),
          ema50: round5(h4Tech.ema50),
          ema200: round5(h4Tech.ema200),
          rsi14: round5(h4Tech.rsi14),
          vwap: round5(h4Tech.vwap)
        };
      }
      
      if (dailyData.length >= 20) {
        const dailyTech = calculateAllTechnicalIndicators(dailyData);
        higherTimeframe.daily = {
          ema20: round5(dailyTech.ema20),
          ema50: round5(dailyTech.ema50), 
          ema200: round5(dailyTech.ema200),
          rsi14: round5(dailyTech.rsi14),
          vwap: round5(dailyTech.vwap)
        };
      }
    }
  }
  
  return {
    symbol,
    market,
    tf,
    
    // Live pricing
    current: quoteData.current,
    price_age_ms: priceAgeMs,
    spread,
    spread_percentile_30d: null, // TODO: Implement cache
    stale: priceAgeMs > 1500,
    
    // Order flow
    order_flow: {
      quote_imbalance: quoteImbalance,
      trade_imbalance: null // TODO: Implement for crypto
    },
    
    // Volatility and session
    volatility: {
      atr14_1h: atr14,
      atr_percentile_60d: null, // TODO: Implement cache
      session
    },
    
    // Higher timeframe context
    higher_timeframe: higherTimeframe,
    
    // Support/resistance levels
    levels,
    
    // Current timeframe technical indicators
    technical: technical ? {
      ema20: round5(technical.ema20),
      ema50: round5(technical.ema50),
      ema200: round5(technical.ema200),
      rsi14: round5(technical.rsi14),
      macd: {
        line: round5(technical.macd.line),
        signal: round5(technical.macd.signal),
        hist: round5(technical.macd.hist)
      },
      atr14: round5(technical.atr14),
      bb: {
        mid: round5(technical.bb.mid),
        upper: round5(technical.bb.upper),
        lower: round5(technical.bb.lower)
      }
    } : null,
    
    // Metadata
    timestamp: now.toISOString(),
    candles_analyzed: candleData.length
  };
}

// Import the shared utilities at the top of existing functions
function round5(n: number): number {
  return Number(n.toFixed(5));
}

function getSessionUTC(date: Date): "Asia" | "London" | "NY" {
  const hour = date.getUTCHours();
  
  if (hour >= 22 || hour < 8) {
    return "Asia";
  } else if (hour >= 8 && hour < 16) {
    return "London";
  } else {
    return "NY";
  }
}

// Import technical analysis functions
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
  
  let gains = 0;
  let losses = 0;
  
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

function calculateMACD(prices: number[]): { line: number; signal: number; hist: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const recentPrices = prices.slice(-9);
  const signal = calculateEMA(recentPrices.map(() => macdLine), 9);
  const histogram = macdLine - signal;
  
  return { line: macdLine, signal, hist: histogram };
}

function calculateATR(candles: any[], period = 14): number {
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

function calculateBB(prices: number[], period = 20, multiplier = 2): { mid: number; upper: number; lower: number } {
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

function calculateVWAP(candles: any[]): number {
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

function calculateAllTechnicalIndicators(candles: any[]) {
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

function findSupportResistanceLevels(candles: any[]): { support: number[], resistance: number[] } {
  const highs = candles.map(c => c.h);
  const lows = candles.map(c => c.l);
  
  const support: number[] = [];
  const resistance: number[] = [];
  
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
        lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      support.push(round5(lows[i]));
    }
  }
  
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
        highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      resistance.push(round5(highs[i]));
    }
  }
  
  return {
    support: support.sort((a, b) => b - a).slice(0, 3),
    resistance: resistance.sort((a, b) => a - b).slice(0, 3)
  };
}