import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframe } = await req.json();

    if (!symbol) {
      throw new Error('Stock symbol is required');
    }

    console.log(`Analyzing ${symbol} with timeframe ${timeframe}`);

    // Mock market data (in production, you'd fetch real data from a financial API)
    const mockMarketData = {
      symbol: symbol,
      current_price: Math.random() * 200 + 50,
      volume: Math.floor(Math.random() * 10000000),
      high_52w: Math.random() * 250 + 100,
      low_52w: Math.random() * 100 + 20,
      rsi: Math.random() * 100,
      macd_value: (Math.random() - 0.5) * 10,
      bb_upper: Math.random() * 220 + 80,
      bb_lower: Math.random() * 180 + 40,
      sma_20: Math.random() * 200 + 50,
      sma_50: Math.random() * 200 + 50,
    };

    // Create AI prompt for technical analysis
    const analysisPrompt = `
    As an expert financial analyst, analyze the following stock data for ${symbol}:
    
    Current Price: $${mockMarketData.current_price.toFixed(2)}
    52W High: $${mockMarketData.high_52w.toFixed(2)}
    52W Low: $${mockMarketData.low_52w.toFixed(2)}
    RSI: ${mockMarketData.rsi.toFixed(2)}
    MACD: ${mockMarketData.macd_value.toFixed(2)}
    Bollinger Bands: Upper $${mockMarketData.bb_upper.toFixed(2)}, Lower $${mockMarketData.bb_lower.toFixed(2)}
    SMA 20: $${mockMarketData.sma_20.toFixed(2)}
    SMA 50: $${mockMarketData.sma_50.toFixed(2)}
    Volume: ${mockMarketData.volume.toLocaleString()}
    Timeframe: ${timeframe}
    
    Provide a comprehensive technical analysis with:
    1. Buy/Sell/Hold recommendation
    2. Confidence level (0-100%)
    3. Price target
    4. Key support and resistance levels
    5. Brief analysis summary (2-3 sentences)
    6. Top 3 risk factors
    
    Format your response as a JSON object with the following structure:
    {
      "recommendation": "buy|sell|hold",
      "confidence": number,
      "price_target": number,
      "analysis_summary": "string",
      "risk_factors": ["string1", "string2", "string3"],
      "support_level": number,
      "resistance_level": number
    }
    `;

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
            content: 'You are an expert financial analyst specializing in technical analysis. Always respond with valid JSON only.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    console.log('AI Analysis Response:', analysisText);

    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Format final analysis result
    const analysisResult = {
      symbol: symbol.toUpperCase(),
      recommendation: aiAnalysis.recommendation,
      confidence: Math.round(aiAnalysis.confidence),
      price_target: Number(aiAnalysis.price_target.toFixed(2)),
      current_price: Number(mockMarketData.current_price.toFixed(2)),
      technical_indicators: {
        rsi: Number(mockMarketData.rsi.toFixed(1)),
        macd: mockMarketData.macd_value > 0 ? 'Bullish' : 'Bearish',
        bollinger_bands: mockMarketData.current_price > mockMarketData.bb_upper ? 'Overbought' : 
                        mockMarketData.current_price < mockMarketData.bb_lower ? 'Oversold' : 'Neutral',
        moving_averages: mockMarketData.sma_20 > mockMarketData.sma_50 ? 'Bullish Cross' : 'Bearish Cross'
      },
      analysis_summary: aiAnalysis.analysis_summary,
      risk_factors: aiAnalysis.risk_factors || [],
      key_levels: {
        support: Number(aiAnalysis.support_level.toFixed(2)),
        resistance: Number(aiAnalysis.resistance_level.toFixed(2))
      }
    };

    console.log('Final analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stock analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to analyze stock' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});