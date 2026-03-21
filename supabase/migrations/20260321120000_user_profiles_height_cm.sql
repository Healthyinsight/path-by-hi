-- Kropp & hälsa (Settings) sparar längd på user_profiles; kolumn saknades i äldre schema.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS height_cm INT;
