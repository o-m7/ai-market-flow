import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const polygonApiKey = Deno.env.get('POLYGON_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!polygonApiKey || !openaiApiKey) {
      throw new Error('Required API keys not configured');
    }

    // Fetch data for major market indices
    const majorIndices = ['SPY', 'QQQ', 'IWM', 'VIX'];
    const cryptoIndices = ['X:BTCUSD', 'X:ETHUSD'];
    const forexPairs = ['C:EURUSD', 'C:GBPUSD', 'C:USDJPY'];

    const promises = [];
    
    // Fetch recent data for major indices
    for (const symbol of [...majorIndices, ...cryptoIndices, ...forexPairs]) {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/2025-09-20/2025-09-22?adjusted=true&sort=asc&apikey=${polygonApiKey}`;
      promises.push(
        fetch(url).then(res => res.json()).then(data => ({
          symbol,
          data: data.results || []
        }))
      );
    }

    const marketData = await Promise.all(promises);
    
    // Calculate basic market metrics
    const analysis = {
      indices: {},
      crypto: {},
      forex: {},
      summary: {}
    };

    marketData.forEach(({ symbol, data }) => {
      if (data.length >= 2) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        const change = ((latest.c - previous.c) / previous.c) * 100;
        
        const metric = {
          symbol,
          price: latest.c,
          change: change,
          volume: latest.v,
          high: latest.h,
          low: latest.l
        };

        if (majorIndices.includes(symbol)) {
          analysis.indices[symbol] = metric;
        } else if (cryptoIndices.includes(symbol)) {
          analysis.crypto[symbol] = metric;
        } else if (forexPairs.includes(symbol)) {
          analysis.forex[symbol] = metric;
        }
      }
    });

    // Create comprehensive market summary
    const marketSummary = `
Market Data Summary:
Stock Indices: ${Object.entries(analysis.indices).map(([k,v]: [string, any]) => `${k}: ${v.change.toFixed(2)}%`).join(', ')}
Crypto: ${Object.entries(analysis.crypto).map(([k,v]: [string, any]) => `${k}: ${v.change.toFixed(2)}%`).join(', ')}
Forex: ${Object.entries(analysis.forex).map(([k,v]: [string, any]) => `${k}: ${v.change.toFixed(2)}%`).join(', ')}
`;

    // AI Analysis of macro conditions
    const prompt = `Analyze the current macro market conditions based on the following data:

${marketSummary}

Provide analysis in JSON format:
{
  "market_regime": "risk_on|risk_off|mixed|transitional",
  "overall_sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0,
  "sector_rotation": {
    "favored_sectors": ["sector1", "sector2"],
    "avoid_sectors": ["sector1", "sector2"]
  },
  "volatility_environment": "high|medium|low",
  "key_themes": ["theme1", "theme2", "theme3"],
  "trading_implications": {
    "equity_outlook": "bullish|bearish|neutral",
    "crypto_outlook": "bullish|bearish|neutral", 
    "forex_outlook": "dollar_strength|dollar_weakness|mixed",
    "recommended_positioning": "aggressive|defensive|balanced"
  },
  "risk_factors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "macro_summary": "Brief summary of current macro environment"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a macro market analyst providing institutional-level market analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    });

    const aiData = await openaiResponse.json();
    
    let macroAnalysis;
    try {
      macroAnalysis = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      // Fallback analysis
      macroAnalysis = {
        market_regime: 'mixed',
        overall_sentiment: 'neutral',
        confidence: 0.5,
        sector_rotation: {
          favored_sectors: ['Technology', 'Healthcare'],
          avoid_sectors: ['Energy']
        },
        volatility_environment: 'medium',
        key_themes: ['Market uncertainty', 'Mixed signals'],
        trading_implications: {
          equity_outlook: 'neutral',
          crypto_outlook: 'neutral',
          forex_outlook: 'mixed',
          recommended_positioning: 'balanced'
        },
        risk_factors: ['Economic uncertainty'],
        opportunities: ['Selective opportunities'],
        macro_summary: 'Mixed market conditions with selective opportunities'
      };
    }

    const result = {
      market_data: analysis,
      macro_analysis: macroAnalysis,
      timestamp: new Date().toISOString(),
      data_points: marketData.length
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in macro-market-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});