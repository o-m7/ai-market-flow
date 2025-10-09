import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistoricalAccuracy {
  symbol: string;
  total_analyses: number;
  target_hit_count: number;
  stop_hit_count: number;
  pending_count: number;
  accuracy_percentage: number;
  avg_hours_to_target: number;
  avg_pnl_on_wins: number;
}

export const useHistoricalAccuracy = (symbol: string, days: number = 30) => {
  return useQuery({
    queryKey: ['historical-accuracy', symbol, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_historical_accuracy', {
          p_symbol: symbol,
          p_days: days
        });

      if (error) {
        console.error('Error fetching historical accuracy:', error);
        throw error;
      }

      // Return first result or null
      return data && data.length > 0 ? (data[0] as HistoricalAccuracy) : null;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
