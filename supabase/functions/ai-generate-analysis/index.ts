import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Read API key per-request inside the handler to avoid stale values after secret updates

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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        analysis: {
          status: "insufficient_data",
          risk_note: "OpenAI API key not configured",
          direction: null, trend: null, key_levels: null, momentum: null,
          pattern_candidates: null, succinct_plan: null, confidence: null
        }
      }), {
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

    // Prefer JSON responses from the model
    const requestBody = {
      model: "gpt-5-mini-2025-08-07",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content }
      ]
    } as const;

    console.log('Calling OpenAI API for analysis (json_object)...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let text = "{}";
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({
        analysis: {
          status: "insufficient_data",
          risk_note: `OpenAI API error: ${response.status}`,
          direction: null, trend: null, key_levels: null, momentum: null,
          pattern_candidates: null, succinct_plan: null, confidence: null
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json().catch(() => ({ choices: [] }));
    text = data.choices?.[0]?.message?.content || "{}";

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch (e1) {
      console.warn('First parse failed, attempting to coerce JSON');
      // Try to extract the first JSON object from the text
      const match = text.match(/\{[\s\S]*\}$/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }

      // Last resort: retry once with stricter prompt
      if (!parsed) {
        const retryBody = {
          model: "gpt-5-mini-2025-08-07",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: userText + "\nREMINDER: Return ONLY valid JSON matching the schema." }
          ]
        } as const;

        const resp2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryBody),
        });

        const data2 = await resp2.json().catch(() => ({ choices: [] }));
        const text2 = data2.choices?.[0]?.message?.content || "{}";
        try { parsed = JSON.parse(text2); } catch {}
      }
    }

    if (!parsed || parsed.status === "insufficient_data") {
      return new Response(JSON.stringify({
        analysis: { status: "insufficient_data", ...parsed }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});