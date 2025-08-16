import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const polygonApiKey = Deno.env.get('POLYGON_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartAnalysisRequest {
  symbol: string;
  chartData: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
  timeframe: string;
  analysisType: 'technical' | 'pattern' | 'comprehensive';
}

interface ChartAnalysisResult {
  symbol: string;
  analysis: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  technicalIndicators: {
    rsi: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    momentum: 'strong' | 'weak' | 'neutral';
  };
  chartPatterns: string[];
  priceTargets: {
    bullish: number;
    bearish: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
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

    const requestData: ChartAnalysisRequest = await req.json();
    const { symbol, chartData, timeframe, analysisType = 'comprehensive' } = requestData;

    console.log(`Analyzing chart for ${symbol} with ${chartData.length} data points`);

    // Generate comprehensive chart analysis
    const analysis = await generateChartAnalysis(symbol, chartData, timeframe, analysisType);

    return new Response(JSON.stringify({
      success: true,
      result: analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chart-analysis function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      result: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateChartAnalysis(
  symbol: string, 
  chartData: any[], 
  timeframe: string, 
  analysisType: string
): Promise<ChartAnalysisResult> {
  
  if (!chartData || chartData.length === 0) {
    throw new Error('No chart data provided');
  }

  // Calculate technical indicators from chart data
  const prices = chartData.map(d => d.close);
  const highs = chartData.map(d => d.high);
  const lows = chartData.map(d => d.low);
  
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2] || currentPrice;
  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  // Calculate RSI (simplified)
  const rsi = calculateSimpleRSI(prices);
  
  // Identify support and resistance levels
  const supportLevels = findSupportLevels(lows);
  const resistanceLevels = findResistanceLevels(highs);
  
  // Prepare chart data summary for AI analysis
  const chartSummary = {
    symbol,
    timeframe,
    dataPoints: chartData.length,
    currentPrice,
    priceChange: priceChange.toFixed(2),
    highestPrice: Math.max(...highs),
    lowestPrice: Math.min(...lows),
    averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    rsi,
    supportLevels,
    resistanceLevels,
    recentTrend: priceChange > 2 ? 'strongly bullish' : 
                  priceChange > 0 ? 'bullish' : 
                  priceChange < -2 ? 'strongly bearish' : 'bearish',
    volatility: calculateVolatility(prices)
  };

  const prompt = `
As an expert technical analyst, analyze the following chart data for ${symbol}:

Chart Data Summary:
- Symbol: ${chartSummary.symbol}
- Timeframe: ${chartSummary.timeframe}
- Current Price: $${chartSummary.currentPrice.toFixed(2)}
- Price Change: ${chartSummary.priceChange}%
- Trading Range: $${chartSummary.lowestPrice.toFixed(2)} - $${chartSummary.highestPrice.toFixed(2)}
- RSI: ${chartSummary.rsi.toFixed(1)}
- Recent Trend: ${chartSummary.recentTrend}
- Volatility: ${chartSummary.volatility.toFixed(2)}%
- Support Levels: [${supportLevels.map(l => l.toFixed(2)).join(', ')}]
- Resistance Levels: [${resistanceLevels.map(l => l.toFixed(2)).join(', ')}]

Analysis Type: ${analysisType}

Please provide a comprehensive technical analysis including:
1. Overall market sentiment and trend direction
2. Key support and resistance levels analysis
3. Chart patterns identification
4. Trading recommendation with confidence level
5. Price targets for both bullish and bearish scenarios
6. Risk assessment and key factors to watch

Respond in JSON format with the following structure:
{
  "analysis": "detailed analysis text",
  "recommendation": "buy/sell/hold",
  "confidence": 0.0-1.0,
  "keyLevels": {
    "support": [price1, price2, price3],
    "resistance": [price1, price2, price3]
  },
  "technicalIndicators": {
    "rsi": rsi_value,
    "trend": "bullish/bearish/neutral",
    "momentum": "strong/weak/neutral"
  },
  "chartPatterns": ["pattern1", "pattern2"],
  "priceTargets": {
    "bullish": target_price,
    "bearish": target_price
  },
  "riskAssessment": {
    "level": "low/medium/high",
    "factors": ["factor1", "factor2"]
  }
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
            content: 'You are a professional technical analyst with 20+ years of experience in financial markets. Provide detailed, actionable analysis based on chart data. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
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
      recommendation: analysisData.recommendation,
      confidence: analysisData.confidence,
      keyLevels: analysisData.keyLevels,
      technicalIndicators: analysisData.technicalIndicators,
      chartPatterns: analysisData.chartPatterns,
      priceTargets: analysisData.priceTargets,
      riskAssessment: analysisData.riskAssessment,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error generating AI analysis for ${symbol}:`, error);
    
    // Fallback analysis based on technical indicators
    const trend = rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral';
    const recommendation = trend === 'bullish' ? 'buy' : trend === 'bearish' ? 'sell' : 'hold';
    
    return {
      symbol,
      analysis: `Technical analysis for ${symbol}: Current price is $${currentPrice.toFixed(2)} with RSI at ${rsi.toFixed(1)}. The ${timeframe} chart shows ${chartSummary.recentTrend} momentum. Key support at $${Math.min(...supportLevels).toFixed(2)} and resistance at $${Math.max(...resistanceLevels).toFixed(2)}.`,
      recommendation,
      confidence: 0.6,
      keyLevels: {
        support: supportLevels,
        resistance: resistanceLevels
      },
      technicalIndicators: {
        rsi,
        trend,
        momentum: Math.abs(priceChange) > 3 ? 'strong' : 'weak'
      },
      chartPatterns: [],
      priceTargets: {
        bullish: currentPrice * 1.1,
        bearish: currentPrice * 0.9
      },
      riskAssessment: {
        level: chartSummary.volatility > 5 ? 'high' : chartSummary.volatility > 2 ? 'medium' : 'low',
        factors: ['Market volatility', 'Technical indicators']
      },
      timestamp: new Date().toISOString()
    };
  }
}

function calculateSimpleRSI(prices: number[], period: number = 14): number {
  if (prices.length < period) {
    return 50; // Neutral RSI if not enough data
  }
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length - 1; i++) {
    const change = prices[i + 1] - prices[i];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function findSupportLevels(lows: number[]): number[] {
  const levels = [];
  const recentLows = lows.slice(-20); // Look at recent 20 data points
  
  // Find local minima
  for (let i = 1; i < recentLows.length - 1; i++) {
    if (recentLows[i] < recentLows[i - 1] && recentLows[i] < recentLows[i + 1]) {
      levels.push(recentLows[i]);
    }
  }
  
  // Sort and take top 3 most significant levels
  const sortedLevels = levels.sort((a, b) => a - b);
  return sortedLevels.slice(0, 3);
}

function findResistanceLevels(highs: number[]): number[] {
  const levels = [];
  const recentHighs = highs.slice(-20); // Look at recent 20 data points
  
  // Find local maxima
  for (let i = 1; i < recentHighs.length - 1; i++) {
    if (recentHighs[i] > recentHighs[i - 1] && recentHighs[i] > recentHighs[i + 1]) {
      levels.push(recentHighs[i]);
    }
  }
  
  // Sort and take top 3 most significant levels
  const sortedLevels = levels.sort((a, b) => b - a);
  return sortedLevels.slice(0, 3);
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100; // Convert to percentage
}