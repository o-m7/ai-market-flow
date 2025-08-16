import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import TVLightweightChart from "./TVLightweightChart";

interface TradingChartProps {
  symbol?: string;
  className?: string;
}

export const TradingChart = ({ symbol = "AAPL", className }: TradingChartProps) => {
  const [timeframe, setTimeframe] = useState<'1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d'>("1d");
  const [chartType, setChartType] = useState<"candles" | "line" | "area">("candles");

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {symbol} Live Chart
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={chartType === "candles" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("candles")}
            className="text-xs"
          >
            Candles  
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className="text-xs"
          >
            Line
          </Button>
          <Button
            variant={chartType === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("area")}
            className="text-xs"
          >
            Area
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-4 flex-wrap">
          {(["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border bg-card">
          <TVLightweightChart
            symbol={symbol}
            tf={timeframe}
            series={chartType}
            height={420}
            theme="light"
            live
          />
        </div>
      </CardContent>
    </Card>
  );
};