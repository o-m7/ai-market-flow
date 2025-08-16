import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const analysisSchema = {
  name: "TaResult",
  schema: {
    type: "object",
    properties: {
      symbol: { type: "string" },
      timeframe: { type: "string" },
      summary: { type: "string" },
      outlook: { type: "string", enum: ["bullish","bearish","neutral"] },
      levels: {
        type: "object",
        properties: {
          support: { type: "array", items: { type: "number" } },
          resistance: { type: "array", items: { type: "number" } },
          vwap: { type: ["number", "null"] }
        },
        required: ["support","resistance"]
      },
      trade_idea: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["long","short","none"] },
          entry: { type: ["number", "null"] },
          stop: { type: ["number", "null"] },
          targets: { type: "array", items: { type: "number" } },
          rationale: { type: "string" }
        },
        required: ["direction","rationale"]
      },
      confidence: { type: "number" },  // 0-100
      risks: { type: "string" },
      json_version: { type: "string" }
    },
    required: ["summary","outlook","levels","trade_idea","confidence","risks"]
  },
  strict: true
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { symbol, timeframe, market, candles } = await req.json() as {
      symbol: string;
      timeframe: string;
      market: string;
      candles: Array<{t:number,o:number,h:number,l:number,c:number,v:number}>;
    };

    console.log(`Analyzing ${symbol} (${timeframe}) with ${candles?.length || 0} candles`);

    if (!symbol || !Array.isArray(candles) || candles.length < 20) {
      return new Response(JSON.stringify({ error: 'symbol and >=20 candles required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Keep the payload compact to control tokens
    const compact = candles.map(b => [b.t,b.o,b.h,b.l,b.c,b.v]);

    const system = [
      "You are a professional technical analyst with 15+ years of market experience.",
      "Analyze OHLCV data using price action, support/resistance, trend analysis,",
      "and conceptual indicators (EMA20/50/200, RSI, MACD, ATR, Bollinger Bands).",
      "Be precise, data-driven, and provide specific price levels.",
      "Output must strictly follow the JSON schema. No financial advice disclaimers needed."
    ].join(' ');

    const input = {
      symbol,
      timeframe,
      market,
      columns: ["timestamp","open","high","low","close","volume"],
      candles: compact,
      total_bars: candles.length,
      latest_price: candles[candles.length - 1]?.c
    };

    const userPrompt = `
Analyze the following OHLCV candles for ${symbol} on ${timeframe} timeframe in the ${market} market.

The data represents exactly what is visible on the trader's chart. Provide:
1. Technical summary of price action and trend
2. Market outlook (bullish/bearish/neutral) with reasoning  
3. Key support and resistance levels from the actual price data
4. One actionable trade idea with specific entry, stop, and target levels
5. Confidence score (0-100) based on signal strength
6. Primary risks to watch

Data: ${JSON.stringify(input)}

Return structured JSON analysis that a professional trader would find actionable.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast, capable, cost-effective
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: analysisSchema
        },
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    console.log(`AI analysis response for ${symbol}:`, aiContent);
    
    // Parse the structured JSON response
    const parsed = JSON.parse(aiContent);
    
    // Add metadata
    const result = {
      ...parsed,
      symbol,
      timeframe,
      json_version: "1.0.0",
      analyzed_at: new Date().toISOString(),
      candles_analyzed: candles.length
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analyze function:', error);
    
    // Return structured error response
    const errorResponse = {
      error: String(error?.message || error),
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
