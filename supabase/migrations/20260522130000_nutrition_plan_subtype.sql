-- Store planned_subtype and planned_sport in nutrition_plan so meal suggestions
-- can be served correctly after page reload without re-fetching training_schedule.
ALTER TABLE public.nutrition_plan
  ADD COLUMN IF NOT EXISTS planned_subtype TEXT,
  ADD COLUMN IF NOT EXISTS planned_sport   TEXT;
