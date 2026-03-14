
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  archetype TEXT NOT NULL DEFAULT 'wellness',
  goal_name TEXT,
  goal_date DATE,
  goal_emoji TEXT DEFAULT '✨',
  level TEXT DEFAULT 'intermediate',
  disciplines TEXT[] DEFAULT ARRAY['run','strength'],
  training_days_per_week INT DEFAULT 4,
  weight NUMERIC,
  target_weight NUMERIC,
  body_fat_pct NUMERIC,
  has_injuries TEXT,
  equipment TEXT DEFAULT 'full_gym',
  show_nutrition BOOLEAN DEFAULT true,
  show_race_countdown BOOLEAN DEFAULT true,
  show_recomp BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  wellness_focuses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);
