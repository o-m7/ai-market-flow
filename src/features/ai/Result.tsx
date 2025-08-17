import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function AiResult({ data }: { data: any }) {
  if (!data) return null;
  
  // Map backend format to component expectations
  const outlook = data.technicalIndicators?.trend || data.outlook || 'neutral';
  const confidence = data.confidence || 50;
  const summary = data.analysis || data.summary || 'Analysis not available';
  const levels = {
    support: data.keyLevels?.support || data.levels?.support || [],
    resistance: data.keyLevels?.resistance || data.levels?.resistance || [],
    vwap: data.levels?.vwap
  };
  const trade_idea = data.trade_idea || {
    direction: data.recommendation === 'buy' ? 'long' : data.recommendation === 'sell' ? 'short' : 'none',
    entry: data.priceTargets?.bullish && data.recommendation === 'buy' ? data.priceTargets.bullish : 
           data.priceTargets?.bearish && data.recommendation === 'sell' ? data.priceTargets.bearish : null,
    targets: data.priceTargets ? [data.priceTargets.bullish, data.priceTargets.bearish].filter(Boolean) : [],
    rationale: `Based on ${data.technicalIndicators?.trend || 'technical'} analysis`
  };
  const risks = data.riskAssessment?.factors?.join(', ') || data.risks || 'Standard market risks apply';
  
  const getOutlookIcon = (outlook: string) => {
    switch (outlook) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'bullish':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'bearish':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <Card className="ai-analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Technical Analysis</span>
          <div className="flex items-center gap-2">
            <Badge className={getOutlookColor(outlook)}>
              {getOutlookIcon(outlook)}
              <span className="ml-1 capitalize">{outlook}</span>
            </Badge>
            <Badge variant="secondary">
              {Math.round(confidence)}% Confidence
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Key Levels</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Support:</span>{' '}
                <span className="text-green-600">
                  {levels.support?.map((s: number) => s.toFixed(2)).join(', ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Resistance:</span>{' '}
                <span className="text-red-600">
                  {levels.resistance?.map((r: number) => r.toFixed(2)).join(', ') || 'N/A'}
                </span>
              </div>
              {levels.vwap && (
                <div>
                  <span className="font-medium">VWAP:</span>{' '}
                  <span className="text-blue-600">{levels.vwap.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

        {trade_idea?.direction && trade_idea.direction !== 'none' && (
          <div>
            <h4 className="font-semibold mb-2">Trade Idea</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Direction:</span>{' '}
                <Badge variant={trade_idea?.direction === 'long' ? 'default' : 'destructive'} className="text-xs">
                  {trade_idea?.direction?.toUpperCase() ?? 'N/A'}
                </Badge>
              </div>
                {trade_idea.entry && (
                  <div>
                    <span className="font-medium">Entry:</span> {trade_idea.entry.toFixed(2)}
                  </div>
                )}
                {trade_idea.stop && (
                  <div>
                    <span className="font-medium">Stop:</span> {trade_idea.stop.toFixed(2)}
                  </div>
                )}
                {trade_idea.targets && trade_idea.targets.length > 0 && (
                  <div>
                    <span className="font-medium">Targets:</span>{' '}
                    {trade_idea.targets.map((t: number) => t.toFixed(2)).join(', ')}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{trade_idea.rationale}</p>
            </div>
          )}
        </div>

        {risks && (
          <div>
            <h4 className="font-semibold mb-2">Risk Assessment</h4>
            <p className="text-sm text-muted-foreground">{risks}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Analysis Version: {data.json_version || '1.0.0'}
        </div>
      </CardContent>
    </Card>
  );
}