import { createClient } from '@supabase/supabase-js';

// These will be automatically set by Lovable's Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});

export async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

// Database types for TypeScript (can be generated from Supabase CLI)
export interface Database {
  public: {
    Tables: {
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          name?: string;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          condition_type: 'above' | 'below';
          target_price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          condition_type: 'above' | 'below';
          target_price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          condition_type?: 'above' | 'below';
          target_price?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}