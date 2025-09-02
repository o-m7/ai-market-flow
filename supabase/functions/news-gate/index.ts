import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const newsApiKey = Deno.env.get('NEWS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RISK_KEYWORDS = [
  "Fed", "FOMC", "ECB", "BoC", "BoE", "CPI", "inflation", "jobs", "rate", 
  "hike", "cut", "Powell", "Macklem", "central bank", "monetary policy",
  "GDP", "unemployment", "NFP", "PPI", "retail sales", "PMI", "economic data"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== NEWS GATE RISK ANALYSIS ===');
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    const { base, quote, lookback_minutes = 30 } = await req.json();
    
    if (!base || !quote) {
      return new Response(JSON.stringify({ 
        error: "base and quote currencies required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing news risk for ${base}/${quote} over last ${lookback_minutes} minutes`);

    // Calculate time window
    const now = new Date();
    const fromTime = new Date(now.getTime() - lookback_minutes * 60 * 1000);
    const fromISO = fromTime.toISOString();

    // Build query with currency keywords and risk keywords
    const currencyTerms = [base, quote];
    const allKeywords = [...new Set([...RISK_KEYWORDS, ...currencyTerms])];
    const query = allKeywords.join(' OR ');

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromISO}&sortBy=publishedAt&language=en&pageSize=50&apiKey=${newsApiKey}`;
    
    console.log('Fetching news from:', url.replace(newsApiKey, '[REDACTED]'));

    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('NewsAPI error:', response.status, error);
      return new Response(JSON.stringify({ 
        error: `NewsAPI error: ${response.status}`,
        event_risk: false,
        headline_hits_30m: 0
      }), {
        status: 200, // Return success with no risk flags
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const articles = data.articles || [];
    
    console.log(`Found ${articles.length} articles in time window`);

    // Filter articles for actual risk events
    let headlineHits = 0;
    let eventRisk = false;
    
    for (const article of articles) {
      if (!article.title || !article.description) continue;
      
      const text = `${article.title} ${article.description}`.toLowerCase();
      
      // Check for high-impact keywords
      const hasRiskKeyword = RISK_KEYWORDS.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      // Check for currency relevance
      const hasCurrencyMention = currencyTerms.some(currency => 
        text.includes(currency.toLowerCase())
      );
      
      if (hasRiskKeyword) {
        headlineHits++;
        
        // Higher weight for currency-specific mentions
        if (hasCurrencyMention) {
          headlineHits += 2;
        }
        
        // Critical risk keywords that trigger event_risk flag
        const criticalKeywords = [
          "emergency", "crisis", "crash", "collapse", "rate decision", 
          "fomc", "fed meeting", "central bank", "policy announcement"
        ];
        
        if (criticalKeywords.some(critical => text.includes(critical))) {
          eventRisk = true;
          console.log(`🚨 Event risk detected: ${article.title}`);
        }
      }
    }
    
    // Risk threshold: 3+ relevant headlines or any critical event
    if (headlineHits >= 3) {
      eventRisk = true;
    }
    
    const result = {
      event_risk: eventRisk,
      headline_hits_30m: headlineHits,
      analyzed_at: new Date().toISOString(),
      lookback_minutes,
      base,
      quote
    };

    console.log('News risk analysis result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in news-gate function:', error);
    
    return new Response(JSON.stringify({ 
      event_risk: false,
      headline_hits_30m: 0,
      error: error.message || 'Failed to analyze news risk',
      timestamp: new Date().toISOString()
    }), {
      status: 200, // Return success with no risk to avoid breaking the flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});