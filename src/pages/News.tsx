import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Newspaper, 
  TrendingUp, 
  Search, 
  ExternalLink, 
  Clock,
  Brain,
  Loader2,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author?: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  fetchedAt: string;
}

interface AIInsights {
  insights: string;
  analysisType: string;
  articlesAnalyzed: number;
  generatedAt: string;
  confidence: string;
}

export default function News() {
  const [searchQuery, setSearchQuery] = useState("stocks OR trading OR finance");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'market' | 'summary' | 'sentiment'>('market');
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All News" },
    { value: "business", label: "Business" },
    { value: "technology", label: "Technology" },
    { value: "general", label: "General" },
    { value: "health", label: "Health" },
    { value: "science", label: "Science" },
    { value: "sports", label: "Sports" },
    { value: "entertainment", label: "Entertainment" }
  ];

  const fetchNews = async () => {
    setLoading(true);
    try {
      const payload = {
        query: searchQuery,
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        pageSize: 20
      };

      const { data, error } = await supabase.functions.invoke('news-fetch', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke function');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setNewsData(data);
      // Clear previous insights when new news is fetched
      setAiInsights(null);

      toast({
        title: "News Updated",
        description: `Fetched ${data.articles?.length || 0} articles`,
      });

    } catch (error: any) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!newsData?.articles || newsData.articles.length === 0) {
      toast({
        title: "No News Available",
        description: "Please fetch news first before generating insights",
        variant: "destructive",
      });
      return;
    }

    setInsightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('news-insights', {
        body: {
          articles: newsData.articles,
          analysisType
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke insights function');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAiInsights(data);

      toast({
        title: "AI Insights Generated",
        description: `Analyzed ${data.articlesAnalyzed} articles with ${analysisType} analysis`,
      });

    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  const getSentimentFromContent = (article: NewsArticle): 'positive' | 'negative' | 'neutral' => {
    const content = `${article.title} ${article.description}`.toLowerCase();
    const positiveWords = ['surge', 'rally', 'gain', 'up', 'rise', 'bull', 'growth', 'profit', 'strong'];
    const negativeWords = ['fall', 'drop', 'decline', 'bear', 'loss', 'crash', 'down', 'weak', 'concern'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "default";
      case "negative": return "destructive";
      default: return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const filteredArticles = newsData?.articles || [];

  const sentimentCounts = filteredArticles.reduce((acc, article) => {
    const sentiment = getSentimentFromContent(article);
    acc[sentiment]++;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Market News & AI Insights
        </h1>
        <p className="text-muted-foreground">
          Real-time financial news with AI-powered market analysis and insights.
        </p>
      </div>

      {/* Market Sentiment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bull" />
            </div>
            <p className="text-2xl font-bold text-bull">{sentimentCounts.positive}</p>
            <p className="text-xs text-muted-foreground">Positive News</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{sentimentCounts.neutral}</p>
            <p className="text-xs text-muted-foreground">Neutral News</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bear rotate-180" />
            </div>
            <p className="text-2xl font-bold text-bear">{sentimentCounts.negative}</p>
            <p className="text-xs text-muted-foreground">Negative News</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search news keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={fetchNews} disabled={loading} className="whitespace-nowrap">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh News
                  </>
                )}
              </Button>
            </div>

            {/* AI Insights Controls */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
              <Select value={analysisType} onValueChange={(value: 'market' | 'summary' | 'sentiment') => setAnalysisType(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Analysis</SelectItem>
                  <SelectItem value="summary">News Summary</SelectItem>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={generateInsights} 
                disabled={insightsLoading || !newsData?.articles?.length}
                variant="outline"
                className="whitespace-nowrap"
              >
                {insightsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate AI Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiInsights && (
        <Card className="bg-gradient-card border-border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Market Insights
              <Badge variant="outline" className="ml-auto">
                {aiInsights.analysisType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiInsights.insights}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Analyzed {aiInsights.articlesAnalyzed} articles</span>
              <span>Generated {formatDate(aiInsights.generatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest News</h2>
          {newsData && (
            <Badge variant="outline">
              {filteredArticles.length} articles
            </Badge>
          )}
        </div>

        {filteredArticles.map((article, index) => {
          const sentiment = getSentimentFromContent(article);
          return (
            <Card key={index} className="bg-gradient-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{article.source.name}</Badge>
                        <Badge 
                          variant={getSentimentBadgeVariant(sentiment)}
                          className={sentiment === "positive" ? "bg-bull/20 text-bull border-bull/30" : 
                                   sentiment === "negative" ? "bg-bear/20 text-bear border-bear/30" : ""}
                        >
                          {sentiment}
                        </Badge>
                        {article.author && (
                          <Badge variant="secondary" className="text-xs">
                            {article.author}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                        {article.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(article.publishedAt)}</span>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {article.urlToImage && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={article.urlToImage} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filteredArticles.length === 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No news found</h3>
            <p className="text-muted-foreground">
              {newsData ? "Try adjusting your search terms or category filter." : "Click 'Refresh News' to load the latest articles."}
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading News</h3>
            <p className="text-muted-foreground">Fetching the latest market news...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}