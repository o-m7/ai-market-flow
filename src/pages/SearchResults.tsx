import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, TrendingUp, TrendingDown, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";

interface SearchResult {
  symbol: string;
  name: string;
  type: "stock" | "crypto" | "forex" | "index";
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    price: 185.25,
    change: 3.45,
    changePercent: 1.89,
    volume: "45.2M",
    marketCap: "2.85T"
  },
  {
    symbol: "MSFT", 
    name: "Microsoft Corporation",
    type: "stock",
    price: 378.85,
    change: -2.15,
    changePercent: -0.56,
    volume: "23.1M",
    marketCap: "2.81T"
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    type: "crypto",
    price: 43250.00,
    change: -892.50,
    changePercent: -2.02,
    volume: "1.8B"
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum", 
    type: "crypto",
    price: 2645.80,
    change: -45.20,
    changePercent: -1.68,
    volume: "1.2B"
  }
];

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(query);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchSymbols = async (searchQuery: string) => {
    if (!searchQuery) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('polygon-search', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Search error:', error);
        setResults(mockSearchResults.filter(result => 
          result.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      } else {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults(mockSearchResults.filter(result => 
        result.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      searchSymbols(query);
    }
  }, [query]);

  const filteredResults = results.filter(result => {
    const matchesType = filterType === "all" || result.type === filterType;
    return matchesType;
  });

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
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Search Results</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search symbols, companies, or instruments..."
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 bg-secondary border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="stock">Stocks</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="index">Indices</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="change">Change %</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {filteredResults.length} results for "{query}"
          </p>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          {filteredResults.map((result) => {
            const isPositive = result.change > 0;
            return (
              <Card key={result.symbol} className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-foreground">{result.symbol}</h3>
                        <Badge className={getTypeColor(result.type)}>
                          {result.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{result.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Volume: {result.volume}</span>
                        {result.marketCap && <span>Market Cap: ${result.marketCap}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground mb-1">
                        ${result.price.toLocaleString()}
                      </div>
                      <div className={`flex items-center justify-end text-sm ${isPositive ? 'text-bull' : 'text-bear'}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        <span>
                          {result.change > 0 ? '+' : ''}{result.change.toFixed(2)} ({result.changePercent > 0 ? '+' : ''}{result.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <Button variant="trading" size="sm" asChild>
                        <a href={`/markets/${result.type}/${result.symbol.toLowerCase()}`}>
                          View Analysis
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="border-border hover:border-primary">
                        <Brain className="h-4 w-4 mr-1" />
                        AI Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No results found for "{query}"</div>
            <p className="text-sm text-muted-foreground mb-6">
              Try adjusting your search terms or browse our popular symbols
            </p>
            <Button variant="trading">Browse Popular Symbols</Button>
          </div>
        )}
      </div>

      <AIAssistant />
    </div>
  );
};