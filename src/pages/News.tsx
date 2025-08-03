import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Newspaper, 
  TrendingUp, 
  Search, 
  ExternalLink, 
  Clock,
  Filter
} from "lucide-react";

export default function News() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock news data - in a real app, this would come from an API
  const newsItems = [
    {
      id: 1,
      title: "Tech Stocks Rally on AI Optimism",
      summary: "Major technology companies see significant gains as artificial intelligence developments continue to drive investor confidence.",
      source: "MarketWatch",
      category: "Technology",
      sentiment: "positive",
      timestamp: "2 hours ago",
      symbols: ["NVDA", "MSFT", "GOOGL"],
      url: "#"
    },
    {
      id: 2,
      title: "Federal Reserve Hints at Rate Cut",
      summary: "Fed officials suggest potential interest rate adjustments in upcoming meetings, impacting market expectations.",
      source: "Reuters",
      category: "Economic",
      sentiment: "neutral",
      timestamp: "4 hours ago",
      symbols: ["SPY", "QQQ"],
      url: "#"
    },
    {
      id: 3,
      title: "Apple Reports Strong iPhone Sales",
      summary: "Apple exceeds expectations with latest quarterly earnings, driven by robust iPhone demand in international markets.",
      source: "Bloomberg",
      category: "Earnings",
      sentiment: "positive",
      timestamp: "6 hours ago",
      symbols: ["AAPL"],
      url: "#"
    },
    {
      id: 4,
      title: "Energy Sector Faces Headwinds",
      summary: "Oil prices decline amid global economic concerns, putting pressure on energy company valuations.",
      source: "CNBC",
      category: "Energy",
      sentiment: "negative",
      timestamp: "8 hours ago",
      symbols: ["XOM", "CVX"],
      url: "#"
    },
    {
      id: 5,
      title: "Tesla Announces New Gigafactory",
      summary: "Electric vehicle manufacturer reveals plans for expanded production capacity in Southeast Asia.",
      source: "TechCrunch",
      category: "Technology",
      sentiment: "positive",
      timestamp: "12 hours ago",
      symbols: ["TSLA"],
      url: "#"
    },
    {
      id: 6,
      title: "Banking Sector Shows Resilience",
      summary: "Major financial institutions report steady performance despite economic uncertainties and regulatory changes.",
      source: "Financial Times",
      category: "Financial",
      sentiment: "neutral",
      timestamp: "1 day ago",
      symbols: ["JPM", "BAC", "WFC"],
      url: "#"
    }
  ];

  const categories = ["all", "Technology", "Economic", "Earnings", "Energy", "Financial"];

  const marketSentiment = {
    positive: newsItems.filter(item => item.sentiment === "positive").length,
    neutral: newsItems.filter(item => item.sentiment === "neutral").length,
    negative: newsItems.filter(item => item.sentiment === "negative").length,
  };

  const filteredNews = newsItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.symbols.some(symbol => symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-bull";
      case "negative": return "text-bear";
      default: return "text-muted-foreground";
    }
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "default";
      case "negative": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Market News
        </h1>
        <p className="text-muted-foreground">
          Stay updated with the latest financial news and market-moving events.
        </p>
      </div>

      {/* Market Sentiment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bull" />
            </div>
            <p className="text-2xl font-bold text-bull">{marketSentiment.positive}</p>
            <p className="text-xs text-muted-foreground">Positive News</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{marketSentiment.neutral}</p>
            <p className="text-xs text-muted-foreground">Neutral News</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bear rotate-180" />
            </div>
            <p className="text-2xl font-bold text-bear">{marketSentiment.negative}</p>
            <p className="text-xs text-muted-foreground">Negative News</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news, symbols, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.map((item) => (
          <Card key={item.id} className="bg-gradient-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge 
                        variant={getSentimentBadgeVariant(item.sentiment)}
                        className={item.sentiment === "positive" ? "bg-bull/20 text-bull border-bull/30" : 
                                 item.sentiment === "negative" ? "bg-bear/20 text-bear border-bear/30" : ""}
                      >
                        {item.sentiment}
                      </Badge>
                      <div className="flex gap-1">
                        {item.symbols.map((symbol) => (
                          <Badge key={symbol} variant="secondary" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                      {item.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{item.source}</span>
                        <span>{item.timestamp}</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No news found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find relevant news.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}