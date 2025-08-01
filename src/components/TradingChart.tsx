import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Mock chart data
const generateMockData = (timeframe: string) => {
  const basePrice = 185.25;
  const points = timeframe === "1D" ? 24 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 365;
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = Math.random() * 10 - 5;
    const trend = i * 0.5;
    return {
      time: timeframe === "1D" ? `${i}:00` : timeframe === "1W" ? `Day ${i + 1}` : timeframe === "1M" ? `${i + 1}` : `M${i + 1}`,
      price: basePrice + trend + volatility,
      volume: Math.floor(Math.random() * 50) + 20
    };
  });
};

interface TradingChartProps {
  symbol?: string;
  className?: string;
}

export const TradingChart = ({ symbol = "AAPL", className }: TradingChartProps) => {
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState<"line" | "area">("area");
  
  const data = generateMockData(timeframe);
  const timeframes = ["1D", "1W", "1M", "1Y"];

  return (
    <Card className={`bg-gradient-card border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{symbol} Price Chart</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
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
            <div className="flex bg-secondary rounded-lg p-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="h-8 px-3"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">High: </span>
            <span className="font-medium text-bull">
              ${Math.max(...data.map(d => d.price)).toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Low: </span>
            <span className="font-medium text-bear">
              ${Math.min(...data.map(d => d.price)).toFixed(2)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Avg Volume: </span>
            <span className="font-medium">
              {(data.reduce((sum, d) => sum + d.volume, 0) / data.length).toFixed(1)}M
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};