import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

    // Sanitize and cap payload to avoid 400s and token bloat
    const MAX_BARS = 400;
    const bars = (candles ?? []).slice(-MAX_BARS)
      .map(b => ({
        t: Number(b.t),
        o: Number(b.o),
        h: Number(b.h),
        l: Number(b.l),
        c: Number(b.c),
        v: Number(b.v ?? 0),
      }))
      .filter(b =>
        Number.isFinite(b.t) && Number.isFinite(b.o) &&
        Number.isFinite(b.h) && Number.isFinite(b.l) &&
        Number.isFinite(b.c) && Number.isFinite(b.v)
      );

    if (bars.length < 20) {
      return new Response(JSON.stringify({ error: '>=20 valid candles required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt =
      'You are a professional technical analyst. ' +
      'Return ONLY valid JSON to the provided schema. ' +
      'Columns: t,o,h,l,c,v (t=epoch seconds). ' +
      `Analyze ${symbol} on ${timeframe} in ${market}. ` +
      'Data:\n' + JSON.stringify(bars);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt,
        response_format: {
          type: 'json_schema',
          json_schema: analysisSchema
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      // Bubble up the real status/text so the frontend can see exact error
      return new Response(JSON.stringify({ error: errorText || 'OpenAI call failed' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiText = data.output_text
      ?? data?.output?.[0]?.content?.[0]?.text
      ?? data?.content?.[0]?.text
      ?? '';

    if (!aiText) {
      console.error('OpenAI response missing structured text:', JSON.stringify(data));
      throw new Error('Invalid OpenAI response');
    }

    const parsed = JSON.parse(aiText);

    // Add metadata
    const result = {
      ...parsed,
      symbol,
      timeframe,
      json_version: "1.0.0",
      analyzed_at: new Date().toISOString(),
      candles_analyzed: bars.length
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? 500;
    const body = (e?.response && typeof e.response.text === 'function')
      ? await e.response.text().catch(() => '')
      : (e?.message || '');
    console.error('[ai-analyze] OpenAI error', status, body);
    return new Response(JSON.stringify({ error: body || 'OpenAI call failed' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
