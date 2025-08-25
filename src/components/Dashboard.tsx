import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { SymbolCard } from "@/components/SymbolCard";
import { usePolygonData } from "@/hooks/usePolygonData";
import { getSymbolsByMarketType } from "@/lib/marketSymbols";
import { RefreshCw } from "lucide-react";

export const Dashboard = () => {
  // Choose a balanced default list (crypto + forex focus per project defaults)
  const symbols = useMemo(() => getSymbolsByMarketType("all"), []);
  const { data, loading, error, lastUpdated, refetch } = usePolygonData(symbols, 10000);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Markets Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live snapshot of top crypto and forex pairs</p>
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

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        <section aria-label="market-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && data.length === 0 && Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}

          {data.map((item) => (
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
