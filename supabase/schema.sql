-- GridDown Supabase Schema
-- Run this in the Supabase SQL editor after creating a new project.

-- ──────────────────────────────────────────────────────────────────────────────
-- gd_alerts: Community Alert System
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gd_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN (
    'weather', 'fire', 'flood', 'power_outage', 'road_closure',
    'shelter', 'evacuation', 'medical', 'security', 'other'
  )),
  title       TEXT NOT NULL,
  description TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for geospatial queries (Haversine via lat/lon)
CREATE INDEX IF NOT EXISTS gd_alerts_location_idx ON public.gd_alerts (lat, lon);
CREATE INDEX IF NOT EXISTS gd_alerts_created_idx  ON public.gd_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS gd_alerts_expires_idx  ON public.gd_alerts (expires_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.gd_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can READ alerts
CREATE POLICY "Anyone can read alerts"
  ON public.gd_alerts
  FOR SELECT
  USING (
    -- Only show non-expired alerts (or alerts with no expiry)
    (expires_at IS NULL OR expires_at > now())
  );

-- Authenticated users can INSERT their own alerts
CREATE POLICY "Authenticated users can post alerts"
  ON public.gd_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can DELETE their own alerts only
CREATE POLICY "Users can delete own alerts"
  ON public.gd_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Realtime: enable publication for gd_alerts
-- ──────────────────────────────────────────────────────────────────────────────

-- Enable realtime replication for the alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.gd_alerts;

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper function: alerts within N miles using Haversine
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.alerts_within_miles(
  center_lat DOUBLE PRECISION,
  center_lon DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION DEFAULT 50.0
)
RETURNS SETOF public.gd_alerts
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.gd_alerts
  WHERE (expires_at IS NULL OR expires_at > now())
    AND (
      3958.8 * acos(
        LEAST(1.0, cos(radians(center_lat))
          * cos(radians(lat))
          * cos(radians(lon) - radians(center_lon))
          + sin(radians(center_lat))
          * sin(radians(lat))
        )
      )
    ) <= radius_miles
  ORDER BY created_at DESC;
$$;
