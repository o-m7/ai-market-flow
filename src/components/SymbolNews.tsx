import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Newspaper, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  published_at: string;
  sentiment?: string;
  relevance_score?: number;
  image_url?: string;
}

interface SymbolNewsProps {
  symbol: string;
}

export function SymbolNews({ symbol }: SymbolNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);

      try {
        // Extract the base symbol (remove any suffixes like .FOREX)
        const baseSymbol = symbol.split('.')[0];
        
        const { data, error } = await supabase.functions.invoke('news-fetch', {
          body: { 
            query: baseSymbol,
            limit: 5,
            filter_relevant: true 
          }
        });

        if (error) throw error;
        
        setNews(data?.articles || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
      case 'bullish':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'negative':
      case 'bearish':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Market News - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Market News - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load news: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!news.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Market News - {symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent news found for {symbol}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Market News - {symbol}
          <Badge variant="secondary">{news.length} articles</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((article, index) => (
          <div key={article.id || index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-sm leading-tight flex-1">
                {article.title}
              </h3>
              {article.image_url && (
                <img 
                  src={article.image_url} 
                  alt=""
                  className="w-16 h-12 rounded object-cover flex-shrink-0"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(article.published_at)}</span>
              <span>•</span>
              <span>{article.source}</span>
              {article.relevance_score && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(article.relevance_score * 100)}% relevant
                  </Badge>
                </>
              )}
              {article.sentiment && (
                <Badge variant="outline" className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                  {article.sentiment}
                </Badge>
              )}
            </div>

            {article.content && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.content.substring(0, 150)}...
              </p>
            )}

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(article.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Read Full Article
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}