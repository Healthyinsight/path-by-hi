-- Garmin webhook inbox (service role only via RLS: no policies)
CREATE TABLE public.garmin_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  dedupe_key TEXT NOT NULL UNIQUE
);

ALTER TABLE public.garmin_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX garmin_webhook_events_received_at_idx
  ON public.garmin_webhook_events (received_at DESC);

-- body_metrics: Garmin sample instant + one row per user per calendar day
ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS garmin_measured_at TIMESTAMPTZ;

-- Dedupe existing rows before unique constraint (keep best "latest" per plan)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date
      ORDER BY garmin_measured_at DESC NULLS LAST, created_at DESC
    ) AS rn
  FROM public.body_metrics
)
DELETE FROM public.body_metrics bm
USING ranked r
WHERE bm.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX body_metrics_user_id_date_key
  ON public.body_metrics (user_id, date);

-- Merge Body Battery from Garmin without wiping other columns on conflict
CREATE OR REPLACE FUNCTION public.merge_body_battery_from_garmin(
  p_user_id UUID,
  p_date DATE,
  p_body_battery INT,
  p_garmin_measured_at TIMESTAMPTZ
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.body_metrics (
    user_id,
    date,
    body_battery,
    garmin_measured_at,
    source
  )
  VALUES (
    p_user_id,
    p_date,
    p_body_battery,
    p_garmin_measured_at,
    'garmin_webhook'
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    body_battery = CASE
      WHEN EXCLUDED.garmin_measured_at IS NULL
        OR body_metrics.garmin_measured_at IS NULL
        OR EXCLUDED.garmin_measured_at >= body_metrics.garmin_measured_at
      THEN EXCLUDED.body_battery
      ELSE body_metrics.body_battery
    END,
    garmin_measured_at = CASE
      WHEN EXCLUDED.garmin_measured_at IS NULL
        OR body_metrics.garmin_measured_at IS NULL
        OR EXCLUDED.garmin_measured_at >= body_metrics.garmin_measured_at
      THEN COALESCE(
        EXCLUDED.garmin_measured_at,
        body_metrics.garmin_measured_at
      )
      ELSE body_metrics.garmin_measured_at
    END,
    source = CASE
      WHEN EXCLUDED.garmin_measured_at IS NULL
        OR body_metrics.garmin_measured_at IS NULL
        OR EXCLUDED.garmin_measured_at >= body_metrics.garmin_measured_at
      THEN EXCLUDED.source
      ELSE body_metrics.source
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_body_battery_from_garmin(UUID, DATE, INT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_body_battery_from_garmin(UUID, DATE, INT, TIMESTAMPTZ) TO service_role;
