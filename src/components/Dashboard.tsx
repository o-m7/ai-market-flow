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
import { MacroAnalysisWidget } from "@/components/MacroAnalysisWidget";
import { NewsSignalWidget } from "@/components/NewsSignalWidget";
import { usePolygonData } from "@/hooks/usePolygonData";
import { getSymbolsByMarketType } from "@/lib/marketSymbols";
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
    const totalVolume = filteredData.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
    const avgRSI = filteredData.reduce((sum, item) => sum + (item.rsi || 50), 0) / filteredData.length;
    
    return { positive, negative, totalVolume, avgRSI };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Market Intelligence Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time market analysis • {filteredData.length} symbols tracked • Live data feed
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full"
              >
                Last update: {new Date(lastUpdated).toLocaleTimeString()}
              </motion.div>
            )}
            <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Market Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gainers</p>
                  <p className="text-2xl font-bold text-green-500">{summaryStats.positive}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Losers</p>
                  <p className="text-2xl font-bold text-red-500">{summaryStats.negative}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500/30 rotate-180" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg RSI</p>
                  <p className="text-2xl font-bold">{summaryStats.avgRSI.toFixed(1)}</p>
                </div>
                <Activity className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">
                    {summaryStats.totalVolume > 1000000000 
                      ? `${(summaryStats.totalVolume / 1000000000).toFixed(1)}B`
                      : summaryStats.totalVolume > 1000000 
                      ? `${(summaryStats.totalVolume / 1000000).toFixed(1)}M`
                      : `${(summaryStats.totalVolume / 1000).toFixed(1)}K`
                    }
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MarketFilters filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {/* Analysis Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <MacroAnalysisWidget />
          <NewsSignalWidget />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <AlertDescription className="text-red-800 dark:text-red-400">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Market Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Live Market Data
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {filteredData.length} symbols
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && filteredData.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No symbols match the current filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredData.map((item, index) => (
                    <motion.div
                      key={item.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <MarketCard
                        symbol={item.symbol}
                        name={item.name}
                        price={item.price}
                        change={item.change}
                        changePercent={item.changePercent}
                        volume={Number(item.volume) || 0}
                        rsi={item.rsi}
                        aiSentiment={item.aiSentiment}
                        aiSummary={item.aiSummary}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};
