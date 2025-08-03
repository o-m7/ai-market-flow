import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity,
  Eye,
  MoreHorizontal
} from "lucide-react";

export default function Portfolio() {
  const [totalValue] = useState(125420.50);
  const [dailyPnL] = useState(2340.75);
  const [dailyPnLPercent] = useState(1.9);

  const positions = [
    {
      symbol: "AAPL",
      shares: 50,
      avgPrice: 175.20,
      currentPrice: 178.45,
      value: 8922.50,
      pnl: 162.50,
      pnlPercent: 1.85,
    },
    {
      symbol: "NVDA", 
      shares: 25,
      avgPrice: 421.30,
      currentPrice: 435.80,
      value: 10895.00,
      pnl: 362.50,
      pnlPercent: 3.44,
    },
    {
      symbol: "TSLA",
      shares: 30,
      avgPrice: 248.90,
      currentPrice: 242.15,
      value: 7264.50,
      pnl: -202.50,
      pnlPercent: -2.71,
    },
    {
      symbol: "SPY",
      shares: 100,
      avgPrice: 418.75,
      currentPrice: 422.30,
      value: 42230.00,
      pnl: 355.00,
      pnlPercent: 0.85,
    },
  ];

  const sectors = [
    { name: "Technology", allocation: 45, value: 56439.23 },
    { name: "Financial", allocation: 25, value: 31355.13 },
    { name: "Healthcare", allocation: 15, value: 18813.08 },
    { name: "Consumer", allocation: 10, value: 12542.05 },
    { name: "Energy", allocation: 5, value: 6271.03 },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-muted-foreground">
          Track your positions, performance, and portfolio allocation.
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily P&L</p>
                <p className={`text-2xl font-bold ${dailyPnL >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toLocaleString()}
                </p>
              </div>
              {dailyPnL >= 0 ? (
                <TrendingUp className="h-8 w-8 text-bull" />
              ) : (
                <TrendingDown className="h-8 w-8 text-bear" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Return</p>
                <p className={`text-2xl font-bold ${dailyPnLPercent >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {dailyPnLPercent >= 0 ? '+' : ''}{dailyPnLPercent}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="positions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Allocation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.symbol} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold">{position.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {position.shares} shares @ ${position.avgPrice}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="font-semibold">${position.value.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={position.pnl >= 0 ? "default" : "destructive"}
                          className={position.pnl >= 0 ? "bg-bull/20 text-bull border-bull/30" : "bg-bear/20 text-bear border-bear/30"}
                        >
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sectors.map((sector) => (
                <div key={sector.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{sector.name}</span>
                    <div className="text-right">
                      <p className="font-semibold">{sector.allocation}%</p>
                      <p className="text-sm text-muted-foreground">${sector.value.toLocaleString()}</p>
                    </div>
                  </div>
                  <Progress value={sector.allocation} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}