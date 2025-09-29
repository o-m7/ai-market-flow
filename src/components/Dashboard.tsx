import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { MarketCard } from "@/components/MarketCard";
import { MarketFilters, type MarketFilters as MarketFiltersType } from "@/components/MarketFilters";
import { usePolygonData } from "@/hooks/usePolygonData";
import { getSymbolsByMarketType } from "@/lib/marketSymbols";
import { parseVolumeString } from "@/lib/volumeUtils";
import { RefreshCw, TrendingUp, Activity, DollarSign, BarChart3 } from "lucide-react";

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredData.length) return { positive: 0, negative: 0, totalVolume: 0, avgRSI: 0 };
    
    const positive = filteredData.filter(item => item.changePercent > 0).length;
    const negative = filteredData.filter(item => item.changePercent < 0).length;
    const totalVolume = filteredData.reduce((sum, item) => sum + parseVolumeString(item.volume), 0);
    const avgRSI = filteredData.reduce((sum, item) => sum + (item.rsi || 50), 0) / filteredData.length;
    
    return { positive, negative, totalVolume, avgRSI };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-terminal text-terminal-foreground">
      <Navigation />

      {/* Bloomberg-style terminal header */}
      <div className="bg-terminal-darker border-b border-terminal-border animate-scanline">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-mono-tabular font-bold text-terminal-accent">
                  CAPVIA TERMINAL
                </h1>
                <div className="flex items-center gap-4 text-xs text-terminal-secondary font-mono-tabular">
                  <span>LIVE</span>
                  <span className="animate-pulse text-terminal-green">●</span>
                  <span>{filteredData.length} SYMBOLS</span>
                  <span>|</span>
                  <span>MARKET DATA</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="text-xs text-terminal-secondary font-mono-tabular bg-terminal-darker/50 px-3 py-1 rounded border border-terminal-border">
                  {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch} 
                className="border-terminal-border bg-terminal-darker text-terminal-foreground hover:bg-terminal-border/20 font-mono-tabular"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                REFRESH
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Terminal-style Market Overview Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          <div className="bg-terminal-darker border border-terminal-border rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-terminal-secondary font-mono-tabular mb-1">GAINERS</div>
                <div className="text-2xl font-mono-tabular font-bold text-terminal-green">
                  {summaryStats.positive.toString().padStart(3, '0')}
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-terminal-green/30" />
            </div>
          </div>
          
          <div className="bg-terminal-darker border border-terminal-border rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-terminal-secondary font-mono-tabular mb-1">LOSERS</div>
                <div className="text-2xl font-mono-tabular font-bold text-terminal-red">
                  {summaryStats.negative.toString().padStart(3, '0')}
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-terminal-red/30 rotate-180" />
            </div>
          </div>
          
          <div className="bg-terminal-darker border border-terminal-border rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-terminal-secondary font-mono-tabular mb-1">AVG RSI</div>
                <div className="text-2xl font-mono-tabular font-bold text-terminal-accent">
                  {summaryStats.avgRSI.toFixed(1).padStart(5, ' ')}
                </div>
              </div>
              <Activity className="h-6 w-6 text-terminal-accent/30" />
            </div>
          </div>
          
          <div className="bg-terminal-darker border border-terminal-border rounded-none p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-terminal-secondary font-mono-tabular mb-1">VOLUME</div>
                <div className="text-2xl font-mono-tabular font-bold text-terminal-accent">
                  {summaryStats.totalVolume > 1000000000 
                    ? `${(summaryStats.totalVolume / 1000000000).toFixed(1)}B`
                    : summaryStats.totalVolume > 1000000 
                    ? `${(summaryStats.totalVolume / 1000000).toFixed(1)}M`
                    : `${(summaryStats.totalVolume / 1000).toFixed(1)}K`
                  }
                </div>
              </div>
              <BarChart3 className="h-6 w-6 text-terminal-accent/30" />
            </div>
          </div>
        </motion.div>

        {/* Terminal Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-terminal-darker border border-terminal-border p-4"
        >
          <MarketFilters filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-terminal-red/10 border border-terminal-red/50 p-4 rounded-none"
          >
            <div className="text-terminal-red font-mono-tabular text-sm">ERROR: {error}</div>
          </motion.div>
        )}

        {/* Terminal Market Data Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-terminal-darker border border-terminal-border">
            <div className="bg-terminal border-b border-terminal-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-mono-tabular font-bold text-terminal-accent">LIVE MARKET DATA</span>
                </div>
                <span className="text-xs font-mono-tabular text-terminal-secondary">
                  {filteredData.length} SYMBOLS TRACKED
                </span>
              </div>
            </div>
            
            <div className="p-4">
              {loading && filteredData.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-terminal border border-terminal-border h-32 animate-pulse" />
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 text-terminal-secondary">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <div className="font-mono-tabular">NO DATA MATCHING FILTERS</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
                  {filteredData.map((item, index) => (
                    <motion.div
                      key={item.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * index }}
                    >
                      <MarketCard
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
