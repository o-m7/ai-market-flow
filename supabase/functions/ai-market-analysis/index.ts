import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

let openAIApiKey =
  Deno.env.get('OPENAI_API_KEY') ||
  Deno.env.get('OPEN_AI_API_KEY') ||
  Deno.env.get('OPENAI') ||
  Deno.env.get('OPENAI_KEY') || '';
const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key, x-openai-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MarketAnalysisRequest {
  symbols: string[];
  analysisType: 'technical' | 'fundamental' | 'sentiment' | 'comprehensive';
  timeframe: '1min' | '5min' | '1hour' | '1day';
}

interface AnalysisResult {
  symbol: string;
  analysis: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  tradingSignals: {
    action: 'buy' | 'sell' | 'hold';
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  chartPatterns: string[];
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json().catch(() => null);
    const headerKey = req.headers.get('x-openai-api-key') || req.headers.get('x-openai-key');
    const apiKey = (headerKey as string) ||
      Deno.env.get('OPENAI_API_KEY') ||
      Deno.env.get('OPEN_AI_API_KEY') ||
      Deno.env.get('OPENAI') ||
      Deno.env.get('OPENAI_KEY') || '';

    const debug = requestData?.debug === true;
    const polyPresent = !!polygonApiKey;
    const openaiPresent = !!apiKey;

    if (debug) {
      const symbols = Array.isArray(requestData?.symbols) ? requestData.symbols : [];
      return new Response(JSON.stringify({
        success: true,
        debug: true,
        env: { openaiPresent, polygonPresent: polyPresent },
        headerKeyPresent: !!headerKey,
        symbols,
        timeframe: requestData?.timeframe ?? null,
        analyzed_at: new Date().toISOString(),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!openaiPresent) {
      console.warn('[ai-market-analysis] OPENAI_API_KEY missing - will use heuristic analysis for all symbols');
    }

    if (!polyPresent) {
      console.warn('[ai-market-analysis] POLYGON_API_KEY missing - stock data will use fallback (no Polygon)');
    }

    if (!requestData || !Array.isArray(requestData.symbols) || requestData.symbols.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'symbols[] required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { symbols, analysisType = 'comprehensive', timeframe = '1day' } = requestData;

    console.log(`Analyzing ${symbols.length} symbols with ${analysisType} analysis`);
    const analysisResults: AnalysisResult[] = [];

    for (const symbol of symbols) {
      try {
        // Fetch comprehensive market data
        const marketData = await fetchMarketData(symbol, timeframe);
        
        // Generate AI analysis
        const analysis = await generateAIAnalysis(symbol, marketData, analysisType, apiKey);
        
        analysisResults.push(analysis);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
        
        // Add fallback analysis
        analysisResults.push({
          symbol,
          analysis: `Unable to fetch real-time data for ${symbol}. Using technical indicators suggest monitoring key levels.`,
          sentiment: 'neutral',
          confidence: 0.3,
          keyLevels: { support: [], resistance: [] },
          tradingSignals: { action: 'hold', reasoning: 'Insufficient data', riskLevel: 'medium' },
          chartPatterns: [],
          timestamp: new Date().toISOString()
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results: analysisResults,
      timestamp: new Date().toISOString(),
      analysisType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const rawStatus = error?.status ?? error?.response?.status ?? 500;
    let status = rawStatus;
    if (rawStatus === 401 || rawStatus === 403) status = 401;
    else if (rawStatus >= 500) status = 502;
    const errMsg = typeof error?.message === 'string' ? error.message : 'Unexpected error';
    console.error('Error in ai-market-analysis function:', { rawStatus, mappedStatus: status, errMsg });
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
      results: []
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMarketData(symbol: string, timeframe: string) {
  try {
    const isCrypto = symbol.includes('USD') && symbol.includes('/');
    const isForex = symbol.includes('/') && !symbol.includes('USD/');
    
    if (isCrypto) {
      return await fetchCryptoData(symbol, timeframe);
    } else if (isForex) {
      return await fetchForexData(symbol, timeframe);
    } else {
      // Stocks - use Polygon
      return await fetchStockData(symbol, timeframe);
    }
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw error;
  }
}

async function fetchCryptoData(symbol: string, timeframe: string) {
  try {
    // Convert to Binance format
    const binanceSymbol = symbol.replace('/', '').replace('USD', 'USDT');
    
    // Get current price data
    const tickerResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
    );
    
    if (!tickerResponse.ok) {
      throw new Error(`Failed to fetch crypto ticker for ${symbol}`);
    }
    
    const tickerData = await tickerResponse.json();
    
    // Get historical kline data (30 days)
    const klinesResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1d&limit=30`
    );
    
    let historicalData = [];
    if (klinesResponse.ok) {
      const klines = await klinesResponse.json();
      historicalData = klines.map((kline: any[]) => ({
        t: kline[0], // timestamp
        o: parseFloat(kline[1]), // open
        h: parseFloat(kline[2]), // high
        l: parseFloat(kline[3]), // low
        c: parseFloat(kline[4]), // close
        v: parseFloat(kline[5]) // volume
      }));
    }
    
    return {
      quote: {
        last_trade: { price: parseFloat(tickerData.lastPrice) },
        prevDay: { c: parseFloat(tickerData.prevClosePrice) },
        volume: parseFloat(tickerData.volume)
      },
      history: historicalData,
      symbol,
      timeframe
    };
  } catch (error) {
    console.error(`Error fetching crypto data for ${symbol}:`, error);
    throw error;
  }
}

async function fetchForexData(symbol: string, timeframe: string) {
  try {
    const [base, quote] = symbol.split('/');
    
    // Get current exchange rate
    const currentResponse = await fetch(
      `https://api.exchangerate.host/latest?base=${base}&symbols=${quote}`
    );
    
    if (!currentResponse.ok) {
      throw new Error(`Failed to fetch forex rate for ${symbol}`);
    }
    
    const currentData = await currentResponse.json();
    const currentRate = currentData.rates[quote];
    
    // Get historical data for the last 30 days
    const historicalData = [];
    for (let i = 1; i <= 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const histResponse = await fetch(
          `https://api.exchangerate.host/${dateStr}?base=${base}&symbols=${quote}`
        );
        
        if (histResponse.ok) {
          const histData = await histResponse.json();
          const rate = histData.rates[quote];
          if (rate) {
            historicalData.push({
              t: date.getTime(),
              o: rate,
              h: rate * (1 + Math.random() * 0.002), // Simulate intraday high
              l: rate * (1 - Math.random() * 0.002), // Simulate intraday low
              c: rate,
              v: 0 // Forex doesn't have volume
            });
          }
        }
        
        // Rate limiting for historical requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.log(`Skipping historical data for ${dateStr}`);
      }
    }
    
    // Get previous day rate for comparison
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let prevRate = currentRate;
    
    try {
      const prevResponse = await fetch(
        `https://api.exchangerate.host/${yesterdayStr}?base=${base}&symbols=${quote}`
      );
      
      if (prevResponse.ok) {
        const prevData = await prevResponse.json();
        prevRate = prevData.rates[quote] || currentRate;
      }
    } catch (e) {
      console.log('Could not fetch previous day rate');
    }
    
    return {
      quote: {
        last_trade: { price: currentRate },
        prevDay: { c: prevRate },
        volume: 0
      },
      history: historicalData.reverse(), // Most recent first
      symbol,
      timeframe
    };
  } catch (error) {
    console.error(`Error fetching forex data for ${symbol}:`, error);
    throw error;
  }
}

async function fetchStockData(symbol: string, timeframe: string) {
  try {
    // Get current quote
    const quoteResponse = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${polygonApiKey}`
    );
    
    if (!quoteResponse.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    // Get historical data for technical analysis
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const historyResponse = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${polygonApiKey}`
    );
    
    let historyData = null;
    if (historyResponse.ok) {
      historyData = await historyResponse.json();
    }
    
    return {
      quote: quoteData.results,
      history: historyData?.results || [],
      symbol,
      timeframe
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw error;
  }
}

async function generateAIAnalysis(symbol: string, marketData: any, analysisType: string, apiKey: string): Promise<AnalysisResult> {
  const currentPrice = marketData.quote?.last_trade?.price || marketData.quote?.prevDay?.c || 0;
  const previousClose = marketData.quote?.prevDay?.c || currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
  const volume = marketData.quote?.prevDay?.v || 0;
  
  // Prepare historical data for analysis
  const priceHistory = marketData.history.map((day: any) => ({
    date: new Date(day.t).toISOString(),
    open: day.o,
    high: day.h,
    low: day.l,
    close: day.c,
    volume: day.v
  }));

  const assetType = symbol.includes('/') ? (symbol.includes('USD') && !symbol.startsWith('USD') ? 'cryptocurrency' : 'forex pair') : 'stock';
  
  const prompt = `
As an expert financial analyst, analyze ${symbol} ${assetType} with the following data:

Current Data:
- Current Price: $${currentPrice}
- Previous Close: $${previousClose}
- Change: ${change.toFixed(2)} (${changePercent.toFixed(2)}%)
- Volume: ${volume.toLocaleString()}

Historical Data (Last 30 days):
${priceHistory.slice(-10).map(day => 
  `${day.date.split('T')[0]}: Open $${day.open}, High $${day.high}, Low $${day.low}, Close $${day.close}, Volume ${day.volume}`
).join('\n')}

Analysis Type: ${analysisType}

Please provide a comprehensive analysis including:
1. Technical analysis and chart patterns
2. Support and resistance levels
3. Trading recommendation (buy/sell/hold)
4. Risk assessment
5. Market sentiment
6. Key price levels to watch

Respond in JSON format with the following structure:
{
  "analysis": "detailed analysis text",
  "sentiment": "bullish/bearish/neutral",
  "confidence": 0.0-1.0,
  "keyLevels": {
    "support": [price1, price2],
    "resistance": [price1, price2]
  },
  "tradingSignals": {
    "action": "buy/sell/hold",
    "reasoning": "explanation",
    "riskLevel": "low/medium/high"
  },
  "chartPatterns": ["pattern1", "pattern2"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst with expertise in technical analysis, chart patterns, and market sentiment. Always provide JSON responses in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI API error:', errText);
      throw new Error(errText || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse: string = data.choices?.[0]?.message?.content || '';

    // Parse JSON response robustly
    let analysisData: any = null;
    try {
      analysisData = JSON.parse(aiResponse);
    } catch (_e) {
      const s = aiResponse.indexOf('{');
      const e = aiResponse.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        try {
          analysisData = JSON.parse(aiResponse.slice(s, e + 1));
        } catch (e2) {
          console.error('ai-market-analysis JSON parse failed slice:', aiResponse.slice(0, 200));
          analysisData = null;
        }
      }
    }

    if (!analysisData) {
      return {
        symbol,
        analysis: `Unable to parse AI response. Providing heuristic levels for ${symbol}.`,
        sentiment: 'neutral',
        confidence: 0.4,
        keyLevels: { support: [currentPrice * 0.97], resistance: [currentPrice * 1.03] },
        tradingSignals: { action: 'hold', reasoning: 'AI output not JSON', riskLevel: 'medium' },
        chartPatterns: [],
        timestamp: new Date().toISOString()
      } as AnalysisResult;
    }
    return {
      symbol,
      analysis: analysisData.analysis,
      sentiment: analysisData.sentiment,
      confidence: analysisData.confidence,
      keyLevels: analysisData.keyLevels,
      tradingSignals: analysisData.tradingSignals,
      chartPatterns: analysisData.chartPatterns,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error generating AI analysis for ${symbol}:`, error);
    
    // Fallback analysis
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (changePercent > 2) sentiment = 'bullish';
    else if (changePercent < -2) sentiment = 'bearish';
    
    return {
      symbol,
      analysis: `Technical analysis for ${symbol}: Current price is $${currentPrice} with a ${changePercent.toFixed(2)}% change. The stock is showing ${sentiment} momentum based on recent price action.`,
      sentiment,
      confidence: 0.6,
      keyLevels: {
        support: [currentPrice * 0.95, currentPrice * 0.90],
        resistance: [currentPrice * 1.05, currentPrice * 1.10]
      },
      tradingSignals: {
        action: sentiment === 'bullish' ? 'buy' : sentiment === 'bearish' ? 'sell' : 'hold',
        reasoning: `Based on ${changePercent.toFixed(2)}% price movement and current market conditions`,
        riskLevel: Math.abs(changePercent) > 5 ? 'high' : Math.abs(changePercent) > 2 ? 'medium' : 'low'
      },
      chartPatterns: [],
      timestamp: new Date().toISOString()
    };
  }
}