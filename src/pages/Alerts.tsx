import { useState } from "react";
import { Bell, Plus, Trash2, Edit, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";

interface Alert {
  id: string;
  symbol: string;
  type: "price" | "change" | "volume" | "rsi" | "macd";
  condition: "above" | "below" | "crosses_above" | "crosses_below";
  value: number;
  isActive: boolean;
  method: "email" | "sms" | "push" | "telegram";
  createdDate: string;
  triggeredCount: number;
  lastTriggered?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    symbol: "AAPL",
    type: "price",
    condition: "above",
    value: 190,
    isActive: true,
    method: "email",
    createdDate: "2024-01-15",
    triggeredCount: 0
  },
  {
    id: "2",
    symbol: "BTC-USD", 
    type: "change",
    condition: "below",
    value: -5,
    isActive: true,
    method: "push",
    createdDate: "2024-01-12",
    triggeredCount: 2,
    lastTriggered: "2024-01-20"
  },
  {
    id: "3",
    symbol: "TSLA",
    type: "rsi",
    condition: "above",
    value: 70,
    isActive: false,
    method: "sms",
    createdDate: "2024-01-10",
    triggeredCount: 5,
    lastTriggered: "2024-01-18"
  },
  {
    id: "4",
    symbol: "EUR/USD",
    type: "price",
    condition: "below",
    value: 1.08,
    isActive: true,
    method: "telegram",
    createdDate: "2024-01-08",
    triggeredCount: 1,
    lastTriggered: "2024-01-19"
  }
];

export const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: "",
    type: "price" as const,
    condition: "above" as const,
    value: 0,
    method: "email" as const
  });

  const toggleAlert = (id: string) => {
    setAlerts(alerts => 
      alerts.map(alert => 
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts => alerts.filter(alert => alert.id !== id));
  };

  const createAlert = () => {
    const alert: Alert = {
      id: Date.now().toString(),
      ...newAlert,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      triggeredCount: 0
    };
    setAlerts(alerts => [...alerts, alert]);
    setNewAlert({
      symbol: "",
      type: "price",
      condition: "above", 
      value: 0,
      method: "email"
    });
    setIsCreateDialogOpen(false);
  };

  const getAlertDescription = (alert: Alert) => {
    const conditionText = {
      above: "goes above",
      below: "goes below", 
      crosses_above: "crosses above",
      crosses_below: "crosses below"
    };

    const typeText = {
      price: "price",
      change: "change %",
      volume: "volume",
      rsi: "RSI",
      macd: "MACD"
    };

    return `${alert.symbol} ${typeText[alert.type]} ${conditionText[alert.condition]} ${alert.value}${alert.type === 'change' ? '%' : ''}`;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "email": return "📧";
      case "sms": return "📱";
      case "push": return "🔔";
      case "telegram": return "📨";
      default: return "🔔";
    }
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const inactiveAlerts = alerts.filter(alert => !alert.isActive);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Price Alerts</h1>
            <p className="text-muted-foreground">Never miss important market movements</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="trading" className="animate-scale-in">
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={newAlert.symbol}
                    onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value.toUpperCase()})}
                    placeholder="e.g., AAPL, BTC-USD"
                    className="bg-secondary border-border"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Alert Type</Label>
                    <Select value={newAlert.type} onValueChange={(value: any) => setNewAlert({...newAlert, type: value})}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="change">Change %</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="rsi">RSI</SelectItem>
                        <SelectItem value="macd">MACD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={newAlert.condition} onValueChange={(value: any) => setNewAlert({...newAlert, condition: value})}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                        <SelectItem value="crosses_above">Crosses Above</SelectItem>
                        <SelectItem value="crosses_below">Crosses Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="value">Target Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({...newAlert, value: parseFloat(e.target.value)})}
                    placeholder="Enter target value"
                    className="bg-secondary border-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="method">Notification Method</Label>
                  <Select value={newAlert.method} onValueChange={(value: any) => setNewAlert({...newAlert, method: value})}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="trading" onClick={createAlert}>
                    Create Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-foreground">{alerts.length}</h3>
              <p className="text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-bull">{activeAlerts.length}</h3>
              <p className="text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-muted-foreground">{inactiveAlerts.length}</h3>
              <p className="text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-primary">
                {alerts.reduce((sum, alert) => sum + alert.triggeredCount, 0)}
              </h3>
              <p className="text-muted-foreground">Total Triggered</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-bull" />
              Active Alerts ({activeAlerts.length})
            </h2>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="bg-gradient-card border-border animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="default" className="animate-pulse-trading">
                            ACTIVE
                          </Badge>
                          <span className="text-lg font-medium text-foreground">
                            {alert.symbol}
                          </span>
                          <span className="text-2xl">{getMethodIcon(alert.method)}</span>
                        </div>
                        <p className="text-muted-foreground mb-1">
                          {getAlertDescription(alert)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(alert.createdDate).toLocaleDateString()}
                          {alert.lastTriggered && ` • Last triggered ${new Date(alert.lastTriggered).toLocaleDateString()}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {alert.triggeredCount > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-medium text-primary">{alert.triggeredCount}</div>
                            <div className="text-xs text-muted-foreground">Triggered</div>
                          </div>
                        )}
                        
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlert(alert.id)}
                        />
                        
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Alerts */}
        {inactiveAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-muted-foreground" />
              Inactive Alerts ({inactiveAlerts.length})
            </h2>
            <div className="space-y-4">
              {inactiveAlerts.map((alert) => (
                <Card key={alert.id} className="bg-gradient-card border-border opacity-60 animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="secondary">
                            INACTIVE
                          </Badge>
                          <span className="text-lg font-medium text-foreground">
                            {alert.symbol}
                          </span>
                          <span className="text-2xl opacity-50">{getMethodIcon(alert.method)}</span>
                        </div>
                        <p className="text-muted-foreground mb-1">
                          {getAlertDescription(alert)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(alert.createdDate).toLocaleDateString()}
                          {alert.lastTriggered && ` • Last triggered ${new Date(alert.lastTriggered).toLocaleDateString()}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {alert.triggeredCount > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">{alert.triggeredCount}</div>
                            <div className="text-xs text-muted-foreground">Triggered</div>
                          </div>
                        )}
                        
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlert(alert.id)}
                        />
                        
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No alerts configured</h3>
            <p className="text-muted-foreground mb-6">
              Set up price alerts to stay informed about important market movements
            </p>
            <Button variant="trading" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </div>
        )}
      </div>

      <AIAssistant />
    </div>
  );
};