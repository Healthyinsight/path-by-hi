-- Remove duplicate nutrition_plan rows per user+date (keep newest)
DELETE FROM public.nutrition_plan a
USING public.nutrition_plan b
WHERE a.user_id = b.user_id
  AND a.date = b.date
  AND a.created_at < b.created_at;

-- Add unique constraint to enable idempotent upserts from generateForToday
ALTER TABLE public.nutrition_plan
  ADD CONSTRAINT nutrition_plan_user_id_date_key UNIQUE (user_id, date);
