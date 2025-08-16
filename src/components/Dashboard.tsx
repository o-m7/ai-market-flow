import { Navigation } from "./Navigation";
import { MarketFilters } from "./MarketFilters";
import { SymbolCard } from "./SymbolCard";
import { AIAssistant } from "./AIAssistant";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { RealtimeStatus } from "./RealtimeStatus";
import { usePolygonData } from "@/hooks/usePolygonData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const Dashboard = () => {
  const { data: marketData, loading, error, lastUpdated, refetch } = usePolygonData();
  
  console.log("Dashboard component is rendering");
  
  // Calculate dynamic stats based on real data
  const bullishCount = marketData.filter(s => s.aiSentiment === 'bullish').length;
  const bearishCount = marketData.filter(s => s.aiSentiment === 'bearish').length;
  const totalCount = marketData.length;
  const bullishPercent = totalCount > 0 ? ((bullishCount / totalCount) * 100).toFixed(1) : '0.0';
  const bearishPercent = totalCount > 0 ? ((bearishCount / totalCount) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Market Overview</h2>
            <p className="text-muted-foreground">
              Live market data powered by Polygon API - {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
            </p>
          </div>
          <Button 
            onClick={refetch} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <MarketFilters />

        {/* Real-time Status */}
        <div className="mb-6">
          <RealtimeStatus />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">
              {error} - Showing fallback data
            </p>
          </div>
        )}

        {/* Symbols Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              ) : (
                marketData.map((symbol) => (
                  <SymbolCard key={symbol.symbol} {...symbol} />
                ))
              )}
            </div>
          </div>
          
          {/* AI Analysis Panel */}
          <div className="lg:col-span-1">
            <AIAnalysisPanel symbols={marketData.map(s => s.symbol)} />
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-bull">+{bullishPercent}%</h3>
            <p className="text-muted-foreground">Bullish Signals</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-bear">-{bearishPercent}%</h3>
            <p className="text-muted-foreground">Bearish Signals</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-neutral">Live</h3>
            <p className="text-muted-foreground">Data Source</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-primary">{totalCount}</h3>
            <p className="text-muted-foreground">Symbols Tracked</p>
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};