import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { SymbolCard } from "@/components/SymbolCard";
import { MarketFilters, type MarketFilters as MarketFiltersType } from "@/components/MarketFilters";
import { usePolygonData } from "@/hooks/usePolygonData";
import { getSymbolsByMarketType } from "@/lib/marketSymbols";
import { RefreshCw } from "lucide-react";

export const Dashboard = () => {
  const [filters, setFilters] = useState<MarketFiltersType>({
    marketType: "all",
    trend: "all",
    timeframe: "1d"
  });

  const symbols = useMemo(() => getSymbolsByMarketType(filters.marketType), [filters.marketType]);
  const { data, loading, error, lastUpdated, refetch } = usePolygonData(symbols, 3000); // Live updates every 3 seconds

  // Filter data based on trend
  const filteredData = useMemo(() => {
    if (filters.trend === "all") return data;
    
    return data.filter(item => {
      switch (filters.trend) {
        case "bullish":
          return item.changePercent > 0;
        case "bearish":
          return item.changePercent < 0;
        case "neutral":
          return Math.abs(item.changePercent) < 1;
        default:
          return true;
      }
    });
  }, [data, filters.trend]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Markets Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Polygon API Live Data • {filteredData.length} symbols • Auto-refresh every 3s
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            )}
            <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        <MarketFilters filters={filters} onFiltersChange={setFilters} />

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        <section aria-label="market-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && filteredData.length === 0 && Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}

          {filteredData.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No symbols match the current filters
            </div>
          )}

          {filteredData.map((item) => (
            <SymbolCard
              key={item.symbol}
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change}
              changePercent={item.changePercent}
              volume={item.volume}
              rsi={item.rsi}
              aiSentiment={item.aiSentiment}
              aiSummary={item.aiSummary}
            />
          ))}
        </section>
      </main>
    </div>
  );
};
