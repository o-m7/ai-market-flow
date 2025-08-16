import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!polygonApiKey) {
      throw new Error('Polygon API key not configured');
    }

    const requestData: MarketAnalysisRequest = await req.json();
    const { symbols, analysisType = 'comprehensive', timeframe = '1day' } = requestData;

    console.log(`Analyzing ${symbols.length} symbols with ${analysisType} analysis`);

    const analysisResults: AnalysisResult[] = [];

    for (const symbol of symbols) {
      try {
        // Fetch comprehensive market data
        const marketData = await fetchMarketData(symbol, timeframe);
        
        // Generate AI analysis
        const analysis = await generateAIAnalysis(symbol, marketData, analysisType);
        
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

  } catch (error) {
    console.error('Error in ai-market-analysis function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMarketData(symbol: string, timeframe: string) {
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
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw error;
  }
}

async function generateAIAnalysis(symbol: string, marketData: any, analysisType: string): Promise<AnalysisResult> {
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

  const prompt = `
As an expert financial analyst, analyze ${symbol} stock with the following data:

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
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON response
    const analysisData = JSON.parse(aiResponse);
    
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