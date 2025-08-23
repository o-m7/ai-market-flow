import { useState, useRef, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const searchSymbols = async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('polygon-search', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchSymbols(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    const typeMap = {
      stock: 'stocks',
      crypto: 'crypto',
      forex: 'forex',
      index: 'indices'
    };
    
    navigate(`/markets/${typeMap[result.type]}/${result.symbol.toLowerCase()}`);
    setShowResults(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
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
    <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search crypto & forex (e.g., BTC/USD, DOGE/USD, EUR/JPY)"
          className="pl-10 pr-10 bg-secondary border-border focus:border-primary"
        />
      </div>

      {showResults && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-popover border-border shadow-lg z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result, index) => {
                  const isPositive = result.change > 0;
                  return (
                    <div
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center justify-between p-3 rounded hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-foreground">{result.symbol}</span>
                          <Badge className={getTypeColor(result.type)}>
                            {result.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{result.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          ${result.price.toLocaleString()}
                        </div>
                        <div className={`text-sm ${isPositive ? 'text-bull' : 'text-bear'}`}>
                          {result.change > 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : query && !loading ? (
              <div className="p-3 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : loading ? (
              <div className="p-3 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};