import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useHistoricalAccuracy } from "@/hooks/useHistoricalAccuracy";
import { Loader2, TrendingUp, Target, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export const TradeAccuracy = () => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [symbol] = useState("BTCUSD");
  const [days] = useState(30);
  
  const { data: accuracy, isLoading, refetch } = useHistoricalAccuracy(symbol, days);

  // Fetch individual trades that hit targets
  const { data: targetHits, refetch: refetchTargetHits } = useQuery({
    queryKey: ['target-hits', symbol, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_analyses')
        .select('*')
        .eq('symbol', symbol)
        .eq('outcome', 'TARGET_HIT')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('outcome_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!symbol,
  });

  const handleCheckOutcomes = async () => {
    setChecking(true);
    try {
      toast({
        title: "Checking Trade Outcomes",
        description: "Analyzing pending trades against price action...",
      });

      const { data, error } = await supabase.functions.invoke('check-trade-outcomes');
      
      if (error) throw error;

      toast({
        title: "Check Complete",
        description: `Processed ${data.processed} trades. ${data.targetHits} targets hit, ${data.stopHits} stops hit.`,
      });

      // Refresh accuracy data
      refetch();
      refetchTargetHits();
    } catch (error: any) {
      console.error('Error checking outcomes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check trade outcomes',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all trade outcomes? This will clear all historical results.')) {
      return;
    }

    setResetting(true);
    try {
      toast({
        title: "Resetting Trade Data",
        description: "Clearing all trade outcomes...",
      });

      const { data, error } = await supabase.functions.invoke('reset-trade-outcomes');
      
      if (error) throw error;

      toast({
        title: "Reset Complete",
        description: `Reset ${data.resetCount} trade outcomes. Fresh start!`,
      });

      // Refresh accuracy data
      refetch();
      refetchTargetHits();
    } catch (error: any) {
      console.error('Error resetting outcomes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset trade outcomes',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Trade Accuracy Dashboard
          </h1>
          <p className="text-muted-foreground">
            Historical performance tracking for AI-generated trade signals
          </p>
        </div>

        <div className="grid gap-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Outcome Management</CardTitle>
              <CardDescription>
                System automatically checks trades every hour. You can also manually trigger checks or reset data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  onClick={handleCheckOutcomes}
                  disabled={checking || resetting}
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Check Now
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleReset}
                  disabled={checking || resetting}
                  variant="destructive"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset All Data
                    </>
                  )}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Automatic checks run every hour to update trade outcomes</p>
                <p>• Manual check analyzes all pending trades immediately</p>
                <p>• Reset clears all outcomes to start fresh tracking</p>
              </div>
            </CardContent>
          </Card>

          {/* Accuracy Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Statistics - {symbol}</CardTitle>
              <CardDescription>Last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : accuracy ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {accuracy.accuracy_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <Badge variant="secondary" className="mt-2">
                      {accuracy.target_hit_count} wins / {accuracy.total_analyses} trades
                    </Badge>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2 flex items-center justify-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      {accuracy.target_hit_count}
                    </div>
                    <div className="text-sm text-muted-foreground">Targets Hit</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
                      <XCircle className="h-6 w-6" />
                      {accuracy.stop_hit_count}
                    </div>
                    <div className="text-sm text-muted-foreground">Stops Hit</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600 mb-2 flex items-center justify-center gap-2">
                      <Clock className="h-6 w-6" />
                      {accuracy.pending_count}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>

                  {accuracy.avg_hours_to_target && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold mb-2">
                        {accuracy.avg_hours_to_target.toFixed(1)} hrs
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Time to Target</div>
                    </div>
                  )}

                  {accuracy.avg_pnl_on_wins && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        +{accuracy.avg_pnl_on_wins.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Win PnL</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No accuracy data available for {symbol}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Hits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Target Hits</CardTitle>
              <CardDescription>Individual trades that reached their targets</CardDescription>
            </CardHeader>
            <CardContent>
              {targetHits && targetHits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Hit</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Target #</TableHead>
                      <TableHead>Exit Price</TableHead>
                      <TableHead>PnL</TableHead>
                      <TableHead>Time to Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetHits.map((trade: any) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          {trade.outcome_time ? format(new Date(trade.outcome_time), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'long' ? 'default' : 'destructive'}>
                            {trade.direction?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.entry_price?.toFixed(2) || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Target {trade.target_hit || 1}</Badge>
                        </TableCell>
                        <TableCell>${trade.outcome_price?.toFixed(2) || '-'}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-semibold">
                            +{trade.pnl_percentage?.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {trade.hours_to_outcome ? `${trade.hours_to_outcome.toFixed(1)}h` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No target hits yet for {symbol}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradeAccuracy;
