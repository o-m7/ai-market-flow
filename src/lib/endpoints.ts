const v = (k: string, f = '') => (import.meta as any)?.env?.[k] ?? f;

export const ENV = {
  API_URL: v('VITE_PUBLIC_API_URL', ''),                 // your Express/Railway backend
  SUPABASE_URL: v('VITE_SUPABASE_URL', ''),              // optional
};

export function apiUrl(path: string) {
  if (ENV.API_URL) return `${ENV.API_URL}${path}`;
  if (ENV.SUPABASE_URL) {
    // Edge Functions endpoints (adjust names if different)
    // Map /api/market/* -> /functions/v1/*
    const map: Record<string,string> = {
      '/health': '/config',
      '/market/quote': '/polygon-market-data',
      '/market/aggs': '/polygon-chart-data',
      '/market/overview': '/polygon-market-data'
    };
    const key = Object.keys(map).find(k => path.startsWith(k));
    return `${ENV.SUPABASE_URL}/functions/v1${key ? map[key] : path}`;
  }
  return path; // fallback (for local mock)
}