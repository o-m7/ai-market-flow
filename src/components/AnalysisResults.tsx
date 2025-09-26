import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, AlertTriangle, Clock } from "lucide-react";
import { QuantMetricsGrid } from "./QuantMetricsGrid";

interface AnalysisResultsProps {
  data: any;
  symbol: string;
}

export const AnalysisResults = ({ data, symbol }: AnalysisResultsProps) => {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'sell': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                AI Analysis: {data.symbol}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
            <Badge className={`${getRecommendationColor(data.recommendation)} font-medium`}>
              {data.recommendation.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{data.analysis}</p>
        </CardContent>
      </Card>

      {/* Quantitative Metrics */}
      <QuantMetricsGrid 
        technical={data.technical}
        quantitative_metrics={data.quantitative_metrics}
        timeframe_profile={data.timeframe_profile}
      />
    </motion.div>
  );
};