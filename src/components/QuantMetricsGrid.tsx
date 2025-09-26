import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, Zap, BarChart3, Target } from "lucide-react";
import { useState } from "react";

interface QuantMetricsProps {
  technical?: {
    rsi14?: number;
    macd?: {
      line?: number;
      signal?: number;
      hist?: number;
    };
    ema20?: number;
    ema50?: number;
    atr14?: number;
    bb?: {
      upper?: number;
      middle?: number;
      lower?: number;
    };
  };
  quantitative_metrics?: any;
  timeframe_profile?: any;
}

export const QuantMetricsGrid = ({ technical, quantitative_metrics, timeframe_profile }: QuantMetricsProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    trend: true,
    momentum: true,
    volatility: false,
    regime: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (rsi < 30) return 'text-green-500 bg-green-500/10 border-green-500/20';
    return 'text-muted-foreground bg-muted border-border';
  };

  const getMACDColor = (hist: number) => {
    return hist > 0 
      ? 'text-green-500 bg-green-500/10 border-green-500/20'
      : 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const MetricCard = ({ title, value, subtitle, color = "text-muted-foreground" }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card/50 rounded-lg border border-border/50 p-3"
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const SectionCard = ({ 
    title, 
    icon: Icon, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    icon: any; 
    sectionKey: string; 
    children: React.ReactNode;
  }) => (
    <Card className="overflow-hidden">
      <Collapsible open={openSections[sectionKey]} onOpenChange={() => toggleSection(sectionKey)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {title}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {children}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  if (!technical && !quantitative_metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No quantitative metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend Section */}
      <SectionCard title="Trend Analysis" icon={TrendingUp} sectionKey="trend">
        {technical?.ema20 && (
          <MetricCard 
            title="EMA 20" 
            value={technical.ema20.toFixed(4)}
            color="text-blue-500"
          />
        )}
        {technical?.ema50 && (
          <MetricCard 
            title="EMA 50" 
            value={technical.ema50.toFixed(4)}
            color="text-purple-500"
          />
        )}
        {technical?.bb?.middle && (
          <MetricCard 
            title="BB Middle" 
            value={technical.bb.middle.toFixed(4)}
            subtitle="20-period SMA"
          />
        )}
        {timeframe_profile?.trend && (
          <MetricCard 
            title="Trend Bias" 
            value={timeframe_profile.trend}
            color={timeframe_profile.trend === 'bullish' ? 'text-green-500' : 
                   timeframe_profile.trend === 'bearish' ? 'text-red-500' : 'text-muted-foreground'}
          />
        )}
      </SectionCard>

      {/* Momentum Section */}
      <SectionCard title="Momentum" icon={Zap} sectionKey="momentum">
        {technical?.rsi14 && (
          <MetricCard 
            title="RSI (14)" 
            value={technical.rsi14.toFixed(1)}
            subtitle={technical.rsi14 > 70 ? 'Overbought' : technical.rsi14 < 30 ? 'Oversold' : 'Neutral'}
            color={technical.rsi14 > 70 ? 'text-red-500' : technical.rsi14 < 30 ? 'text-green-500' : 'text-muted-foreground'}
          />
        )}
        {technical?.macd?.hist !== undefined && (
          <MetricCard 
            title="MACD Hist" 
            value={technical.macd.hist > 0 ? `+${technical.macd.hist.toFixed(4)}` : technical.macd.hist.toFixed(4)}
            subtitle={technical.macd.hist > 0 ? 'Bullish' : 'Bearish'}
            color={technical.macd.hist > 0 ? 'text-green-500' : 'text-red-500'}
          />
        )}
        {technical?.macd?.line && (
          <MetricCard 
            title="MACD Line" 
            value={technical.macd.line.toFixed(4)}
          />
        )}
        {technical?.macd?.signal && (
          <MetricCard 
            title="MACD Signal" 
            value={technical.macd.signal.toFixed(4)}
          />
        )}
      </SectionCard>

      {/* Volatility Section */}
      <SectionCard title="Volatility" icon={BarChart3} sectionKey="volatility">
        {technical?.atr14 && (
          <MetricCard 
            title="ATR (14)" 
            value={technical.atr14.toFixed(4)}
            subtitle="Average True Range"
          />
        )}
        {technical?.bb?.upper && technical?.bb?.lower && (
          <>
            <MetricCard 
              title="BB Upper" 
              value={technical.bb.upper.toFixed(4)}
              color="text-red-400"
            />
            <MetricCard 
              title="BB Lower" 
              value={technical.bb.lower.toFixed(4)}
              color="text-green-400"
            />
          </>
        )}
      </SectionCard>

      {/* Regime Section */}
      {quantitative_metrics && (
        <SectionCard title="Market Regime" icon={Target} sectionKey="regime">
          {Object.entries(quantitative_metrics).slice(0, 4).map(([key, value]: [string, any]) => (
            <MetricCard 
              key={key}
              title={key.replace(/_/g, ' ').toUpperCase()}
              value={typeof value === 'number' ? value.toFixed(3) : String(value)}
            />
          ))}
        </SectionCard>
      )}
    </div>
  );
};