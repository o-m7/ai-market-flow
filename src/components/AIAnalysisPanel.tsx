import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeAnalysis } from '@/hooks/useRealtimeAnalysis';
import { Brain, TrendingUp, TrendingDown, Minus, Zap, RefreshCw } from 'lucide-react';

interface AIAnalysisPanelProps {
  symbols: string[];
}

export const AIAnalysisPanel = ({ symbols }: AIAnalysisPanelProps) => {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'technical' | 'fundamental' | 'comprehensive'>('comprehensive');
  
  const {
    connected,
    analysisResults,
    marketUpdates,
    isAnalyzing,
    connect,
    disconnect,
    requestAnalysis
  } = useRealtimeAnalysis(symbols);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-bull" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-bear" />;
      default:
        return <Minus className="h-4 w-4 text-neutral" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-bull';
      case 'bearish':
        return 'text-bear';
      default:
        return 'text-neutral';
    }
  };

  const handleAnalysisRequest = () => {
    requestAnalysis(symbols, selectedAnalysisType);
  };

  return (
    <Card className="w-full bg-gradient-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Market Analysis</CardTitle>
            <Badge variant={connected ? "default" : "secondary"} className="text-xs">
              {connected ? 'Live' : 'Offline'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!connected ? (
              <Button onClick={connect} size="sm" variant="outline">
                <Zap className="h-4 w-4 mr-1" />
                Connect
              </Button>
            ) : (
              <Button onClick={disconnect} size="sm" variant="outline">
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="realtime">Live Data</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                onClick={handleAnalysisRequest}
                disabled={!connected || isAnalyzing}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
              </Button>
              
              <select 
                value={selectedAnalysisType}
                onChange={(e) => setSelectedAnalysisType(e.target.value as any)}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background"
              >
                <option value="technical">Technical</option>
                <option value="fundamental">Fundamental</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-3">
                {analysisResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Connect and request analysis to see AI insights</p>
                  </div>
                ) : (
                  analysisResults.map((result) => (
                    <Card key={result.symbol} className="bg-background/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{result.symbol}</h4>
                            <Badge variant="secondary" className="text-xs">
                              ${result.price.toFixed(2)}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getSentimentIcon(result.sentiment)}
                              <span className={`text-xs font-medium ${getSentimentColor(result.sentiment)}`}>
                                {result.sentiment.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className={`text-xs ${result.changePercent >= 0 ? 'text-bull' : 'text-bear'}`}>
                            {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.analysis}
                        </p>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {marketUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Waiting for real-time market updates...</p>
                  </div>
                ) : (
                  marketUpdates.map((update) => (
                    <div key={update.symbol} className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-md border border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{update.symbol}</span>
                        <span className="text-sm">${update.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          update.changePercent >= 0 ? 'text-bull' : 'text-bear'
                        }`}>
                          {update.changePercent >= 0 ? '+' : ''}{update.changePercent.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};