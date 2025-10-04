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
  high24h?: number;
  low24h?: number;
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
  high24h,
  low24h,
  rsi, 
  aiSentiment,
  aiSummary 
}: MarketCardProps) => {
  const isPositive = changePercent > 0;
  const isNeutral = Math.abs(changePercent) < 0.5;

  const getSentimentColor = () => {
    switch (aiSentiment) {
      case 'bullish': return 'text-bull';
      case 'bearish': return 'text-bear';
      default: return 'text-neutral';
    }
  };

  const getRSIColor = () => {
    if (!rsi) return 'text-neutral';
    if (rsi > 70) return 'text-bear';
    if (rsi < 30) return 'text-bull';
    return 'text-neutral';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
      className="h-full"
    >
      <Link to={`/ai-analysis?symbol=${symbol}`} className="block h-full">
        <div className="h-full bg-terminal border border-terminal-border hover:border-terminal-accent/50 transition-all duration-200 hover:bg-terminal-darker/50">
          {/* Header */}
          <div className="bg-terminal-darker border-b border-terminal-border p-3">
            <div className="flex items-center justify-between">
              <div className="font-mono-tabular">
                <div className="text-sm font-bold text-terminal-accent">{symbol}</div>
                <div className="text-xs text-terminal-secondary truncate">{name}</div>
              </div>
              <div className="flex items-center">
                {isPositive ? (
                  <div className="text-bull">▲</div>
                ) : (
                  <div className="text-bear">▼</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-3 space-y-3">
            {/* Price Section - Terminal Style */}
            <div>
              <div className="font-mono-tabular text-lg font-bold text-terminal-foreground">
                {price > 1000 
                  ? price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                }
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`font-mono-tabular text-sm ${
                  isPositive ? 'text-bull' : 'text-bear'
                }`}>
                  {isPositive ? '+' : ''}{change?.toFixed(2)}
                </span>
                <div className={`px-1.5 py-0.5 text-xs font-mono-tabular border ${
                  isPositive 
                    ? 'text-bull border-bull/30 bg-bull/5' 
                    : 'text-bear border-bear/30 bg-bear/5'
                }`}>
                  {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Terminal Data Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {rsi && (
                <div className="bg-terminal-darker/50 border border-terminal-border/50 p-2">
                  <div className="text-terminal-secondary font-mono-tabular">RSI</div>
                  <div className={`font-mono-tabular font-bold ${getRSIColor()}`}>
                    {rsi.toFixed(1)}
                  </div>
                </div>
              )}
              
              {high24h !== undefined && low24h !== undefined && (
                <div className="bg-terminal-darker/50 border border-terminal-border/50 p-2">
                  <div className="text-terminal-secondary font-mono-tabular">24H</div>
                  <div className="font-mono-tabular font-bold">
                    <div className="text-terminal-green text-[10px]">${high24h.toFixed(4)}</div>
                    <div className="text-terminal-red text-[10px]">${low24h.toFixed(4)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Signal - Terminal Style */}
            {aiSentiment && (
              <div className="border-t border-terminal-border/50 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-terminal-secondary font-mono-tabular">AI</span>
                  <div className={`px-2 py-1 text-xs font-mono-tabular border ${getSentimentColor()} border-current/30 bg-current/5`}>
                    {aiSentiment.toUpperCase()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};