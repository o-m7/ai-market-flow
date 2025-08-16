import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, ZapOff, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const RealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    try {
      // Test WebSocket connection
      const wsUrl = `wss://ifetofkhyblyijghuwzs.functions.supabase.co/functions/v1/realtime-market-stream`;
      const testWs = new WebSocket(wsUrl);
      
      testWs.onopen = () => {
        setIsConnected(true);
        setLastUpdate(new Date().toLocaleTimeString());
        testWs.close();
        
        toast({
          title: "Connection Successful",
          description: "Real-time market stream is working",
        });
      };

      testWs.onerror = () => {
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Unable to connect to real-time stream",
          variant: "destructive",
        });
      };

      setTimeout(() => {
        if (testWs.readyState === WebSocket.CONNECTING) {
          testWs.close();
          setIsConnected(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  return (
    <Card className="bg-gradient-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-bull" />
            ) : (
              <WifiOff className="h-4 w-4 text-bear" />
            )}
            <span className="text-sm font-medium">Real-time Status</span>
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? 'Connected' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Last: {lastUpdate}
              </span>
            )}
            <Button 
              onClick={testConnection}
              size="sm" 
              variant="outline"
              className="h-7 px-2 text-xs"
            >
              {isConnected ? (
                <Zap className="h-3 w-3" />
              ) : (
                <ZapOff className="h-3 w-3" />
              )}
              Test
            </Button>
          </div>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          AI-powered market analysis with real-time WebSocket streaming
        </div>
      </CardContent>
    </Card>
  );
};