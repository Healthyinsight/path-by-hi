
-- Users table (profile data linked to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  garmin_user_id TEXT,
  garmin_access_token TEXT,
  garmin_access_secret TEXT,
  current_weight DECIMAL DEFAULT 82,
  height_cm INT DEFAULT 183,
  body_fat_pct DECIMAL DEFAULT 20,
  ftp_watts INT DEFAULT 230,
  run_threshold_pace TEXT DEFAULT '4:30',
  vo2max_estimate DECIMAL DEFAULT 56,
  training_phase TEXT DEFAULT 'base',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garmin_activity_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('run', 'bike', 'swim', 'strength')),
  start_time TIMESTAMPTZ,
  duration_seconds INT,
  distance_meters DECIMAL,
  avg_hr INT,
  max_hr INT,
  calories INT,
  avg_pace TEXT,
  avg_power INT,
  training_zones JSONB,
  source TEXT DEFAULT 'garmin_api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Training schedule
CREATE TABLE public.training_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  planned_type TEXT NOT NULL CHECK (planned_type IN ('cardio', 'strength', 'swim', 'rest')),
  planned_subtype TEXT,
  planned_sport TEXT,
  planned_details TEXT,
  completed BOOLEAN DEFAULT false,
  activity_id UUID REFERENCES public.activities(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule" ON public.training_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON public.training_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON public.training_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON public.training_schedule FOR DELETE USING (auth.uid() = user_id);

-- Nutrition plan
CREATE TABLE public.nutrition_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  training_type TEXT,
  target_kcal INT,
  target_protein INT,
  target_carbs INT,
  target_fat INT,
  actual_kcal INT DEFAULT 0,
  actual_protein INT DEFAULT 0,
  actual_carbs INT DEFAULT 0,
  actual_fat INT DEFAULT 0,
  meals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition" ON public.nutrition_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition" ON public.nutrition_plan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition" ON public.nutrition_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition" ON public.nutrition_plan FOR DELETE USING (auth.uid() = user_id);

-- Body metrics
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL,
  body_fat_pct DECIMAL,
  resting_hr INT,
  hrv_rmssd DECIMAL,
  vo2max_run DECIMAL,
  vo2max_bike DECIMAL,
  sleep_hours DECIMAL,
  sleep_quality_score INT,
  body_battery INT,
  stress_level INT,
  source TEXT DEFAULT 'garmin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON public.body_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.body_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.body_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metrics" ON public.body_metrics FOR DELETE USING (auth.uid() = user_id);

-- Exercises (shared library)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  category TEXT CHECK (category IN ('compound', 'isolation')),
  is_disc_safe BOOLEAN DEFAULT true,
  instructions TEXT
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises readable by authenticated" ON public.exercises FOR SELECT TO authenticated USING (true);

-- Workout logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id),
  exercise_id UUID REFERENCES public.exercises(id),
  sets INT,
  reps INT,
  weight_kg DECIMAL,
  rpe INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);
