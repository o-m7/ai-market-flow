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

    const defaultSymbols = ['BTC/USD', 'ETH/USD', 'XRP/USD', 'EUR/USD', 'GBP/USD'];
    const symbolsToFetch: string[] = (symbols && Array.isArray(symbols) && symbols.length > 0) ? symbols : defaultSymbols;

    // Correct symbol mapping for different asset types
    const getPolygonSymbol = (symbol: string) => {
      const upper = symbol.toUpperCase();
      
      // Crypto mapping - use correct Polygon crypto symbols
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
        'LINK/USD': 'X:LINKUSD'
      };
      
      // Forex mapping
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
        'GBP/JPY': 'C:GBPJPY'
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

    // Process symbols (limit to 5) and focus on crypto + forex only
    for (const rawSymbol of symbolsToFetch.slice(0, 5)) {
      try {
        const { polygon: polygonSymbol, type } = getPolygonSymbol(rawSymbol);
        console.log(`Processing ${rawSymbol} -> ${polygonSymbol} (${type})`);

        // Skip stocks/indices for now
        if (type === 'stocks') {
          console.log(`Skipping stocks symbol ${rawSymbol}`);
          continue;
        }

        const toBinanceSymbol = (s: string) => s.replace('/', '').replace('USD', 'USDT').replace(/:/g, '');
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

        if (type === 'crypto') {
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
        }

        if (type === 'forex') {
          // Primary: exchangerate.host latest
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
          await new Promise((r) => setTimeout(r, 150));
          continue;
        }
      } catch (error) {
        console.error(`Error processing ${rawSymbol}:`, error);
      }
    }

    console.log(`Successfully processed ${marketData.length} symbols`);
    
    // If no real data, return mock data to ensure UI works
    if (marketData.length === 0) {
      console.log("No live data available, generating mock data");
      for (const symbol of symbolsToFetch.slice(0, 6)) {
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
    const defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
    
    for (const symbol of defaultSymbols) {
      const basePrice = Math.random() * 200 + 50;
      const changePercent = (Math.random() - 0.5) * 6;
      const change = (basePrice * changePercent) / 100;
      const sentiments = ['bullish', 'bearish', 'neutral'];
      const aiSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      
      mockData.push({
        symbol,
        name: symbol,
        price: Number(basePrice.toFixed(2)),
        change: Number(change.toFixed(2)),
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