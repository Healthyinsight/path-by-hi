-- Replace partial unique index with a proper unique constraint so that
-- PostgREST ON CONFLICT (user_id, strava_activity_id) resolves correctly.
-- NULLs are treated as distinct in PostgreSQL unique constraints, so
-- existing garmin activities (strava_activity_id IS NULL) are unaffected.
DROP INDEX IF EXISTS activities_user_strava_id_unique;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_user_strava_id_unique
  UNIQUE (user_id, strava_activity_id);
