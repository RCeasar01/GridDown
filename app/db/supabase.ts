import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Credentials come from environment variables (set in .env.local or EAS secrets).
// Falls back to empty strings so TypeScript is satisfied — app gracefully
// shows a "Supabase not configured" message if these are missing at runtime.
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

let client: SupabaseClient | null = null;

/**
 * Lazily created client. Returns null when the backend is not configured —
 * createClient() throws on an empty URL, which would crash the app at import
 * time in any build without Supabase keys (i.e. every store build until the
 * Community Alerts backend is provisioned).
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export type AlertType =
  | 'weather' | 'fire' | 'flood' | 'power_outage' | 'road_closure'
  | 'shelter' | 'evacuation' | 'medical' | 'security' | 'other';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface GdAlert {
  id: string;
  user_id: string | null;
  type: AlertType;
  title: string;
  description: string | null;
  lat: number;
  lon: number;
  severity: AlertSeverity;
  expires_at: string | null;
  created_at: string;
}
