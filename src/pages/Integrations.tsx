import { APIManager } from "@/components/APIManager";
import { TradingAlerts } from "@/components/TradingAlerts";
import { ZapierIntegration } from "@/components/ZapierIntegration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Bell, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Webhook,
  ExternalLink
} from "lucide-react";

export default function Integrations() {
  const integrationStats = {
    activeApis: 3,
    activeAlerts: 5,
    webhooksSetup: 2,
    totalTriggers: 127,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Integrations & Automation
        </h1>
        <p className="text-muted-foreground">
          Connect your trading platform with external APIs, set up automated alerts, and streamline your day trading workflow.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{integrationStats.activeApis}</p>
            <p className="text-xs text-muted-foreground">Active APIs</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{integrationStats.activeAlerts}</p>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{integrationStats.webhooksSetup}</p>
            <p className="text-xs text-muted-foreground">Webhooks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-bull" />
            </div>
            <p className="text-2xl font-bold">{integrationStats.totalTriggers}</p>
            <p className="text-xs text-muted-foreground">Total Triggers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Integration Tabs */}
      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Manager
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Trading Alerts
          </TabsTrigger>
          <TabsTrigger value="zapier" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Zapier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-6">
          <APIManager />
          
          {/* Popular APIs Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Popular Trading APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Alpha Vantage</p>
                      <p className="text-xs text-muted-foreground">Real-time & historical market data</p>
                    </div>
                    <Badge variant="outline">Free Tier</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Finnhub</p>
                      <p className="text-xs text-muted-foreground">Stock prices, news, and fundamentals</p>
                    </div>
                    <Badge variant="outline">Free Tier</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">IEX Cloud</p>
                      <p className="text-xs text-muted-foreground">Market data and financial content</p>
                    </div>
                    <Badge variant="outline">Paid</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Twelve Data</p>
                      <p className="text-xs text-muted-foreground">Real-time & historical data API</p>
                    </div>
                    <Badge variant="outline">Free Tier</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Polygon.io</p>
                      <p className="text-xs text-muted-foreground">Market data for stocks, options, crypto</p>
                    </div>
                    <Badge variant="outline">Free Tier</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">News API</p>
                      <p className="text-xs text-muted-foreground">Financial news and sentiment</p>
                    </div>
                    <Badge variant="outline">Free Tier</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <TradingAlerts />
        </TabsContent>

        <TabsContent value="zapier">
          <ZapierIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
}