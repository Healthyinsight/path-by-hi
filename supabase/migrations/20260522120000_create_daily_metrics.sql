-- daily_metrics: normalized SSOT for daily health data from any source.
-- Supports Sahha, Garmin, manual input, and derived values.
-- One row per (user_id, date, source). A resolved view picks the best row per day.

CREATE TABLE IF NOT EXISTS public.daily_metrics (
  user_id            UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date               DATE        NOT NULL,
  hrv_rmssd          FLOAT,
  rhr                INT,
  sleep_hours        FLOAT,
  sleep_quality_score INT,
  body_battery       INT,
  steps              INT,
  source             TEXT        NOT NULL CHECK (source IN ('sahha', 'garmin', 'manual', 'derived')),
  raw_payload        JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date, source)
);

-- Fast lookups by user + date range
CREATE INDEX daily_metrics_user_date_idx ON public.daily_metrics (user_id, date DESC);

-- Row-Level Security: users can only access their own rows
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_metrics_select_own"
  ON public.daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_metrics_insert_own"
  ON public.daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_metrics_update_own"
  ON public.daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "daily_metrics_delete_own"
  ON public.daily_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Resolved view: best row per (user_id, date).
-- Priority order: garmin > sahha > manual > derived.
-- Used by the coaching engine and UI — never raw table.
CREATE OR REPLACE VIEW public.daily_metrics_resolved AS
SELECT DISTINCT ON (user_id, date)
  user_id,
  date,
  hrv_rmssd,
  rhr,
  sleep_hours,
  sleep_quality_score,
  body_battery,
  steps,
  source,
  created_at
FROM public.daily_metrics
ORDER BY
  user_id,
  date DESC,
  CASE source
    WHEN 'garmin'  THEN 1
    WHEN 'sahha'   THEN 2
    WHEN 'manual'  THEN 3
    WHEN 'derived' THEN 4
    ELSE 5
  END;
