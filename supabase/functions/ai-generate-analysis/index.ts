import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        analysis: {
          status: "insufficient_data",
          risk_note: "OpenAI API key not configured",
          direction: null, trend: null, key_levels: null, momentum: null,
          pattern_candidates: null, succinct_plan: null, confidence: null
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { symbol, asset, timeframe, ohlcv = [], snapshotBase64, finnhubData } = await req.json();

    if (!Array.isArray(ohlcv) || ohlcv.length < 30) {
      return new Response(JSON.stringify({ 
        analysis: {
          status: "insufficient_data", 
          direction: null, 
          trend: null,
          key_levels: null, 
          momentum: null, 
          pattern_candidates: null,
          risk_note: "Not enough bars to analyze", 
          succinct_plan: null, 
          confidence: null
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = ohlcv.slice(-150).map((b: any) => `${b.t},${b.o},${b.h},${b.l},${b.c},${b.v}`).join("\n");

    const system = `You are a cautious trading analyst. Use ONLY provided OHLCV. Do NOT invent values. If uncertain, return status="insufficient_data".`;

    // Build fundamental data context for AI
    let fundamentalContext = "";
    if (finnhubData && Object.keys(finnhubData).length > 0) {
      fundamentalContext = `

FUNDAMENTAL DATA (Finnhub):
${JSON.stringify(finnhubData, null, 2)}`;
    }

    const userText = `
Instrument: ${symbol} (${asset})
Timeframe: ${timeframe}
Columns: t(ms),o,h,l,c,v
Data (most recent last):
${rows}${fundamentalContext}

Return ONLY valid JSON in this exact schema:
{
  "status": "ok|insufficient_data",
  "direction": "bullish|bearish|sideways|null",
  "trend": "string|null",
  "key_levels": { "support":[number,...], "resistance":[number,...] }|null,
  "momentum": "string|null",
  "pattern_candidates": ["string",...]|null,
  "risk_note": "string|null",
  "succinct_plan": "string|null",
  "confidence": 0..1|null
}
No commentary outside JSON.`.trim();

    const content: any[] = [{ type: "text", text: userText }];
    if (snapshotBase64) content.push({ type: "image_url", image_url: { url: snapshotBase64 } });

    const requestBody = {
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: system }, 
        { role: "user", content }
      ]
    };

    console.log('Calling OpenAI API for analysis...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "{}";
    let parsed: any;
    
    try { 
      parsed = JSON.parse(text); 
    } catch {
      // retry once with a hard reminder
      console.log('First parse failed, retrying with stricter prompt...');
      const retryBody = {
        model: "gpt-4o-mini",
        temperature: 0.0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText + "\nREMINDER: Return ONLY valid JSON matching the schema." }
        ]
      };

      const resp2 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retryBody),
      });

      const data2 = await resp2.json();
      text = data2.choices[0]?.message?.content || "{}";
      parsed = JSON.parse(text);
    }

    // basic sanitation
    if (!parsed || parsed.status === "insufficient_data") {
      return new Response(JSON.stringify({ 
        analysis: { status: "insufficient_data", ...parsed } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ analysis: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-generate-analysis function:', error);
    return new Response(JSON.stringify({ 
      analysis: {
        status: "insufficient_data",
        risk_note: error.message || "AI error",
        direction: null, trend: null, key_levels: null, momentum: null,
        pattern_candidates: null, succinct_plan: null, confidence: null
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});