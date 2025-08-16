import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      console.error('NEWS_API_KEY environment variable not found');
      throw new Error('NEWS_API_KEY not configured');
    }

    console.log('NEWS_API_KEY present:', newsApiKey ? 'Yes' : 'No');

    const { query = 'stocks OR trading OR finance', category, country = 'us', pageSize = 20 } = await req.json();

    console.log('Request payload:', { query, category, country, pageSize });

    let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${pageSize}&apiKey=${newsApiKey}`;
    
    // If category is specified, use top-headlines endpoint instead
    if (category) {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
    }

    console.log('Fetching news from:', url.replace(newsApiKey, '[REDACTED]'));

    const response = await fetch(url);
    console.log('NewsAPI response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('NewsAPI error:', response.status, error);
      return new Response(JSON.stringify({ 
        error: `NewsAPI error: ${response.status}`,
        details: error 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('NewsAPI response data:', {
      status: data.status,
      totalResults: data.totalResults,
      articlesCount: data.articles?.length || 0
    });
    
    // Filter out articles with missing essential data
    const filteredArticles = data.articles?.filter((article: any) => 
      article.title && 
      article.description && 
      article.title !== '[Removed]' &&
      article.description !== '[Removed]'
    ) || [];

    const result = {
      ...data,
      articles: filteredArticles,
      fetchedAt: new Date().toISOString()
    };

    console.log('Returning result with', filteredArticles.length, 'filtered articles');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in news-fetch function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch news',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});