import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from "recharts";

// Mock candlestick chart data
const generateMockData = (timeframe: string) => {
  const basePrice = 185.25;
  const points = timeframe === "1D" ? 24 : timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : 365;
  
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (i * 0.5) + (Math.random() * 5 - 2.5);
    const volatility = Math.random() * 8 + 2; // 2-10 range
    const high = open + (Math.random() * volatility);
    const low = open - (Math.random() * volatility);
    const close = low + (Math.random() * (high - low));
    
    // Generate specific times based on timeframe
    let time: string;
    if (timeframe === "1D") {
      const hour = 9 + i; // Market hours 9 AM to 5 PM
      time = `${hour.toString().padStart(2, '0')}:00`;
    } else if (timeframe === "1W") {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      time = days[i % 7];
    } else if (timeframe === "1M") {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      time = `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      const date = new Date();
      date.setMonth(date.getMonth() - (12 - i));
      time = date.toLocaleDateString('en-US', { month: 'short' });
    }
    
    return {
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
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
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  
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
                            <p>Volume: <span className="font-medium">{data.volume}M</span></p>
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
        </div>
        
        {/* Chart Stats */}
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
              {(data.reduce((sum, d) => sum + d.volume, 0) / data.length).toFixed(1)}M
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};