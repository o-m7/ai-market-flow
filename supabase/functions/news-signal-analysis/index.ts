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
    const { symbol, timeframe = '1h' } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!openaiApiKey || !newsApiKey) {
      throw new Error('Required API keys not configured');
    }

    // Fetch recent news for the symbol/market
    const newsQuery = symbol.includes('USD') ? 
      `${symbol.replace('USD', '')} crypto cryptocurrency` : 
      `${symbol} stock market`;
    
    const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(newsQuery)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${newsApiKey}`);
    const newsData = await newsResponse.json();

    // Filter and prepare news articles
    const relevantArticles = newsData.articles?.slice(0, 5)?.map((article: any) => ({
      title: article.title,
      description: article.description,
      publishedAt: article.publishedAt,
      source: article.source?.name
    })) || [];

    // Create AI prompt for news sentiment analysis
    const prompt = `Analyze the following recent news articles for ${symbol} and provide trading signals based on news sentiment:

Recent News Articles:
${relevantArticles.map((article, i) => `${i+1}. ${article.title} - ${article.description} (${article.source})`).join('\n')}

Provide analysis in JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0,
  "news_impact": "high|medium|low",
  "key_drivers": ["factor1", "factor2"],
  "trading_signal": "buy|sell|hold",
  "risk_factors": ["risk1", "risk2"],
  "news_summary": "Brief summary of key news themes",
  "time_horizon": "short|medium|long",
  "volatility_expected": "high|medium|low"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news analyst specializing in sentiment analysis for trading signals. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const aiData = await openaiResponse.json();
    
    let analysis;
    try {
      let content = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      // Fallback analysis
      analysis = {
        sentiment: 'neutral',
        confidence: 0.5,
        news_impact: 'medium',
        key_drivers: ['Mixed market signals'],
        trading_signal: 'hold',
        risk_factors: ['Market uncertainty'],
        news_summary: 'Unable to fully analyze news sentiment',
        time_horizon: 'medium',
        volatility_expected: 'medium'
      };
    }

    const result = {
      symbol,
      timeframe,
      analysis,
      articles_analyzed: relevantArticles.length,
      timestamp: new Date().toISOString(),
      news_articles: relevantArticles
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in news-signal-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});