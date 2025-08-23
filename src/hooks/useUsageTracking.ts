import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UsageStats {
  dailyAnalysisCount: number;
  symbolsAnalyzed: string[];
  remainingAnalyses: number;
  canAnalyzeSymbol: (symbol: string) => boolean;
}

export function useUsageTracking() {
  const { user, subscription } = useAuth();
  const [usage, setUsage] = useState<UsageStats>({
    dailyAnalysisCount: 0,
    symbolsAnalyzed: [],
    remainingAnalyses: 0,
    canAnalyzeSymbol: () => false,
  });
  const [loading, setLoading] = useState(true);

  const isSubscribed = Boolean(subscription?.subscribed || subscription?.subscription_tier === 'Premium' || (user?.email?.toLowerCase?.() === 'omarmerheby7@gmail.com'));
  const FREE_DAILY_LIMIT = 5;
  const FREE_SYMBOL_LIMIT = 5;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchUsageData();
  }, [user]);

  const fetchUsageData = async () => {
    if (!user || isSubscribed) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usageData, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('analysis_date', today);

      if (error) throw error;

      const totalAnalyses = usageData?.reduce((sum, record) => sum + record.analysis_count, 0) || 0;
      const symbolsAnalyzed = usageData?.map(record => record.symbol) || [];
      const remainingAnalyses = Math.max(0, FREE_DAILY_LIMIT - totalAnalyses);

      setUsage({
        dailyAnalysisCount: totalAnalyses,
        symbolsAnalyzed,
        remainingAnalyses,
        canAnalyzeSymbol: (symbol: string) => {
          // If subscribed, no limits
          if (isSubscribed) return true;
          
          // If already analyzed this symbol today, can continue
          if (symbolsAnalyzed.includes(symbol)) return remainingAnalyses > 0;
          
          // If new symbol, check if under symbol limit and has remaining analyses
          return symbolsAnalyzed.length < FREE_SYMBOL_LIMIT && remainingAnalyses > 0;
        },
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAnalysis = async (symbol: string) => {
    if (!user || isSubscribed) return true;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if usage record exists for today and this symbol
      const { data: existingRecord } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('analysis_date', today)
        .eq('symbol', symbol)
        .maybeSingle();

      if (existingRecord) {
        // Update existing record
        await supabase
          .from('user_usage')
          .update({ analysis_count: existingRecord.analysis_count + 1 })
          .eq('id', existingRecord.id);
      } else {
        // Create new record
        await supabase
          .from('user_usage')
          .insert({
            user_id: user.id,
            analysis_date: today,
            symbol: symbol,
            analysis_count: 1,
          });
      }

      // Refresh usage data
      await fetchUsageData();
      return true;
    } catch (error) {
      console.error('Error tracking analysis:', error);
      return false;
    }
  };

  return {
    usage,
    loading,
    trackAnalysis,
    refreshUsage: fetchUsageData,
    isSubscribed: Boolean(isSubscribed),
  };
}