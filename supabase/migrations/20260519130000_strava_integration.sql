-- Strava OAuth columns on users table (mirrors Garmin pattern)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS strava_athlete_id      TEXT,
  ADD COLUMN IF NOT EXISTS strava_access_token    TEXT,
  ADD COLUMN IF NOT EXISTS strava_refresh_token   TEXT,
  ADD COLUMN IF NOT EXISTS strava_token_expires_at TIMESTAMPTZ;

-- Strava activity ID on activities table
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS strava_activity_id TEXT;

-- Dedup index: one Strava activity per user, NULLs excluded
CREATE UNIQUE INDEX IF NOT EXISTS activities_user_strava_id_unique
  ON public.activities (user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;
