import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.53.2";

const client = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        insights: "OpenAI API key not configured. Unable to generate AI insights.",
        analysisType: "market",
        articlesAnalyzed: 0,
        generatedAt: new Date().toISOString(),
        confidence: 'low'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { articles, analysisType = 'market' } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Articles array is required and must not be empty' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize and cap articles
    const sanitized = (articles ?? [])
      .slice(0, 10)
      .map((a: any) => ({
        title: String(a?.title ?? '').slice(0, 240),
        description: String(a?.description ?? '').slice(0, 600),
        source: String(a?.source?.name ?? ''),
        publishedAt: String(a?.publishedAt ?? '')
      }))
      .filter((a: any) => a.title || a.description);

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid articles to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare articles summary for analysis
    const articlesText = sanitized.map((article: any, index: number) => 
      `${index + 1}. Title: ${article.title}\n   Description: ${article.description}\n   Source: ${article.source || 'Unknown'}\n   Published: ${article.publishedAt}`
    ).join('\n\n');

    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'market':
        systemPrompt = `You are a senior financial analyst with expertise in market sentiment analysis. 
        Analyze the provided news articles and provide actionable insights for traders and investors.
        Focus on market trends, sentiment, and potential trading opportunities.`;
        
        userPrompt = `Analyze these financial news articles and provide:
        1. Overall market sentiment (Bullish/Bearish/Neutral) with confidence score
        2. Key market themes and trends
        3. Potential trading opportunities or risks
        4. Sector-specific insights
        5. Short-term and medium-term market outlook
        
        News Articles:
        ${articlesText}
        
        Provide concise, actionable insights that traders can use for decision-making.`;
        break;

      case 'summary':
        systemPrompt = `You are a financial news analyst specializing in creating comprehensive market summaries.
        Synthesize complex financial information into clear, digestible insights.`;
        
        userPrompt = `Create a comprehensive summary of these financial news articles:
        1. Main headlines and key events
        2. Market impact assessment
        3. Important developments by sector
        4. Notable company-specific news
        5. Economic indicators or policy changes mentioned
        
        News Articles:
        ${articlesText}
        
        Focus on the most significant information that could affect markets.`;
        break;

      case 'sentiment':
        systemPrompt = `You are a sentiment analysis expert focusing on financial markets.
        Analyze the emotional tone and implications of financial news.`;
        
        userPrompt = `Analyze the sentiment of these financial news articles:
        1. Overall sentiment score (-100 to +100)
        2. Fear vs Greed indicators
        3. Confidence levels in different sectors
        4. Risk appetite indicators
        5. Contrarian signals or opportunities
        
        News Articles:
        ${articlesText}
        
        Provide quantitative sentiment metrics where possible.`;
        break;

      default:
        throw new Error('Invalid analysis type. Use: market, summary, or sentiment');
    }

    console.log(`Analyzing ${articles.length} articles with ${analysisType} analysis`);

    let insights: string | null = null;

    // Prefer newer Responses API with accessible models, then fall back
    try {
      const r1 = await client.responses.create({
        model: "gpt-4.1-mini-2025-04-14",
        input: `${systemPrompt}\n\n${userPrompt}`,
        max_completion_tokens: 1200
      });
      insights =
        (r1 as any).output_text ??
        (r1 as any).output?.[0]?.content?.[0]?.text ??
        (r1 as any).content?.[0]?.text ??
        null;
    } catch (err: any) {
      console.log("[news-insights] gpt-4.1-mini attempt failed", err?.message || err);
    }

    if (!insights) {
      try {
        const r2 = await client.responses.create({
          model: "gpt-4.1-2025-04-14",
          input: `${systemPrompt}\n\n${userPrompt}`,
          max_completion_tokens: 1200
        });
        insights =
          (r2 as any).output_text ??
          (r2 as any).output?.[0]?.content?.[0]?.text ??
          (r2 as any).content?.[0]?.text ??
          null;
      } catch (err: any) {
        console.log("[news-insights] gpt-4.1 attempt failed", err?.message || err);
      }
    }

    if (!insights) {
      const response = await client.chat.completions.create({
        model: "gpt-5-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: 1200
      });
      insights = response.choices[0]?.message?.content ?? null;
    }

    if (!insights) {
      throw new Error('No insights generated from OpenAI');
    }

    const result = {
      insights,
      analysisType,
      articlesAnalyzed: articles.length,
      generatedAt: new Date().toISOString(),
      confidence: 'high' // Could be enhanced with actual confidence scoring
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    const status = e?.status ?? e?.response?.status ?? 500;
    const body = (e?.response && typeof e.response.text === 'function')
      ? await e.response.text().catch(() => '')
      : (e?.message || '');
    console.error('[news-insights] OpenAI error', status, body);
    return new Response(JSON.stringify({ error: body || 'OpenAI call failed' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});