import { useParams } from "react-router-dom";
import { ArrowLeft, Star, Share2, Bell, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";
import { TradingChart } from "@/components/TradingChart";

export const SymbolDetail = () => {
  const { symbol } = useParams();

  // Mock data - would be fetched based on symbol
  const symbolData = {
    symbol: symbol?.toUpperCase() || "AAPL",
    name: "Apple Inc.",
    price: 185.25,
    change: 3.45,
    changePercent: 1.89,
    volume: "45.2M",
    marketCap: "2.85T",
    rsi: 68,
    macd: "Bullish",
    bb: "Near Upper Band",
    sma20: 182.45,
    sma50: 179.23,
    aiSentiment: "bullish" as const,
    aiSummary: "Strong technical indicators suggest continued upward momentum. Support at $180, resistance at $190. Recent earnings beat expectations.",
    confidenceScore: 85,
  };

  const isPositive = symbolData.change > 0;

  const technicalIndicators = [
    { name: "RSI (14)", value: symbolData.rsi, status: symbolData.rsi > 70 ? "Overbought" : symbolData.rsi < 30 ? "Oversold" : "Neutral" },
    { name: "MACD", value: symbolData.macd, status: "Bullish" },
    { name: "Bollinger Bands", value: symbolData.bb, status: "Near Upper" },
    { name: "SMA 20", value: `$${symbolData.sma20}`, status: "Above" },
    { name: "SMA 50", value: `$${symbolData.sma50}`, status: "Above" },
  ];

  const news = [
    {
      id: 1,
      title: "Apple Reports Strong Q4 Earnings, Beats Estimates",
      source: "Financial Times",
      time: "2 hours ago",
      sentiment: "positive"
    },
    {
      id: 2,
      title: "New iPhone Sales Exceed Analyst Projections",
      source: "Reuters",
      time: "5 hours ago",
      sentiment: "positive"
    },
    {
      id: 3,
      title: "Apple Services Revenue Hits New Record High",
      source: "Bloomberg",
      time: "1 day ago",
      sentiment: "positive"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="/"><ArrowLeft className="h-5 w-5" /></a>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{symbolData.symbol}</h1>
              <p className="text-muted-foreground">{symbolData.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Price Card */}
        <Card className="bg-gradient-card border-border mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  ${symbolData.price.toLocaleString()}
                </div>
                <div className={`flex items-center text-lg ${isPositive ? 'text-bull' : 'text-bear'}`}>
                  {isPositive ? <TrendingUp className="h-5 w-5 mr-2" /> : <TrendingDown className="h-5 w-5 mr-2" />}
                  <span className="font-medium">
                    {symbolData.change > 0 ? '+' : ''}{symbolData.change.toFixed(2)} ({symbolData.changePercent > 0 ? '+' : ''}{symbolData.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <span className="text-muted-foreground">Volume: </span>
                  <span className="font-medium">{symbolData.volume}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Market Cap: </span>
                  <span className="font-medium">${symbolData.marketCap}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart and Tabs */}
          <div className="lg:col-span-2">
            {/* Trading Chart */}
            <TradingChart symbol={symbolData.symbol} className="mb-6" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-secondary">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="indicators">Indicators</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Sector: </span>
                        <span className="font-medium">Technology</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry: </span>
                        <span className="font-medium">Consumer Electronics</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Employees: </span>
                        <span className="font-medium">161,000</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Founded: </span>
                        <span className="font-medium">1976</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="indicators" className="mt-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Technical Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {technicalIndicators.map((indicator, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <div className="font-medium">{indicator.name}</div>
                            <div className="text-sm text-muted-foreground">{indicator.value}</div>
                          </div>
                          <Badge variant={indicator.status === "Bullish" || indicator.status === "Above" ? "default" : "secondary"}>
                            {indicator.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="news" className="mt-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Related News</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {news.map((article) => (
                        <div key={article.id} className="p-4 bg-secondary/50 rounded-lg">
                          <h3 className="font-medium mb-2">{article.title}</h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{article.source}</span>
                            <span>{article.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="mt-6">
                <Card className="bg-gradient-card border-border">
                  <CardHeader>
                    <CardTitle>Price Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-muted-foreground mb-4">No alerts set for this symbol</div>
                      <Button variant="trading">
                        <Bell className="h-4 w-4 mr-2" />
                        Create Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Analysis Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gradient-accent border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  🤖 AI Analysis
                  <Badge variant="default" className="ml-2">
                    {symbolData.confidenceScore}% Confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Sentiment:</span>
                    <div className={`text-lg font-bold ${symbolData.aiSentiment === 'bullish' ? 'text-bull' : symbolData.aiSentiment === 'bearish' ? 'text-bear' : 'text-neutral'}`}>
                      {symbolData.aiSentiment.toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">AI Summary:</span>
                    <p className="text-sm mt-2">{symbolData.aiSummary}</p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button variant="bullish" className="w-full">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Strong Buy Signal
                    </Button>
                    <Button variant="outline" className="w-full">
                      Get Detailed Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52W High:</span>
                  <span className="font-medium">$199.62</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52W Low:</span>
                  <span className="font-medium">$164.08</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Volume:</span>
                  <span className="font-medium">58.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio:</span>
                  <span className="font-medium">29.85</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};