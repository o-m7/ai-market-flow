import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface AnalysisResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  analysis: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
}

export interface MarketUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: string;
  features?: {
    spread?: number;
    stale?: boolean;
    session?: string;
    rsi?: number;
    atr?: number;
    trend?: string;
    levels?: { support: number[]; resistance: number[] };
  };
  news_risk?: { 
    event_risk: boolean; 
    headline_hits_30m: number; 
  };
}

interface RealtimeAnalysisState {
  connected: boolean;
  analysisResults: AnalysisResult[];
  marketUpdates: MarketUpdate[];
  isAnalyzing: boolean;
}

export const useRealtimeAnalysis = (symbols: string[] = []) => {
  const [state, setState] = useState<RealtimeAnalysisState>({
    connected: false,
    analysisResults: [],
    marketUpdates: [],
    isAnalyzing: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Use the full Supabase function URL
      const wsUrl = `wss://ifetofkhyblyijghuwzs.functions.supabase.co/functions/v1/realtime-market-stream`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to real-time market analysis');
        setState(prev => ({ ...prev, connected: true }));
        
        // Subscribe to symbols
        if (symbols.length > 0) {
          subscribe(symbols);
        }

        toast({
          title: "Connected",
          description: "Real-time market analysis is now active",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Disconnected from real-time market analysis');
        setState(prev => ({ ...prev, connected: false }));
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to real-time analysis",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to establish real-time connection",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false }));
  };

  const subscribe = (symbolsToSubscribe: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbols: symbolsToSubscribe
      }));
    }
  };

  const requestAnalysis = (symbolsToAnalyze: string[], analysisType: string = 'comprehensive') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      wsRef.current.send(JSON.stringify({
        type: 'analyze',
        symbols: symbolsToAnalyze,
        analysisType
      }));

      toast({
        title: "Analysis Started",
        description: `Analyzing ${symbolsToAnalyze.length} symbols with AI`,
      });
    }
  };

  const handleMessage = (message: any) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'connection_established':
        console.log('Connection established:', message.message);
        break;

      case 'subscribed':
        console.log('Subscribed to symbols:', message.symbols);
        break;

      case 'market_update':
        setState(prev => ({
          ...prev,
          marketUpdates: message.data
        }));
        break;

      case 'analysis_started':
        setState(prev => ({ ...prev, isAnalyzing: true }));
        break;

      case 'analysis_result':
        setState(prev => ({
          ...prev,
          analysisResults: [
            ...prev.analysisResults.filter(r => r.symbol !== message.symbol),
            message.analysis
          ]
        }));
        break;

      case 'analysis_completed':
        setState(prev => ({ ...prev, isAnalyzing: false }));
        toast({
          title: "Analysis Complete",
          description: "AI market analysis has been updated",
        });
        break;

      case 'analysis_error':
        console.error(`Analysis error for ${message.symbol}:`, message.error);
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Auto-connect when symbols are provided
  useEffect(() => {
    if (symbols.length > 0) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [symbols.join(',')]);

  // Subscribe to new symbols when they change
  useEffect(() => {
    if (state.connected && symbols.length > 0) {
      subscribe(symbols);
    }
  }, [state.connected, symbols.join(',')]);

  return {
    connected: state.connected,
    analysisResults: state.analysisResults,
    marketUpdates: state.marketUpdates,
    isAnalyzing: state.isAnalyzing,
    connect,
    disconnect,
    subscribe,
    requestAnalysis
  };
};