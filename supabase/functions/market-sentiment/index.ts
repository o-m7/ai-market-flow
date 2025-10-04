import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketData } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
      throw new Error('Invalid market data provided');
    }

    console.log(`Analyzing sentiment for ${marketData.length} symbols`);

    // Prepare market data summary for AI analysis
    const marketSummary = marketData.map(item => ({
      symbol: item.symbol,
      price: item.price,
      changePercent: item.changePercent,
      high24h: item.high24h,
      low24h: item.low24h
    }));

    // Calculate market metrics
    const bullishCount = marketData.filter(item => item.changePercent > 0).length;
    const bearishCount = marketData.filter(item => item.changePercent < 0).length;
    const avgChange = marketData.reduce((sum, item) => sum + item.changePercent, 0) / marketData.length;
    
    // Calculate volatility (average range as percentage of price)
    const avgVolatility = marketData.reduce((sum, item) => {
      const range = ((item.high24h - item.low24h) / item.price) * 100;
      return sum + range;
    }, 0) / marketData.length;
    
    // Calculate momentum score (-100 to 100)
    const momentumScore = ((bullishCount - bearishCount) / marketData.length) * 100;
    
    // Sort by absolute change to find biggest movers
    const sortedByChange = [...marketData].sort((a, b) => 
      Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );

    const prompt = `You are a quantitative market analyst. Analyze this real-time market data:

CALCULATED METRICS:
- Total symbols: ${marketData.length}
- Bullish: ${bullishCount} (${(bullishCount/marketData.length*100).toFixed(1)}%)
- Bearish: ${bearishCount} (${(bearishCount/marketData.length*100).toFixed(1)}%)
- Average change: ${avgChange.toFixed(2)}%
- Momentum score: ${momentumScore.toFixed(1)}/100
- Average volatility: ${avgVolatility.toFixed(2)}%

TOP MOVERS:
${sortedByChange.slice(0, 8).map(item => 
  `${item.symbol}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}% (Range: $${item.low24h.toFixed(2)}-$${item.high24h.toFixed(2)})`
).join('\n')}

Provide a calculated sentiment assessment in JSON format:
{
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "fearGreedIndex": 0-100,
  "analysis": "Brief 2-sentence technical analysis"
}

Rules:
- BULLISH if momentum > 20 and avgChange > 1%
- BEARISH if momentum < -20 and avgChange < -1%
- Otherwise NEUTRAL
- Fear/Greed: Scale 0-100 based on momentum and avgChange (50 = neutral)
- Analysis: Focus on data, not speculation`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a quantitative financial analyst. Analyze market data using the provided metrics and respond ONLY with valid JSON. Be precise and data-driven.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parse AI response (should be clean JSON with response_format)
    let sentimentData;
    try {
      sentimentData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, aiResponse);
      // Calculated fallback based on actual metrics
      const momentumScore = ((bullishCount - bearishCount) / marketData.length) * 100;
      const fearGreedIndex = Math.min(100, Math.max(0, 50 + (momentumScore * 0.4) + (avgChange * 5)));
      
      sentimentData = {
        sentiment: momentumScore > 20 && avgChange > 1 ? 'BULLISH' : 
                   momentumScore < -20 && avgChange < -1 ? 'BEARISH' : 'NEUTRAL',
        fearGreedIndex: Math.round(fearGreedIndex),
        analysis: `Market momentum at ${momentumScore.toFixed(1)}/100 with ${bullishCount} gainers vs ${bearishCount} decliners. Average move: ${avgChange.toFixed(2)}%.`
      };
    }

    return new Response(
      JSON.stringify({
        sentiment: sentimentData.sentiment,
        fearGreedIndex: sentimentData.fearGreedIndex,
        analysis: sentimentData.analysis,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in market-sentiment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sentiment: 'NEUTRAL',
        fearGreedIndex: 50,
        analysis: 'Unable to analyze market sentiment at this time.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
