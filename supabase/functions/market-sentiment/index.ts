import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    const bullishCount = marketData.filter(item => item.changePercent > 0).length;
    const bearishCount = marketData.filter(item => item.changePercent < 0).length;
    const avgChange = marketData.reduce((sum, item) => sum + item.changePercent, 0) / marketData.length;

    const prompt = `Analyze this market data and provide a market sentiment assessment:

Market Overview:
- Total symbols: ${marketData.length}
- Bullish symbols: ${bullishCount}
- Bearish symbols: ${bearishCount}
- Average change: ${avgChange.toFixed(2)}%

Top 10 Movers:
${marketSummary.slice(0, 10).map(item => 
  `${item.symbol}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
).join('\n')}

Based on this data, provide:
1. A single word sentiment: either "BULLISH", "BEARISH", or "NEUTRAL"
2. A fear/greed index from 0-100 (0=extreme fear, 100=extreme greed)
3. A brief 2-sentence market analysis

Format your response as JSON:
{
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "fearGreedIndex": 0-100,
  "analysis": "brief analysis"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a financial market analyst. Analyze market data and provide clear sentiment indicators. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Parse AI response
    let sentimentData;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to basic calculation
      sentimentData = {
        sentiment: avgChange > 1 ? 'BULLISH' : avgChange < -1 ? 'BEARISH' : 'NEUTRAL',
        fearGreedIndex: Math.min(100, Math.max(0, 50 + (avgChange * 10))),
        analysis: `Market showing ${avgChange >= 0 ? 'positive' : 'negative'} momentum with ${bullishCount} gainers and ${bearishCount} decliners.`
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
