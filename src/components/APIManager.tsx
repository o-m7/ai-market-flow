import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Key, Webhook, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface APIConfig {
  name: string;
  key: string;
  status: "active" | "inactive" | "error";
  type: "public" | "webhook";
}

export const APIManager = () => {
  const [apis, setApis] = useState<APIConfig[]>([]);
  const [newApiName, setNewApiName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [apiType, setApiType] = useState<"public" | "webhook">("public");
  const { toast } = useToast();

  // Load saved APIs from localStorage
  useEffect(() => {
    const savedApis = localStorage.getItem("trading-apis");
    if (savedApis) {
      setApis(JSON.parse(savedApis));
    }
  }, []);

  // Save APIs to localStorage
  const saveApis = (updatedApis: APIConfig[]) => {
    setApis(updatedApis);
    localStorage.setItem("trading-apis", JSON.stringify(updatedApis));
  };

  const addAPI = () => {
    if (!newApiName || !newApiKey) {
      toast({
        title: "Error",
        description: "Please enter both API name and key/URL",
        variant: "destructive",
      });
      return;
    }

    const newApi: APIConfig = {
      name: newApiName,
      key: newApiKey,
      status: "active",
      type: apiType,
    };

    const updatedApis = [...apis, newApi];
    saveApis(updatedApis);

    setNewApiName("");
    setNewApiKey("");

    toast({
      title: "API Added",
      description: `${newApiName} has been added successfully`,
    });
  };

  const removeAPI = (index: number) => {
    const updatedApis = apis.filter((_, i) => i !== index);
    saveApis(updatedApis);

    toast({
      title: "API Removed",
      description: "API configuration removed",
    });
  };

  const testWebhook = async (api: APIConfig) => {
    if (api.type !== "webhook") return;

    try {
      await fetch(api.key, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "Test from FlowDesk Markets",
        }),
      });

      toast({
        title: "Webhook Test Sent",
        description: "Check your webhook destination to confirm receipt",
      });
    } catch (error) {
      toast({
        title: "Webhook Test Failed",
        description: "Failed to send test webhook",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-bull" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-bear" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-neutral" />;
    }
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          API Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add New API */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Add New API Integration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-name">API Name</Label>
              <Input
                id="api-name"
                placeholder="e.g., Market Data API"
                value={newApiName}
                onChange={(e) => setNewApiName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-type">Type</Label>
              <select
                value={apiType}
                onChange={(e) => setApiType(e.target.value as "public" | "webhook")}
                className="w-full p-2 bg-background border border-border rounded-md"
              >
                <option value="public">Public API Key</option>
                <option value="webhook">Webhook URL</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {apiType === "public" ? "API Key" : "Webhook URL"}
            </Label>
            <Input
              id="api-key"
              type={apiType === "public" ? "password" : "url"}
              placeholder={
                apiType === "public" 
                  ? "Enter your API key" 
                  : "https://hooks.zapier.com/hooks/catch/..."
              }
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          
          <Button onClick={addAPI} className="w-full">
            <Key className="h-4 w-4 mr-2" />
            Add API
          </Button>
        </div>

        <Separator />

        {/* Existing APIs */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Configured APIs</h3>
          
          {apis.length === 0 ? (
            <p className="text-muted-foreground text-sm">No APIs configured yet</p>
          ) : (
            <div className="space-y-3">
              {apis.map((api, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {api.type === "webhook" ? (
                      <Webhook className="h-4 w-4 text-primary" />
                    ) : (
                      <Key className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{api.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {api.type === "webhook" ? "Webhook" : "API Key"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(api.status)}
                    <Badge variant={api.status === "active" ? "default" : "destructive"}>
                      {api.status}
                    </Badge>
                    
                    {api.type === "webhook" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWebhook(api)}
                      >
                        Test
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeAPI(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Setup Guide */}
        <Separator />
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quick Setup Guide</h3>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Public APIs:</strong> Market data, news feeds, technical indicators</p>
            <p><strong>Webhooks:</strong> Zapier, Discord, Slack notifications for trades/alerts</p>
            <p><strong>Pro Tip:</strong> Use webhooks to automate trade alerts and portfolio updates</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
