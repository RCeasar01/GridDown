import { createClient } from '@supabase/supabase-js';

// Credentials come from environment variables (set in .env.local or EAS secrets).
// Falls back to empty strings so TypeScript is satisfied — app gracefully
// shows a "Supabase not configured" message if these are missing at runtime.
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: { params: { eventsPerSecond: 10 } },
});

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
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
