
CREATE TABLE public.knowledge_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('recovery', 'training', 'nutrition')),
  severity TEXT NOT NULL CHECK (severity IN ('positive', 'info', 'warning')),
  insight_title TEXT NOT NULL,
  insight_body TEXT NOT NULL,
  action_text TEXT,
  source_name TEXT,
  source_url TEXT,
  applicable_archetypes TEXT[] NOT NULL DEFAULT ARRAY['wellness', 'ironman', 'recomp'],
  applicable_disciplines TEXT[] NOT NULL DEFAULT ARRAY['run', 'bike', 'swim', 'strength'],
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active rules"
ON public.knowledge_rules
FOR SELECT
TO authenticated
USING (true);

-- Seed with initial rules that work without Garmin data
INSERT INTO public.knowledge_rules (trigger_type, trigger_condition, category, severity, insight_title, insight_body, action_text, source_name, applicable_archetypes, applicable_disciplines, priority) VALUES
('training_type_today', '{"match_type": "strength"}', 'nutrition', 'info', 'Styrkedag = höj proteinet', 'På styrkepas-dagar behöver din kropp extra protein för muskelåterhämtning. Sikta på minst 1.8g per kg kroppsvikt.', 'Sikta på 175g+ protein idag', 'Protein Intake for Strength Athletes – HI', ARRAY['wellness','ironman','recomp'], ARRAY['strength'], 8),
('training_type_today', '{"match_type": "long_distance"}', 'nutrition', 'info', 'Långpass = ladda kolhydrater', 'Inför längre uthållighetspass behöver du fylla på glykogenlagren. Ät en kolhydratrik måltid 2-3h innan passet.', 'Ät 300g+ kolhydrater idag', 'Carb Loading for Endurance – HI', ARRAY['wellness','ironman'], ARRAY['run','bike'], 8),
('training_type_today', '{"match_type": "vo2max"}', 'training', 'info', 'Intervalldag – prioritera recovery', 'VO2max-pass är mycket krävande. Se till att du har bra näring före och efter, och lägg in extra vila ikväll.', 'Planera in extra vila ikväll', 'Interval Training Recovery – HI', ARRAY['wellness','ironman','recomp'], ARRAY['run','bike'], 7),
('training_type_today', '{"match_type": "rest"}', 'recovery', 'positive', 'Vilodag – din kropp tackar dig', 'Återhämtning är lika viktigt som träning. Idag bygger kroppen upp det du brutit ner under veckans pass.', 'Fokusera på sömn och näring', 'Rest & Recovery Science – HI', ARRAY['wellness','ironman','recomp'], ARRAY['run','bike','swim','strength'], 6),
('time_of_day', '{"period": "morning"}', 'training', 'positive', 'Morgonträning ger bäst resultat', 'Forskning visar att morgonpass kan ge bättre fettförbränning och stabilare energi resten av dagen.', 'Passa på att träna före lunch', 'Morning Exercise Benefits – HI', ARRAY['wellness','ironman','recomp'], ARRAY['run','bike','swim','strength'], 4),
('days_to_goal', '{"operator": "<=", "threshold": 30}', 'training', 'warning', 'Mindre än 30 dagar kvar!', 'Slutspurten börjar. Nu är det dags att börja tänka på tapering och race-specifik förberedelse.', 'Fokusera på race-specifika pass', 'Tapering for Race Day – HI', ARRAY['ironman'], ARRAY['run','bike','swim'], 9),
('days_to_goal', '{"operator": "<=", "threshold": 90}', 'training', 'info', 'Under 90 dagar till mål', 'Du är i bygfasen. Håll volymen uppe och fokusera på att bygga uthållighet och styrka.', 'Håll fokus på konsistens', 'Periodization Principles – HI', ARRAY['ironman'], ARRAY['run','bike','swim'], 6),
('always', '{}', 'recovery', 'positive', 'Konsistens slår perfektion', 'Det viktigaste är inte att varje pass är perfekt – det viktigaste är att du dyker upp. Varje steg räknas.', 'Fortsätt visa upp – du gör det bra!', NULL, ARRAY['wellness','ironman','recomp'], ARRAY['run','bike','swim','strength'], 3),
('always', '{}', 'nutrition', 'info', 'Glöm inte att dricka vatten', 'Dehydrering påverkar både prestation och återhämtning negativt. Sikta på minst 2.5L vatten per dag.', 'Fyll på vattenflaskan nu', 'Hydration & Performance – HI', ARRAY['wellness','ironman','recomp'], ARRAY['run','bike','swim','strength'], 2),
('training_type_today', '{"match_type": "long_swim"}', 'nutrition', 'info', 'Långsim = ät ordentligt innan', 'Simning i vatten kräver extra energi. Se till att du äter ordentligt 2-3h innan passet.', 'Sikta på 310g kolhydrater idag', 'Swimming Nutrition – HI', ARRAY['ironman'], ARRAY['swim'], 7);
