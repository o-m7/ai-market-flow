import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Brain, Loader2 } from 'lucide-react';

interface QuickAnalysisProps {
  symbol: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export const QuickAnalysis = ({ symbol, onAnalysisComplete }: QuickAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: {
          symbols: [symbol],
          analysisType: 'comprehensive',
          timeframe: '1day'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data.results?.[0];
      if (result) {
        setAnalysis(result);
        onAnalysisComplete?.(result);
        
        toast({
          title: "Analysis Complete",
          description: `AI analysis for ${symbol} is ready`,
        });
      } else {
        throw new Error('No analysis results received');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze symbol',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'default';
      case 'bearish':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full bg-gradient-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Quick AI Analysis
          </CardTitle>
          <Button 
            onClick={runAnalysis}
            disabled={loading}
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </CardHeader>

      {analysis && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{analysis.symbol}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={getSentimentBadgeVariant(analysis.sentiment)}>
                  {analysis.sentiment.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {Math.round(analysis.confidence * 100)}% confidence
                </Badge>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {analysis.analysis}
              </p>
            </div>

            {analysis.keyLevels && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 text-bull">Support Levels</h4>
                  <div className="space-y-1">
                    {analysis.keyLevels.support.map((level: number, index: number) => (
                      <div key={index} className="text-sm bg-bull/10 px-2 py-1 rounded">
                        ${level.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 text-bear">Resistance Levels</h4>
                  <div className="space-y-1">
                    {analysis.keyLevels.resistance.map((level: number, index: number) => (
                      <div key={index} className="text-sm bg-bear/10 px-2 py-1 rounded">
                        ${level.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {analysis.tradingSignals && (
              <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                <h4 className="font-medium text-sm mb-2">Trading Signal</h4>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={
                    analysis.tradingSignals.action === 'buy' ? 'default' :
                    analysis.tradingSignals.action === 'sell' ? 'destructive' : 'secondary'
                  }>
                    {analysis.tradingSignals.action.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {analysis.tradingSignals.riskLevel} risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.tradingSignals.reasoning}
                </p>
              </div>
            )}

            {analysis.chartPatterns && analysis.chartPatterns.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Chart Patterns</h4>
                <div className="flex gap-2 flex-wrap">
                  {analysis.chartPatterns.map((pattern: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Analysis generated: {new Date(analysis.timestamp).toLocaleString()}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};