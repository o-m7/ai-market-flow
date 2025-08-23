import { Navigation } from "./Navigation";
import { MarketFilters, type MarketFilters as MarketFiltersType } from "./MarketFilters";
import { SymbolCard } from "./SymbolCard";
import { AIAssistant } from "./AIAssistant";
import { PremiumGateway } from "./PremiumGateway";
import { usePolygonData } from "@/hooks/usePolygonData";
import { getSymbolsByMarketType } from "@/lib/marketSymbols";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

export const Dashboard = () => {
  const [filters, setFilters] = useState<MarketFiltersType>({
    marketType: 'all',
    trend: 'all',
    timeframe: '1d'
  });

  // Get symbols based on selected market type
  const symbols = useMemo(() => getSymbolsByMarketType(filters.marketType), [filters.marketType]);
  
  const { data: marketData, loading, error, lastUpdated, refetch } = usePolygonData(symbols);
  
  // Enhanced filtering logic for trend and search
  const filteredData = useMemo(() => {
    let filtered = [...marketData];

    // Apply trend filter
    if (filters.trend !== 'all') {
      filtered = filtered.filter(symbol => symbol.aiSentiment === filters.trend);
    }
    
    return filtered;
  }, [marketData, filters.trend]);
  
  console.log("Dashboard rendering:", {
    totalSymbols: marketData.length,
    filteredSymbols: filteredData.length,
    currentFilter: filters
  });
  
  // Calculate dynamic stats based on filtered data
  const stats = useMemo(() => {
    const bullishCount = filteredData.filter(s => s.aiSentiment === 'bullish').length;
    const bearishCount = filteredData.filter(s => s.aiSentiment === 'bearish').length;
    const neutralCount = filteredData.filter(s => s.aiSentiment === 'neutral').length;
    const totalCount = filteredData.length;
    
    return {
      bullish: { count: bullishCount, percent: totalCount > 0 ? ((bullishCount / totalCount) * 100).toFixed(1) : '0.0' },
      bearish: { count: bearishCount, percent: totalCount > 0 ? ((bearishCount / totalCount) * 100).toFixed(1) : '0.0' },
      neutral: { count: neutralCount, percent: totalCount > 0 ? ((neutralCount / totalCount) * 100).toFixed(1) : '0.0' },
      total: totalCount
    };
  }, [filteredData]);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Market Dashboard</h2>
            <p className="text-muted-foreground">
              Real-time market data and AI insights - {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
            </p>
            {filters.marketType !== 'all' && (
              <p className="text-sm text-primary mt-1">
                Showing {filters.marketType.toUpperCase()} market{filters.trend !== 'all' ? ` (${filters.trend} trend)` : ''}
              </p>
            )}
          </div>
          <Button 
            onClick={refetch} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <MarketFilters filters={filters} onFiltersChange={setFilters} />

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">
              {error} - Showing fallback data
            </p>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.marketType !== 'all' || filters.trend !== 'all') && (
          <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Active Filters:</span>
                {filters.marketType !== 'all' && (
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                    {filters.marketType.toUpperCase()}
                  </span>
                )}
                {filters.trend !== 'all' && (
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded flex items-center gap-1">
                    {filters.trend === 'bullish' && <TrendingUp className="h-3 w-3" />}
                    {filters.trend === 'bearish' && <TrendingDown className="h-3 w-3" />}
                    {filters.trend === 'neutral' && <BarChart3 className="h-3 w-3" />}
                    {filters.trend.toUpperCase()}
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({ marketType: 'all', trend: 'all', timeframe: '1d' })}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Symbols Grid */}
        <PremiumGateway feature="Real-Time Market Data">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gradient-card border border-border rounded-lg p-6">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-16 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((symbol) => (
                <SymbolCard key={symbol.symbol} {...symbol} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No symbols match your filters</h3>
                  <p>Try adjusting your filter criteria or clearing all filters</p>
                </div>
              </div>
            )}
          </div>
        </PremiumGateway>

        {/* Enhanced Performance Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bull mr-2" />
              <h3 className="text-2xl font-bold text-bull">{stats.bullish.count}</h3>
            </div>
            <p className="text-muted-foreground text-sm">Bullish ({stats.bullish.percent}%)</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-bear mr-2" />
              <h3 className="text-2xl font-bold text-bear">{stats.bearish.count}</h3>
            </div>
            <p className="text-muted-foreground text-sm">Bearish ({stats.bearish.percent}%)</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-neutral mr-2" />
              <h3 className="text-2xl font-bold text-neutral">{stats.neutral.count}</h3>
            </div>
            <p className="text-muted-foreground text-sm">Neutral ({stats.neutral.percent}%)</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <RefreshCw className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-2xl font-bold text-primary">{stats.total}</h3>
            </div>
            <p className="text-muted-foreground text-sm">Total Symbols</p>
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};