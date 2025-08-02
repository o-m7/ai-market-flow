import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Send, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const ZapierIntegration = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState(`{
  "symbol": "AAPL",
  "action": "BUY",
  "price": 175.50,
  "quantity": 100,
  "strategy": "Momentum Breakout",
  "rsi": 45,
  "timestamp": "${new Date().toISOString()}"
}`);

  const { toast } = useToast();

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", webhookUrl);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: testData,
      });

      toast({
        title: "Request Sent",
        description: "The request was sent to Zapier. Check your Zap's history to confirm it was triggered.",
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Error",
        description: "Failed to trigger the Zapier webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const predefinedPayloads = [
    {
      name: "Trade Signal",
      data: {
        symbol: "TSLA",
        action: "BUY",
        price: 250.75,
        quantity: 50,
        strategy: "Scalp Entry",
        rsi: 35,
        timestamp: new Date().toISOString(),
      }
    },
    {
      name: "Alert Triggered",
      data: {
        type: "PRICE_ALERT",
        symbol: "SPY",
        trigger_price: 420.00,
        current_price: 420.50,
        message: "SPY broke above resistance",
        timestamp: new Date().toISOString(),
      }
    },
    {
      name: "Portfolio Update",
      data: {
        type: "PORTFOLIO_UPDATE",
        total_value: 125000,
        daily_pnl: 1250,
        best_performer: "NVDA (+3.5%)",
        worst_performer: "META (-1.2%)",
        timestamp: new Date().toISOString(),
      }
    }
  ];

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-primary" />
          Zapier Integration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quick Setup</h3>
          <div className="text-xs text-muted-foreground space-y-2 bg-secondary/30 p-3 rounded">
            <p><strong>1.</strong> Create a new Zap in Zapier</p>
            <p><strong>2.</strong> Choose "Webhooks by Zapier" as the trigger</p>
            <p><strong>3.</strong> Select "Catch Hook" and copy the webhook URL</p>
            <p><strong>4.</strong> Paste the URL below and test the connection</p>
            <p><strong>5.</strong> Complete your Zap with desired actions (Slack, Discord, Sheets, etc.)</p>
          </div>
        </div>

        <Separator />

        {/* Webhook Configuration */}
        <form onSubmit={handleTrigger} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
            <div className="flex space-x-2">
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-background border-border"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl)}
                disabled={!webhookUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-data">Test Data (JSON)</Label>
            <Textarea
              id="test-data"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              className="bg-background border-border font-mono text-xs"
              rows={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Test Webhook"}
          </Button>
        </form>

        <Separator />

        {/* Predefined Payloads */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Quick Test Payloads</h3>
          <div className="grid gap-3">
            {predefinedPayloads.map((payload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{payload.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(payload.data).length} fields
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTestData(JSON.stringify(payload.data, null, 2))}
                >
                  Use This
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Integration Ideas */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Popular Integrations</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                Discord Alerts
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                Slack Notifications
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                Google Sheets Log
              </Badge>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                Email Alerts
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                SMS via Twilio
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <ExternalLink className="h-3 w-3 mr-1" />
                Airtable Database
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};