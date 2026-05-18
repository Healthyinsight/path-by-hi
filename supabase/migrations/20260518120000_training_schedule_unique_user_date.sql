-- Remove duplicate (user_id, date) rows, keeping the most recent entry per pair.
DELETE FROM public.training_schedule
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY created_at DESC) AS rn
    FROM public.training_schedule
  ) ranked
  WHERE rn > 1
);

-- Replace non-unique composite index with a UNIQUE constraint so that
-- upsertSchedule's ON CONFLICT (user_id, date) clause works correctly.
DROP INDEX IF EXISTS public.training_schedule_user_date_idx;

ALTER TABLE public.training_schedule
  ADD CONSTRAINT training_schedule_user_id_date_key UNIQUE (user_id, date);
