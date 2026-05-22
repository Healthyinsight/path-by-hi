-- Seed knowledge_rules for daily_metrics-based triggers.
-- These rules fire when body_battery or sleep_hours are logged (via Garmin or manual check-in).

INSERT INTO public.knowledge_rules (
  trigger_type,
  trigger_condition,
  category,
  severity,
  insight_title,
  insight_body,
  action_text,
  applicable_archetypes,
  applicable_disciplines,
  priority,
  is_active
)
VALUES
  (
    'body_battery_low',
    '{"threshold": 25}'::jsonb,
    'recovery',
    'warning',
    'Din kropp behöver vila',
    'Ditt body battery är lågt. Prioritera sömn och undvik intensiv träning idag — återhämtning är en del av träningen.',
    'Justera schemat',
    ARRAY['wellness', 'ironman', 'competitor', 'recomp'],
    ARRAY['run', 'bike', 'swim', 'strength'],
    9,
    true
  ),
  (
    'sleep_deficit',
    '{"threshold": 7}'::jsonb,
    'recovery',
    'warning',
    'Sömn är träning',
    'Du har sovit under 7 timmar. Kortvarig sömnbrist påverkar prestation och återhämtning. Prioritera en tidig kväll.',
    null,
    ARRAY['wellness', 'ironman', 'competitor', 'recomp'],
    ARRAY['run', 'bike', 'swim', 'strength'],
    8,
    true
  ),
  (
    'body_battery_high',
    '{"threshold": 80}'::jsonb,
    'training',
    'positive',
    'Redo för ett hårt pass',
    'Ditt body battery är högt — kroppen är laddad. Det är ett bra tillfälle för kvalitetsarbete eller tempopass.',
    'Se dagens pass',
    ARRAY['wellness', 'ironman', 'competitor', 'recomp'],
    ARRAY['run', 'bike', 'swim', 'strength'],
    7,
    true
  )
ON CONFLICT DO NOTHING;
