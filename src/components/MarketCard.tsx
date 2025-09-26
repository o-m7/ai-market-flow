import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MarketCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  rsi?: number;
  aiSentiment?: 'bullish' | 'bearish' | 'neutral';
  aiSummary?: string;
}

export const MarketCard = ({ 
  symbol, 
  name, 
  price, 
  change, 
  changePercent, 
  volume, 
  rsi, 
  aiSentiment, 
  aiSummary 
}: MarketCardProps) => {
  const isPositive = changePercent > 0;
  const isNeutral = Math.abs(changePercent) < 0.5;

  const getSentimentColor = () => {
    switch (aiSentiment) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRSIColor = () => {
    if (!rsi) return 'text-muted-foreground';
    if (rsi > 70) return 'text-red-500';
    if (rsi < 30) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link to={`/ai-analysis?symbol=${symbol}`} className="block h-full">
        <Card className="h-full hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{symbol}</CardTitle>
                <p className="text-sm text-muted-foreground truncate">{name}</p>
              </div>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  ${price?.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: price > 1000 ? 0 : 4 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositive ? '+' : ''}{change?.toFixed(2)}
                </span>
                <Badge 
                  variant={isPositive ? 'default' : 'destructive'}
                  className={`text-xs ${
                    isPositive 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
                </Badge>
              </div>
            </div>

            {/* Indicators Section */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              {rsi && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">RSI</span>
                  </div>
                  <span className={`text-sm font-medium ${getRSIColor()}`}>
                    {rsi.toFixed(1)}
                  </span>
                </div>
              )}
              
              {volume && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Volume</span>
                  <span className="text-sm font-medium">
                    {volume > 1000000 
                      ? `${(volume / 1000000).toFixed(1)}M`
                      : volume > 1000 
                      ? `${(volume / 1000).toFixed(1)}K`
                      : volume.toLocaleString()
                    }
                  </span>
                </div>
              )}
            </div>

            {/* AI Sentiment */}
            {aiSentiment && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">AI Signal</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs capitalize ${getSentimentColor()} border-current/20`}
                  >
                    {aiSentiment}
                  </Badge>
                </div>
                {aiSummary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {aiSummary}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};