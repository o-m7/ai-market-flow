import { Navigation } from "./Navigation";
import { MarketFilters } from "./MarketFilters";
import { SymbolCard } from "./SymbolCard";
import { AIAssistant } from "./AIAssistant";

// Mock data for demo
const mockSymbols = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 185.25,
    change: 3.45,
    changePercent: 1.89,
    volume: "45.2M",
    rsi: 68,
    aiSentiment: "bullish" as const,
    aiSummary: "Strong technical indicators suggest continued upward momentum. Support at $180, resistance at $190.",
  },
  {
    symbol: "BTC-USD",
    name: "Bitcoin",
    price: 43250.00,
    change: -892.50,
    changePercent: -2.02,
    volume: "1.8B",
    rsi: 45,
    aiSentiment: "bearish" as const,
    aiSummary: "Temporary pullback from recent highs. Key support level at $42,000 being tested.",
  },
  {
    symbol: "EUR/USD",
    name: "Euro to US Dollar",
    price: 1.0892,
    change: 0.0024,
    changePercent: 0.22,
    volume: "892M",
    rsi: 52,
    aiSentiment: "neutral" as const,
    aiSummary: "Consolidating in tight range. ECB policy decision awaited for directional clarity.",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 238.50,
    change: 12.75,
    changePercent: 5.65,
    volume: "89.3M",
    rsi: 78,
    aiSentiment: "bullish" as const,
    aiSummary: "Breakout above $230 resistance. Overbought conditions suggest potential consolidation ahead.",
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 456.78,
    change: 2.34,
    changePercent: 0.51,
    volume: "67.5M",
    rsi: 58,
    aiSentiment: "bullish" as const,
    aiSummary: "Market breadth improving. Sustained move above 455 confirms bullish bias.",
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum",
    price: 2645.80,
    change: -45.20,
    changePercent: -1.68,
    volume: "1.2B",
    rsi: 42,
    aiSentiment: "neutral" as const,
    aiSummary: "Testing support at $2,600. Network upgrades providing fundamental strength.",
  },
];

export const Dashboard = () => {
  console.log("Dashboard component is rendering");
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Market Overview</h2>
          <p className="text-muted-foreground">
            AI-powered insights across global markets - Real-time analysis at your fingertips
          </p>
        </div>

        <MarketFilters />

        {/* Symbols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSymbols.map((symbol) => (
            <SymbolCard key={symbol.symbol} {...symbol} />
          ))}
        </div>

        {/* Performance Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-bull">+12.5%</h3>
            <p className="text-muted-foreground">Bullish Signals</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-bear">-3.2%</h3>
            <p className="text-muted-foreground">Bearish Signals</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-neutral">84.3%</h3>
            <p className="text-muted-foreground">AI Accuracy</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-primary">2,847</h3>
            <p className="text-muted-foreground">Symbols Tracked</p>
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
};