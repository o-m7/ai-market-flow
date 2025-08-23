import { TrendingUp, TrendingDown, Star, Plus, Share2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { QuickAnalysis } from "./QuickAnalysis";

interface SymbolCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  rsi: number;
  aiSentiment: "bullish" | "bearish" | "neutral";
  aiSummary: string;
}

export const SymbolCard = ({ 
  symbol, 
  name, 
  price, 
  change, 
  changePercent, 
  volume, 
  rsi,
  aiSentiment,
  aiSummary 
}: SymbolCardProps) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "text-bull";
      case "bearish": return "text-bear";
      default: return "text-neutral";
    }
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "default";
      case "bearish": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{symbol}</h3>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price and Change */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-foreground mb-1">
            ${price.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center ${isPositive ? 'text-bull' : isNegative ? 'text-bear' : 'text-neutral'}`}>
              {isPositive && <TrendingUp className="h-4 w-4 mr-1" />}
              {isNegative && <TrendingDown className="h-4 w-4 mr-1" />}
              <span className="font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-muted-foreground">Volume:</span>
            <div className="font-medium">{volume}</div>
          </div>
          <div>
            <span className="text-muted-foreground">RSI:</span>
            <div className={`font-medium ${rsi > 70 ? 'text-bear' : rsi < 30 ? 'text-bull' : 'text-neutral'}`}>
              {rsi}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">AI Analysis</span>
            <Badge variant={getSentimentBadgeVariant(aiSentiment)} className="text-xs">
              {aiSentiment.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-foreground line-clamp-2">{aiSummary}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border hover:border-primary">
                <Brain className="h-4 w-4 mr-1" />
                AI Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <QuickAnalysis symbol={symbol} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};