import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const marketTypes = [
  { value: "all", label: "All Markets" },
  { value: "stocks", label: "Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "indices", label: "Indices" },
];

const trendFilters = [
  { value: "all", label: "All", icon: null },
  { value: "bullish", label: "Bullish", icon: TrendingUp },
  { value: "bearish", label: "Bearish", icon: TrendingDown },
  { value: "neutral", label: "Neutral", icon: Minus },
];

export interface MarketFilters {
  marketType: string;
  trend: string;
  timeframe: string;
}

interface MarketFiltersProps {
  filters: MarketFilters;
  onFiltersChange: (filters: MarketFilters) => void;
}

export const MarketFilters = ({ filters, onFiltersChange }: MarketFiltersProps) => {
  return (
    <div className="bg-gradient-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Market Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Market:</span>
          <Select 
            value={filters.marketType} 
            onValueChange={(value) => onFiltersChange({ ...filters, marketType: value })}
          >
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {marketTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trend Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Trend:</span>
          <div className="flex space-x-1">
            {trendFilters.map((filter) => {
              const Icon = filter.icon;
              const isSelected = filters.trend === filter.value;
              return (
                <Button
                  key={filter.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="border-border hover:border-primary"
                  onClick={() => onFiltersChange({ ...filters, trend: filter.value })}
                >
                  {Icon && <Icon className="h-4 w-4 mr-1" />}
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
          <Select 
            value={filters.timeframe} 
            onValueChange={(value) => onFiltersChange({ ...filters, timeframe: value })}
          >
            <SelectTrigger className="w-24 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="1h">1H</SelectItem>
              <SelectItem value="4h">4H</SelectItem>
              <SelectItem value="1d">1D</SelectItem>
              <SelectItem value="1w">1W</SelectItem>
              <SelectItem value="1m">1M</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};