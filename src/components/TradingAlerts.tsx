import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Bell, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TradingAlert {
  id: string;
  symbol: string;
  condition: "above" | "below" | "rsi_oversold" | "rsi_overbought";
  value: number;
  message: string;
  created: Date;
  triggered: boolean;
  webhookUrl?: string;
}

export const TradingAlerts = () => {
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newCondition, setNewCondition] = useState<TradingAlert["condition"]>("above");
  const [newValue, setNewValue] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  // Load alerts from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem("trading-alerts");
    if (savedAlerts) {
      const parsed = JSON.parse(savedAlerts);
      setAlerts(parsed.map((alert: any) => ({
        ...alert,
        created: new Date(alert.created),
      })));
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = (updatedAlerts: TradingAlert[]) => {
    setAlerts(updatedAlerts);
    localStorage.setItem("trading-alerts", JSON.stringify(updatedAlerts));
  };

  const addAlert = () => {
    if (!newSymbol || !newValue || !newMessage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newAlert: TradingAlert = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase(),
      condition: newCondition,
      value: parseFloat(newValue),
      message: newMessage,
      created: new Date(),
      triggered: false,
      webhookUrl: webhookUrl || undefined,
    };

    const updatedAlerts = [...alerts, newAlert];
    saveAlerts(updatedAlerts);

    // Reset form
    setNewSymbol("");
    setNewValue("");
    setNewMessage("");
    setWebhookUrl("");

    toast({
      title: "Alert Created",
      description: `Alert for ${newSymbol.toUpperCase()} has been set`,
    });
  };

  const deleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    saveAlerts(updatedAlerts);

    toast({
      title: "Alert Deleted",
      description: "Trading alert removed",
    });
  };

  const triggerAlert = async (alert: TradingAlert) => {
    const alertData = {
      symbol: alert.symbol,
      condition: alert.condition,
      value: alert.value,
      message: alert.message,
      timestamp: new Date().toISOString(),
      triggered_by: "FlowDesk Markets",
    };

    // Mark as triggered
    const updatedAlerts = alerts.map(a => 
      a.id === alert.id ? { ...a, triggered: true } : a
    );
    saveAlerts(updatedAlerts);

    // Send webhook if configured
    if (alert.webhookUrl) {
      try {
        await fetch(alert.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(alertData),
        });

        toast({
          title: "Alert Triggered",
          description: `Webhook sent for ${alert.symbol}`,
        });
      } catch (error) {
        toast({
          title: "Webhook Failed",
          description: "Alert triggered but webhook failed",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Alert Triggered",
        description: alert.message,
      });
    }
  };

  const getConditionText = (condition: TradingAlert["condition"], value: number) => {
    switch (condition) {
      case "above":
        return `Price above $${value}`;
      case "below":
        return `Price below $${value}`;
      case "rsi_oversold":
        return `RSI below ${value} (Oversold)`;
      case "rsi_overbought":
        return `RSI above ${value} (Overbought)`;
    }
  };

  const getConditionIcon = (condition: TradingAlert["condition"]) => {
    switch (condition) {
      case "above":
      case "rsi_overbought":
        return <TrendingUp className="h-4 w-4 text-bull" />;
      case "below":
      case "rsi_oversold":
        return <TrendingDown className="h-4 w-4 text-bear" />;
    }
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Trading Alerts
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Create New Alert */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Create New Alert</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as TradingAlert["condition"])}
                className="w-full p-2 bg-background border border-border rounded-md"
              >
                <option value="above">Price Above</option>
                <option value="below">Price Below</option>
                <option value="rsi_overbought">RSI Overbought</option>
                <option value="rsi_oversold">RSI Oversold</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">
              {newCondition.includes("rsi") ? "RSI Value" : "Price ($)"}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder={newCondition.includes("rsi") ? "30" : "150.00"}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Alert Message</Label>
            <Input
              id="message"
              placeholder="Buy signal triggered for scalp entry"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL (Optional)</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          
          <Button onClick={addAlert} className="w-full">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        <Separator />

        {/* Active Alerts */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Active Alerts ({alerts.filter(a => !a.triggered).length})</h3>
          
          {alerts.filter(a => !a.triggered).length === 0 ? (
            <p className="text-muted-foreground text-sm">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.filter(a => !a.triggered).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getConditionIcon(alert.condition)}
                    <div>
                      <p className="font-medium text-sm">{alert.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {getConditionText(alert.condition, alert.value)}
                      </p>
                      <p className="text-xs text-neutral">{alert.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alert.webhookUrl && (
                      <Badge variant="outline" className="text-xs">
                        Webhook
                      </Badge>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerAlert(alert)}
                    >
                      Test
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Triggered */}
        {alerts.filter(a => a.triggered).length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Recently Triggered</h3>
              <div className="space-y-2">
                {alerts.filter(a => a.triggered).slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                  >
                    <span>{alert.symbol}: {alert.message}</span>
                    <Badge variant="secondary">Triggered</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};