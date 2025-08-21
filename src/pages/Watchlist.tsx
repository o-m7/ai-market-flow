import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, TrendingUp, TrendingDown, Trash2, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "forex" | "index";
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  rsi: number;
  alerts: number;
  addedDate: string;
}

const mockWatchlist: WatchlistItem[] = [
  {
    id: "1",
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    price: 185.25,
    change: 3.45,
    changePercent: 1.89,
    volume: "45.2M",
    rsi: 68,
    alerts: 2,
    addedDate: "2024-01-15"
  },
  {
    id: "2", 
    symbol: "BTC-USD",
    name: "Bitcoin",
    type: "crypto",
    price: 43250.00,
    change: -892.50,
    changePercent: -2.02,
    volume: "1.8B",
    rsi: 45,
    alerts: 1,
    addedDate: "2024-01-10"
  },
  {
    id: "3",
    symbol: "TSLA",
    name: "Tesla Inc.",
    type: "stock", 
    price: 238.50,
    change: 12.75,
    changePercent: 5.65,
    volume: "89.3M",
    rsi: 78,
    alerts: 3,
    addedDate: "2024-01-08"
  },
  {
    id: "4",
    symbol: "EUR/USD",
    name: "Euro to US Dollar",
    type: "forex",
    price: 1.0892,
    change: 0.0024,
    changePercent: 0.22,
    volume: "892M",
    rsi: 52,
    alerts: 0,
    addedDate: "2024-01-05"
  }
];

export const Watchlist = () => {
  const [watchlistItems, setWatchlistItems] = useState(mockWatchlist);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredItems = watchlistItems.filter(item => 
    filterType === "all" || item.type === filterType
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "alphabetical":
        return a.symbol.localeCompare(b.symbol);
      case "performance":
        return b.changePercent - a.changePercent;
      case "recent":
      default:
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    }
  });

  const removeFromWatchlist = (id: string) => {
    setWatchlistItems(items => items.filter(item => item.id !== id));
  };

  const getTotalValue = () => {
    return watchlistItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getAverageChange = () => {
    if (watchlistItems.length === 0) return 0;
    return watchlistItems.reduce((sum, item) => sum + item.changePercent, 0) / watchlistItems.length;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "stock": return "bg-blue-500/10 text-blue-400";
      case "crypto": return "bg-orange-500/10 text-orange-400"; 
      case "forex": return "bg-green-500/10 text-green-400";
      case "index": return "bg-purple-500/10 text-purple-400";
      default: return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Watchlist</h1>
            <p className="text-muted-foreground">Track your favorite symbols and get real-time updates</p>
          </div>
          <Button variant="trading" className="animate-scale-in">
            <Plus className="h-4 w-4 mr-2" />
            Add Symbol
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground">{watchlistItems.length}</h3>
                <p className="text-muted-foreground">Symbols Tracked</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground">${getTotalValue().toLocaleString()}</h3>
                <p className="text-muted-foreground">Total Value</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className={`text-2xl font-bold ${getAverageChange() >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {getAverageChange() >= 0 ? '+' : ''}{getAverageChange().toFixed(2)}%
                </h3>
                <p className="text-muted-foreground">Avg. Change</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 bg-secondary border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="index">Indices</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-4">
          {sortedItems.map((item) => {
            const isPositive = item.change > 0;
            return (
              <Card key={item.id} className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 animate-fade-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Star className="h-5 w-5 text-primary fill-current" />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold text-foreground">{item.symbol}</h3>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type.toUpperCase()}
                          </Badge>
                          {item.alerts > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {item.alerts} Alert{item.alerts > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Added {new Date(item.addedDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Metrics */}
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Volume</div>
                        <div className="font-medium">{item.volume}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">RSI</div>
                        <div className={`font-medium ${item.rsi > 70 ? 'text-bear' : item.rsi < 30 ? 'text-bull' : 'text-neutral'}`}>
                          {item.rsi}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">
                          ${item.price.toLocaleString()}
                        </div>
                        <div className={`flex items-center text-sm ${isPositive ? 'text-bull' : 'text-bear'}`}>
                          {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          <span>
                            {item.change > 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild className="border-border hover:border-primary">
                          <Link to={`/ai-analysis?symbol=${item.symbol}&type=${item.type}`}>
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromWatchlist(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No symbols in your watchlist</h3>
            <p className="text-muted-foreground mb-6">
              {filterType === "all" 
                ? "Start building your watchlist by adding symbols you want to track" 
                : `No ${filterType} symbols found in your watchlist`}
            </p>
            <Button variant="trading">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Symbol
            </Button>
          </div>
        )}
      </div>

      <AIAssistant />
    </div>
  );
};