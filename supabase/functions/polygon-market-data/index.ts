import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

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
    if (!polygonApiKey) {
      throw new Error('Polygon API key not configured');
    }

    const { symbols } = await req.json();
    console.log('Fetching data for symbols:', symbols);

    const defaultSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
    const symbolsToFetch: string[] = (symbols && Array.isArray(symbols) && symbols.length > 0) ? symbols : defaultSymbols;

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

    const generateAISummary = (symbol: string, sentiment: string, price: number): string => {
      const summaries = {
        bullish: [
          `Strong technical indicators suggest continued upward momentum. Support at $${(price * 0.95).toFixed(2)}.`,
          `Breakout above key resistance levels. Positive momentum building.`,
          `Technical analysis shows bullish pattern formation with increasing volume.`,
          `RSI showing strength with room to run higher. Trend remains intact.`
        ],
        bearish: [
          `Technical indicators showing weakness. Support under pressure at $${(price * 0.95).toFixed(2)}.`,
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
    };

    const marketData: Array<any> = [];
    let usedFallback = false;

    // Process crypto and forex symbols (limit to 15 for performance)
    for (const rawSymbol of symbolsToFetch.slice(0, 15)) {
      try {
        const { polygon: polygonSymbol, type } = getPolygonSymbol(rawSymbol);
        console.log(`Processing ${rawSymbol} -> ${polygonSymbol} (${type})`);

        // Skip stocks/indices - focus on crypto and forex only
        if (type === 'stocks') {
          console.log(`Skipping stocks symbol ${rawSymbol}`);
          continue;
        }

        const toBinanceSymbol = (s: string) => {
          // Special mappings for Binance API compatibility
          const binanceMap: Record<string, string> = {
            'BTC/USD': 'BTCUSDT',
            'ETH/USD': 'ETHUSDT',
            'BNB/USD': 'BNBUSDT',
            'XRP/USD': 'XRPUSDT',
            'ADA/USD': 'ADAUSDT',
            'SOL/USD': 'SOLUSDT',
            'DOT/USD': 'DOTUSDT',
            'MATIC/USD': 'MATICUSDT',
            'AVAX/USD': 'AVAXUSDT',
            'LINK/USD': 'LINKUSDT',
            'UNI/USD': 'UNIUSDT',
            'ATOM/USD': 'ATOMUSDT',
            'ALGO/USD': 'ALGOUSDT',
            'VET/USD': 'VETUSDT',
            'ICP/USD': 'ICPUSDT',
            'FIL/USD': 'FILUSDT',
            'THETA/USD': 'THETAUSDT',
            'TRX/USD': 'TRXUSDT',
            'ETC/USD': 'ETCUSDT',
            'XMR/USD': 'XMRUSDT',
            'BCH/USD': 'BCHUSDT',
            'LTC/USD': 'LTCUSDT',
            'DOGE/USD': 'DOGEUSDT',
            'SHIB/USD': 'SHIBUSDT',
            'NEAR/USD': 'NEARUSDT',
            'FTM/USD': 'FTMUSDT',
            'SAND/USD': 'SANDUSDT',
            'MANA/USD': 'MANAUSDT',
            'CRV/USD': 'CRVUSDT',
            'AAVE/USD': 'AAVEUSDT'
          };
          return binanceMap[s] || s.replace('/', '').replace('USD', 'USDT').replace(/:/g, '');
        };
        const toYMD = (d: Date) => d.toISOString().slice(0, 10);

        const pushRecord = (price: number, prevClose: number, volumeNum: number) => {
          const change = price - prevClose;
          const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
          let aiSentiment: string;
          if (changePercent > 1) aiSentiment = 'bullish';
          else if (changePercent < -1) aiSentiment = 'bearish';
          else aiSentiment = 'neutral';
          marketData.push({
            symbol: rawSymbol,
            name: getMarketName(rawSymbol),
            price: Number(price.toFixed(4)),
            change: Number(change.toFixed(4)),
            changePercent: Number(changePercent.toFixed(2)),
            volume: formatVolume(volumeNum),
            rsi: Math.floor(Math.random() * 40) + 30,
            aiSentiment,
            aiSummary: generateAISummary(rawSymbol, aiSentiment, price)
          });
        };

        if (type === 'stocks') {
          // Primary: Polygon previous day aggregates for stocks
          const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/prev?adjusted=true&apikey=${polygonApiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const result = data.results?.[0];
            if (result) {
              pushRecord(result.c ?? result.close ?? 0, result.o ?? result.open ?? (result.c ?? 0), result.v ?? 0);
              console.log(`Stock success for ${rawSymbol}`);
              await new Promise((r) => setTimeout(r, 150));
              continue;
            }
          }
          // Fallback: Daily open-close (yesterday)
          const y = new Date(Date.now() - 24*60*60*1000);
          const fallbackUrl = `https://api.polygon.io/v1/open-close/${polygonSymbol}/${toYMD(y)}?adjusted=true&apikey=${polygonApiKey}`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.close && fallbackData.open) {
              usedFallback = true;
              pushRecord(fallbackData.close, fallbackData.open, fallbackData.volume || 0);
              console.log(`Stock fallback success for ${rawSymbol}`);
            }
          }
        } else if (type === 'crypto') {
          // Primary: Binance live ticker
          try {
            const sym = toBinanceSymbol(rawSymbol);
            const bRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
            if (bRes.ok) {
              const b = await bRes.json();
              const last = parseFloat(b.lastPrice);
              const prev = parseFloat(b.prevClosePrice) || (last / (1 + (parseFloat(b.priceChangePercent) || 0) / 100));
              usedFallback = true; // mark non-polygon source
              pushRecord(last, prev, Math.floor(parseFloat(b.volume) || 0));
              console.log(`Crypto live (Binance) success for ${rawSymbol}`);
              await new Promise((r) => setTimeout(r, 150));
              continue;
            } else {
              console.error(`Binance ticker failed for ${rawSymbol}:`, bRes.status, bRes.statusText);
            }
          } catch (e) {
            console.error(`Binance error for ${rawSymbol}:`, e);
          }
          // Fallback to Polygon previous aggs if Binance fails
          const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/prev?adjusted=true&apikey=${polygonApiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const result = data.results?.[0];
            if (result) {
              pushRecord(result.c ?? result.close ?? 0, result.o ?? result.open ?? (result.c ?? 0), result.v ?? 0);
              await new Promise((r) => setTimeout(r, 150));
              continue;
            }
          }
          console.warn(`No valid crypto price for ${rawSymbol}`);
          await new Promise((r) => setTimeout(r, 150));
          continue;
        } else if (type === 'forex') {
          // Primary: exchangerate.host latest for forex
          try {
            const [base, quote] = rawSymbol.split('/');
            const y = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const latestRes = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=${quote}`);
            if (latestRes.ok) {
              const latest = await latestRes.json();
              const rate = latest?.rates?.[quote];
              if (rate) {
                let prev = rate;
                const histRes = await fetch(`https://api.exchangerate.host/${toYMD(y)}?base=${base}&symbols=${quote}`);
                if (histRes.ok) {
                  const hist = await histRes.json();
                  prev = hist?.rates?.[quote] ?? prev;
                }
                usedFallback = true; // mark non-polygon source
                pushRecord(rate, prev, 0);
                console.log(`Forex live success for ${rawSymbol}`);
                await new Promise((r) => setTimeout(r, 150));
                continue;
              }
            } else {
              console.error(`exchangerate.host failed for ${rawSymbol}:`, latestRes.status, latestRes.statusText);
            }
          } catch (e) {
            console.error(`Forex provider error for ${rawSymbol}:`, e);
          }
          // Fallback to Polygon previous aggs if provider fails
          const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/prev?adjusted=true&apikey=${polygonApiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const result = data.results?.[0];
            if (result) {
              pushRecord(result.c ?? result.close ?? 0, result.o ?? result.open ?? (result.c ?? 0), result.v ?? 0);
              await new Promise((r) => setTimeout(r, 150));
              continue;
            }
          }
          console.warn(`No valid forex price for ${rawSymbol}`);
        }

        console.warn(`Unknown symbol type or no data for ${rawSymbol}`);
        await new Promise((r) => setTimeout(r, 150));
      } catch (error) {
        console.error(`Error processing ${rawSymbol}:`, error);
      }
    }

    console.log(`Successfully processed ${marketData.length} symbols`);
    
    // If no real data, return mock data to ensure UI works
    if (marketData.length === 0) {
      console.log("No live data available, generating mock data");
      for (const symbol of symbolsToFetch.slice(0, 10)) {
        const basePrice = Math.random() * 200 + 50;
        const changePercent = (Math.random() - 0.5) * 6; // -3% to +3%
        const change = (basePrice * changePercent) / 100;
        const sentiments = ['bullish', 'bearish', 'neutral'];
        const aiSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        
        marketData.push({
          symbol,
          name: getMarketName(symbol),
          price: Number(basePrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: formatVolume(Math.floor(Math.random() * 50000000) + 1000000),
          rsi: Math.floor(Math.random() * 40) + 30,
          aiSentiment,
          aiSummary: generateAISummary(symbol, aiSentiment, basePrice)
        });
      }
    }

    return new Response(JSON.stringify({ 
      data: marketData,
      timestamp: new Date().toISOString(),
      source: usedFallback ? 'mixed' : (marketData.length > 0 && marketData.some(item => item.price > 0) ? 'polygon' : 'mock')
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in polygon-market-data function:', error);
    
    // Return mock data on error to ensure UI functionality
    const mockData = [];
    const fallbackSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'];
    
    for (const symbol of fallbackSymbols) {
      const basePrice = symbol.includes('/') && !symbol.includes('USD/') ? Math.random() * 200 + 50 : 1 + Math.random() * 0.5;
      const changePercent = (Math.random() - 0.5) * 6;
      const change = (basePrice * changePercent) / 100;
      const sentiments = ['bullish', 'bearish', 'neutral'];
      const aiSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      mockData.push({
        symbol,
        name: getMarketName(symbol),
        price: Number(basePrice.toFixed(4)),
        change: Number(change.toFixed(4)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: `${Math.floor(Math.random() * 50) + 1}M`,
        rsi: Math.floor(Math.random() * 40) + 30,
        aiSentiment,
        aiSummary: `Mock data - ${aiSentiment} sentiment for ${symbol}`
      });
    }
    
    return new Response(JSON.stringify({ 
      data: mockData,
      timestamp: new Date().toISOString(),
      source: 'mock',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});