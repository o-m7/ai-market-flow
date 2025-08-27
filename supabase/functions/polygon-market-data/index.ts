import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('=== LIVE MARKET DATA REQUEST ===');
    
    const { symbols } = await req.json();
    console.log('Requested symbols:', symbols);

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

    const generateAISummary = async (symbol: string, price: number, change: number, changePercent: number): Promise<string> => {
      if (!openAIApiKey) {
        // Fallback to basic analysis if no OpenAI key
        const sentiment = changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral';
        const summaries = {
          bullish: [
            `Strong technical indicators suggest continued upward momentum. Support at $${(price * 0.95).toFixed(4)}.`,
            `Breakout above key resistance levels. Positive momentum building.`,
            `Technical analysis shows bullish pattern formation with increasing volume.`,
            `RSI showing strength with room to run higher. Trend remains intact.`
          ],
          bearish: [
            `Technical indicators showing weakness. Support under pressure at $${(price * 0.95).toFixed(4)}.`,
            `Bearish divergence detected. Risk of further downside movement.`,
            `Selling pressure increasing. Key support levels critical to hold.`,
            `Volume confirmation on downside suggests continued weakness.`
          ],
          neutral: [
            `Consolidating near key levels. Awaiting catalyst for next directional move.`,
            `Trading within established range. Mixed signals from technical indicators.`,
            `Sideways movement expected. Watch for breakout above resistance or below support.`,
            `Balanced between buyers and sellers. Low volatility environment.`
          ]
        };
        
        const sentimentSummaries = summaries[sentiment as keyof typeof summaries] || summaries.neutral;
        return sentimentSummaries[Math.floor(Math.random() * sentimentSummaries.length)];
      }

      try {
        const assetType = symbol.includes('/') ? (symbol.includes('USD') && !symbol.startsWith('USD') ? 'cryptocurrency' : 'forex pair') : 'stock';
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a professional financial analyst. Provide concise, actionable market analysis in 1-2 sentences.'
              },
              {
                role: 'user',
                content: `Analyze ${symbol} (${assetType}): Current price $${price}, change ${change.toFixed(4)} (${changePercent.toFixed(2)}%). Give brief technical outlook.`
              }
            ],
            temperature: 0.7,
            max_tokens: 100
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('Error generating AI summary:', error);
        // Fallback to simple analysis
        const sentiment = changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral';
        return sentiment === 'bullish' 
          ? `Strong momentum with ${changePercent.toFixed(2)}% gain. Watch for continuation above current levels.`
          : sentiment === 'bearish'
          ? `Downward pressure with ${changePercent.toFixed(2)}% decline. Key support levels under test.`
          : `Consolidating around $${price.toFixed(4)}. Awaiting directional catalyst.`;
      }
    };

    const marketData: Array<any> = [];
    
    if (!polygonApiKey) {
      console.error('❌ POLYGON_API_KEY not configured');
      throw new Error('Polygon API key not configured');
    }

    console.log('✅ Using Polygon API for live market data');

    // Process symbols with batch requests for better performance
    const batchPromises = symbolsToFetch.slice(0, 10).map(async (rawSymbol) => {
      try {
        const { polygon: polygonSymbol, type } = getPolygonSymbol(rawSymbol);
        console.log(`[POLYGON] Processing ${rawSymbol} -> ${polygonSymbol} (${type})`);
        
        let marketDataItem = null;
        
        // Try multiple endpoints simultaneously for maximum real-time data
        const promises = (() => {
          if (type === 'forex') {
            return [
              // Real-time quote for forex
              fetch(`https://api.polygon.io/v2/last/quote/${polygonSymbol}?apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null),
              // Forex snapshot
              fetch(`https://api.polygon.io/v2/snapshot/locale/global/markets/fx/tickers/${polygonSymbol}?apikey=${polygonApiKey}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null),
              // Previous day close for reference
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
          if (quoteData?.results?.bid && quoteData?.results?.ask) {
            currentPrice = (quoteData.results.bid + quoteData.results.ask) / 2;
            timestamp = quoteData.results.last_updated || Date.now();
            console.log(`[POLYGON][FX] Using live quote midpoint: ${currentPrice}`);
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
        
        // Get previous close
        if (prevData?.results?.[0]) {
          prevClose = prevData.results[0].c;
          volume = prevData.results[0].v || 0;
        } else if (snapshotData?.ticker?.prevDay?.c) {
          prevClose = snapshotData.ticker.prevDay.c;
          volume = snapshotData.ticker.day?.v || 0;
        } else if (snapshotData?.results?.[0]?.prev_day) {
          prevClose = snapshotData.results[0].prev_day.c;
          volume = snapshotData.results[0].day?.v || 0;
        } else if (type === 'forex' && snapshotData?.ticker?.day?.o) {
          prevClose = snapshotData.ticker.day.o;
        } else if (snapshotData?.ticker?.day?.c) {
          prevClose = snapshotData.ticker.day.c;
        } else if (type === 'forex' && snapshotData?.results?.[0]?.day?.o) {
          prevClose = snapshotData.results[0].day.o;
        } else if (snapshotData?.results?.[0]?.day?.c) {
          prevClose = snapshotData.results[0].day.c;
        }
        
        if (currentPrice && prevClose) {
          const change = currentPrice - prevClose;
          const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
          
          marketDataItem = {
            symbol: rawSymbol,
            name: getMarketName(rawSymbol),
            price: Number(currentPrice.toFixed(4)),
            change: Number(change.toFixed(4)),
            changePercent: Number(changePercent.toFixed(2)),
            volume: type === 'forex' ? '—' : formatVolume(volume),
            lastUpdate: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
          };
          
          console.log(`[POLYGON] ✓ Live success: ${rawSymbol} = $${currentPrice.toFixed(4)} (${changePercent.toFixed(2)}%) @ ${marketDataItem.lastUpdate}`);
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
    
    // Filter out null results and add to marketData
    results.forEach(item => {
      if (item) {
        marketData.push(item);
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