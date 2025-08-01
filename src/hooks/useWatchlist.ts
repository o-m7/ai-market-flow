import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  created_at: string;
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add symbols to your watchlist",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          name
        });

      if (error) throw error;

      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist`,
      });

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to add symbol to watchlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Removed from Watchlist",
        description: "Symbol has been removed from your watchlist",
      });

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove symbol from watchlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some(item => item.symbol === symbol.toUpperCase());
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist
  };
};