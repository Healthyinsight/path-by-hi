-- Add Sahha integration columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sahha_user_id TEXT,
  ADD COLUMN IF NOT EXISTS sahha_profile_token TEXT,
  ADD COLUMN IF NOT EXISTS sahha_connected_at TIMESTAMPTZ;
