import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Calculator,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  backtest_results?: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
  };
}


const STRATEGY_TEMPLATES = [
  {
    id: 'rsi_mean_reversion',
    name: 'RSI Mean Reversion',
    description: 'Buy oversold (RSI < 30), sell overbought (RSI > 70)',
    parameters: {
      rsi_period: 14,
      oversold_level: 30,
      overbought_level: 70,
      position_size: 0.1
    }
  },
  {
    id: 'ema_crossover',
    name: 'EMA Crossover',
    description: 'Buy when fast EMA crosses above slow EMA',
    parameters: {
      fast_ema: 12,
      slow_ema: 26,
      position_size: 0.15
    }
  },
  {
    id: 'breakout_momentum',
    name: 'Breakout Momentum',
    description: 'Buy on high volume breakouts above resistance',
    parameters: {
      lookback_period: 20,
      volume_threshold: 1.5,
      position_size: 0.2
    }
  }
];

export const QuantTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const runBacktest = async (strategy: Strategy) => {
    toast({
      title: "Running Backtest",
      description: `Testing ${strategy.name} strategy...`
    });

    // Simulate backtest results
    setTimeout(() => {
      const results = {
        total_return: Math.random() * 40 - 10, // -10% to 30%
        sharpe_ratio: Math.random() * 2 + 0.5, // 0.5 to 2.5
        max_drawdown: -(Math.random() * 15 + 2), // -2% to -17%
        win_rate: Math.random() * 40 + 40 // 40% to 80%
      };

      setSelectedStrategy({
        ...strategy,
        backtest_results: results
      });

      toast({
        title: "Backtest Complete",
        description: `${strategy.name}: ${results.total_return.toFixed(1)}% return`
      });
    }, 2000);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                Quantitative Trading
              </h1>
              <p className="text-muted-foreground">
                Build, backtest, and analyze algorithmic trading strategies
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="strategies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Strategy Builder */}
          <TabsContent value="strategies">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Strategy Templates
                  </CardTitle>
                  <CardDescription>
                    Choose from pre-built strategies or create your own
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {STRATEGY_TEMPLATES.map((strategy) => (
                      <Card key={strategy.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{strategy.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedStrategy(strategy)}
                              variant="outline"
                            >
                              Configure
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => runBacktest(strategy)}
                            >
                              <Calculator className="h-4 w-4 mr-1" />
                              Backtest
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Configuration */}
              {selectedStrategy && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configure {selectedStrategy.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>{key.replace(/_/g, ' ').toUpperCase()}</Label>
                          <Input
                            id={key}
                            type="number"
                            defaultValue={value}
                            step="0.1"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Backtest Results */}
          <TabsContent value="backtest">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Backtest Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStrategy?.backtest_results ? (
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {selectedStrategy.backtest_results.total_return.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Total Return</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {selectedStrategy.backtest_results.sharpe_ratio.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {selectedStrategy.backtest_results.max_drawdown.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Max Drawdown</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStrategy.backtest_results.win_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a strategy and run a backtest to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">Advanced quantitative analysis tools</p>
                  </div>
                  
                  {/* Import and use the QuantCard component */}
                  <div className="border rounded-lg p-1">
                    <iframe 
                      src="/quant-demo" 
                      className="w-full h-[800px] border-0 rounded"
                      title="Quantitative Analysis Demo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuantTrading;