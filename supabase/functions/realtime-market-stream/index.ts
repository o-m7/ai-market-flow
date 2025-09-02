import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ClientConnection {
  socket: WebSocket;
  symbols: string[];
  lastUpdate: number;
}

const connections = new Set<ClientConnection>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const connection: ClientConnection = { 
    socket, 
    symbols: [], 
    lastUpdate: Date.now() 
  };
  
  connections.add(connection);
  console.log(`New WebSocket connection. Total connections: ${connections.size}`);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
    socket.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to real-time market analysis stream',
      timestamp: new Date().toISOString()
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      switch (message.type) {
        case 'subscribe':
          connection.symbols = message.symbols || [];
          socket.send(JSON.stringify({
            type: 'subscribed',
            symbols: connection.symbols,
            timestamp: new Date().toISOString()
          }));
          
          // Start sending real-time updates
          startRealTimeUpdates(connection);
          break;

        case 'analyze':
          await handleAnalysisRequest(connection, message);
          break;

        case 'ping':
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  };

  socket.onclose = () => {
    connections.delete(connection);
    console.log(`WebSocket connection closed. Remaining connections: ${connections.size}`);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    connections.delete(connection);
  };

  return response;
});

async function startRealTimeUpdates(connection: ClientConnection) {
  const updateInterval = setInterval(async () => {
    if (connection.socket.readyState !== WebSocket.OPEN) {
      clearInterval(updateInterval);
      return;
    }

    try {
      const marketUpdates = await fetchMarketUpdates(connection.symbols);
      
      connection.socket.send(JSON.stringify({
        type: 'market_update',
        data: marketUpdates,
        timestamp: new Date().toISOString()
      }));

      connection.lastUpdate = Date.now();
    } catch (error) {
      console.error("Error sending market updates:", error);
    }
  }, 2000); // Update every 2 seconds for enriched features

  // Clean up interval when connection closes
  connection.socket.addEventListener('close', () => {
    clearInterval(updateInterval);
  });
}

async function fetchMarketUpdates(symbols: string[]) {
  const updates = [];

  for (const symbol of symbols.slice(0, 5)) { // Limit to 5 symbols to avoid rate limits
    try {
      // NEW: Use enriched market data endpoint
      const enrichedResponse = await fetch('http://localhost:54321/functions/v1/polygon-market-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          market: getMarketType(symbol),
          tf: '1h' // Default timeframe for realtime
        })
      });

      if (enrichedResponse.ok) {
        const enrichedData = await enrichedResponse.json();
        
        // Include enriched features in broadcast
        updates.push({
          symbol,
          price: enrichedData.current,
          change: enrichedData.current && enrichedData.technical ? 
            (enrichedData.current - enrichedData.technical.ema20) : 0,
          changePercent: enrichedData.current && enrichedData.technical && enrichedData.technical.ema20 ? 
            ((enrichedData.current - enrichedData.technical.ema20) / enrichedData.technical.ema20) * 100 : 0,
          
          // NEW: Include enriched features
          features: {
            spread: enrichedData.spread,
            stale: enrichedData.stale,
            session: enrichedData.volatility?.session,
            rsi: enrichedData.technical?.rsi14,
            atr: enrichedData.technical?.atr14,
            trend: getTrendFromEMAs(enrichedData.technical),
            levels: enrichedData.levels
          },
          
          // Try to get news risk (optional)
          news_risk: await getNewsRisk(symbol),
          
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback to basic data
        const response = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${polygonApiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          const ticker = data.results;

          if (ticker) {
            const currentPrice = ticker.last_trade?.price || ticker.prevDay?.c || 0;
            const previousClose = ticker.prevDay?.c || currentPrice;
            const change = currentPrice - previousClose;
            const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

            updates.push({
              symbol,
              price: currentPrice,
              change,
              changePercent,
              volume: ticker.prevDay?.v || 0,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching enriched data for ${symbol}:`, error);
    }
  }

  return updates;
}

function getMarketType(symbol: string): string {
  if (symbol.includes('/')) {
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY')) {
      if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('CRYPTO')) {
        return 'crypto';
      }
      return 'forex';
    }
  }
  return 'stocks';
}

function getTrendFromEMAs(technical: any): string {
  if (!technical) return 'neutral';
  
  const { ema20, ema50, ema200 } = technical;
  if (ema20 > ema50 && ema50 > ema200) return 'bullish';
  if (ema20 < ema50 && ema50 < ema200) return 'bearish';
  return 'neutral';
}

async function getNewsRisk(symbol: string): Promise<any> {
  try {
    // Try to get news risk for the symbol's base currency
    const base = symbol.split('/')[0] || 'USD';
    const quote = symbol.split('/')[1] || 'USD';
    
    const response = await fetch('http://localhost:54321/functions/v1/news-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base, quote, lookback_minutes: 30 })
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log(`News risk unavailable for ${symbol}:`, error.message);
  }
  
  return { event_risk: false, headline_hits_30m: 0 };
}

async function handleAnalysisRequest(connection: ClientConnection, request: any) {
  try {
    const { symbols, analysisType = 'comprehensive' } = request;
    
    connection.socket.send(JSON.stringify({
      type: 'analysis_started',
      symbols,
      timestamp: new Date().toISOString()
    }));

    // Generate AI analysis for each symbol
    for (const symbol of symbols.slice(0, 3)) { // Limit to 3 symbols for real-time analysis
      try {
        const analysis = await generateQuickAnalysis(symbol);
        
        connection.socket.send(JSON.stringify({
          type: 'analysis_result',
          symbol,
          analysis,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
        
        connection.socket.send(JSON.stringify({
          type: 'analysis_error',
          symbol,
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }

    connection.socket.send(JSON.stringify({
      type: 'analysis_completed',
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error("Error handling analysis request:", error);
    
    connection.socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process analysis request',
      timestamp: new Date().toISOString()
    }));
  }
}

async function generateQuickAnalysis(symbol: string) {
  try {
    // Fetch current market data
    const response = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${polygonApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }

    const data = await response.json();
    const ticker = data.results;

    if (!ticker) {
      throw new Error(`No data available for ${symbol}`);
    }

    const currentPrice = ticker.last_trade?.price || ticker.prevDay?.c || 0;
    const previousClose = ticker.prevDay?.c || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Generate AI analysis
    const prompt = `
Provide a quick technical analysis for ${symbol}:
- Current Price: $${currentPrice}
- Change: ${change.toFixed(2)} (${changePercent.toFixed(2)}%)
- Previous Close: $${previousClose}

Give a brief analysis (2-3 sentences) focusing on:
1. Current trend
2. Key support/resistance levels
3. Trading recommendation

Be concise and actionable.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a professional day trader providing quick, actionable market analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    return {
      symbol,
      price: currentPrice,
      change,
      changePercent,
      analysis,
      sentiment: changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error generating analysis for ${symbol}:`, error);
    throw error;
  }
}