import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from "recharts";
import { useBinanceData } from "@/hooks/useBinanceData";
import { Loader2, WifiOff } from "lucide-react";

interface TradingChartProps {
  symbol?: string;
  className?: string;
}

export const TradingChart = ({ symbol = "AAPL", className }: TradingChartProps) => {
  const [timeframe, setTimeframe] = useState("1h");
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  
  // Convert timeframe to Binance interval format
  const getBinanceInterval = (tf: string) => {
    const intervalMap: Record<string, string> = {
      "1m": "1m",
      "5m": "5m", 
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "4h": "4h",
      "1D": "1d",
      "1W": "1w",
      "1M": "1M"
    };
    return intervalMap[tf] || "1h";
  };

  const { data, loading, error, source } = useBinanceData(symbol, getBinanceInterval(timeframe));
  const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"];

  return (
    <Card className={`bg-gradient-card border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">{symbol} Price Chart</CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Badge variant={source === 'binance' ? 'default' : 'secondary'}>
              {source === 'binance' ? 'Live' : 'Demo'}
            </Badge>
            {error && (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
              <Button
                variant={chartType === "candlestick" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("candlestick")}
                className="h-8 px-3"
              >
                Candles
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
                className="h-8 px-3"
              >
                Line
              </Button>
              <Button
                variant={chartType === "area" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("area")}
                className="h-8 px-3"
              >
                Area
              </Button>
            </div>
            
            {/* Timeframe Selector */}
            <div className="flex bg-secondary rounded-lg p-1 max-w-md overflow-x-auto">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="h-8 px-2 text-xs whitespace-nowrap"
                  disabled={loading}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading market data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
            {chartType === "candlestick" ? (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-md p-3 text-xs">
                          <p className="font-medium mb-2">{label}</p>
                           <div className="space-y-1">
                             <p>Open: <span className="font-medium">${data.open}</span></p>
                             <p>High: <span className="font-medium text-bull">${data.high}</span></p>
                             <p>Low: <span className="font-medium text-bear">${data.low}</span></p>
                             <p>Close: <span className="font-medium">${data.close}</span></p>
                             <p>Volume: <span className="font-medium">{data.volume}</span></p>
                           </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Candlestick bodies */}
                <Bar 
                  dataKey={(entry: any) => [entry.low, entry.high]}
                  fill="transparent"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                />
                {/* High-Low wicks */}
                {data.map((entry, index) => (
                  <g key={index}>
                    <line
                      x1={`${(index + 0.5) * (100 / data.length)}%`}
                      y1={`${100 - ((entry.high - Math.min(...data.map(d => d.low))) / (Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low)))) * 100}%`}
                      x2={`${(index + 0.5) * (100 / data.length)}%`}
                      y2={`${100 - ((entry.low - Math.min(...data.map(d => d.low))) / (Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low)))) * 100}%`}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                    />
                    <rect
                      x={`${(index + 0.3) * (100 / data.length)}%`}
                      y={`${100 - ((Math.max(entry.open, entry.close) - Math.min(...data.map(d => d.low))) / (Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low)))) * 100}%`}
                      width={`${40 / data.length}%`}
                      height={`${Math.abs(entry.close - entry.open) / (Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low))) * 100}%`}
                      fill={entry.close > entry.open ? "hsl(var(--bull))" : "hsl(var(--bear))"}
                      stroke={entry.close > entry.open ? "hsl(var(--bull))" : "hsl(var(--bear))"}
                    />
                  </g>
                ))}
              </ComposedChart>
            ) : chartType === "area" ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
          )}
        </div>
        
        {/* Chart Stats */}
        {data.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-sm">
              <span className="text-muted-foreground">High: </span>
              <span className="font-medium text-bull">
                ${Math.max(...data.map(d => d.high)).toFixed(2)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Low: </span>
              <span className="font-medium text-bear">
                ${Math.min(...data.map(d => d.low)).toFixed(2)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Avg Volume: </span>
              <span className="font-medium">
                {(data.reduce((sum, d) => sum + d.volume, 0) / data.length).toFixed(0)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Source: </span>
              <span className="font-medium">
                {source === 'binance' ? 'Binance API' : 'Demo Data'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};