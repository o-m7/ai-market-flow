import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingChart } from "@/components/TradingChart";
import { useToast } from "@/components/ui/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [orderType, setOrderType] = useState("market");
  const [side, setSide] = useState("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const quickSymbols = ["AAPL", "NVDA", "TSLA", "SPY", "QQQ", "MSFT", "GOOGL", "AMZN"];
  
  const recentTrades = [
    {
      id: 1,
      symbol: "AAPL",
      side: "BUY",
      quantity: 50,
      price: 175.20,
      timestamp: "10:30:15",
      status: "Filled"
    },
    {
      id: 2,
      symbol: "NVDA", 
      side: "SELL",
      quantity: 25,
      price: 435.80,
      timestamp: "10:25:42",
      status: "Filled"
    },
    {
      id: 3,
      symbol: "TSLA",
      side: "BUY",
      quantity: 30,
      price: 242.15,
      timestamp: "10:20:11",
      status: "Pending"
    },
  ];

  const marketData = {
    AAPL: { price: 178.45, change: 3.25, changePercent: 1.85 },
    NVDA: { price: 435.80, change: 14.50, changePercent: 3.44 },
    TSLA: { price: 242.15, change: -6.75, changePercent: -2.71 },
    SPY: { price: 422.30, change: 3.55, changePercent: 0.85 },
  };

  const currentPrice = marketData[selectedSymbol as keyof typeof marketData]?.price || 0;
  const estimatedTotal = parseFloat(quantity || "0") * (orderType === "market" ? currentPrice : parseFloat(price || "0"));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate order submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Order Submitted",
        description: `${side.toUpperCase()} ${quantity} shares of ${selectedSymbol} at ${orderType === "market" ? "market price" : `$${price}`}`,
      });
      
      // Reset form
      setQuantity("");
      setPrice("");
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Trading Terminal
        </h1>
        <p className="text-muted-foreground">
          Execute trades, monitor positions, and analyze market data in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Symbol Selector */}
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Symbol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {quickSymbols.map((symbol) => (
                  <Button
                    key={symbol}
                    variant={selectedSymbol === symbol ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSymbol(symbol)}
                    className="text-xs"
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
              
              {marketData[selectedSymbol as keyof typeof marketData] && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{selectedSymbol}</span>
                    <div className="text-right">
                      <p className="font-bold">${marketData[selectedSymbol as keyof typeof marketData].price}</p>
                      <p className={`text-sm ${marketData[selectedSymbol as keyof typeof marketData].change >= 0 ? 'text-bull' : 'text-bear'}`}>
                        {marketData[selectedSymbol as keyof typeof marketData].change >= 0 ? '+' : ''}
                        {marketData[selectedSymbol as keyof typeof marketData].change} 
                        ({marketData[selectedSymbol as keyof typeof marketData].changePercent >= 0 ? '+' : ''}
                        {marketData[selectedSymbol as keyof typeof marketData].changePercent}%)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Entry */}
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={side === "buy" ? "default" : "outline"}
                    onClick={() => setSide("buy")}
                    className={side === "buy" ? "bg-bull hover:bg-bull/90" : ""}
                  >
                    BUY
                  </Button>
                  <Button
                    type="button"
                    variant={side === "sell" ? "default" : "outline"}
                    onClick={() => setSide("sell")}
                    className={side === "sell" ? "bg-bear hover:bg-bear/90" : ""}
                  >
                    SELL
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order-type">Order Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {orderType !== "market" && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                )}

                {quantity && (
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Estimated Total:</span>
                      <span className="font-semibold">${estimatedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || !quantity}>
                  {isLoading ? "Submitting..." : `${side.toUpperCase()} ${selectedSymbol}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="p-3 bg-secondary/30 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{trade.symbol}</span>
                          <Badge 
                            variant={trade.side === "BUY" ? "default" : "destructive"}
                            className={trade.side === "BUY" ? "bg-bull/20 text-bull border-bull/30" : "bg-bear/20 text-bear border-bear/30"}
                          >
                            {trade.side}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.quantity} @ ${trade.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{trade.timestamp}</p>
                        <Badge variant={trade.status === "Filled" ? "default" : "secondary"}>
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chart - {selectedSymbol}</CardTitle>
            </CardHeader>
            <CardContent className="h-[600px]">
              <TradingChart symbol={selectedSymbol} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}