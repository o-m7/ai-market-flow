import { createClient } from '@supabase/supabase-js';

// Use the project URL and anon key directly to align storage keys across the app
const supabaseUrl = "https://ifetofkhyblyijghuwzs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZXRvZmtoeWJseWlqZ2h1d3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTIyNTEsImV4cCI6MjA2OTgyODI1MX0.nOzUHck9fqOxvOHPOY8FE2YzmVAX1cohmb64wS9J5MQ";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
