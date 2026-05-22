-- Seed exercise library. Safe to re-run (ON CONFLICT DO NOTHING keyed on name).
-- is_disc_safe = false marks exercises with high spinal load (avoid with disc issues).

CREATE UNIQUE INDEX IF NOT EXISTS exercises_name_unique ON public.exercises (name);


INSERT INTO public.exercises (name, muscle_group, equipment, category, is_disc_safe, instructions)
VALUES
  -- CHEST – compound
  ('Barbell Bench Press',        'chest',     'barbell',   'compound',  true,  'Lie on bench, grip slightly wider than shoulder-width, lower bar to mid-chest with control, press up.'),
  ('Dumbbell Bench Press',       'chest',     'dumbbell',  'compound',  true,  'Lie on bench, hold dumbbells at chest level, press up and slightly inward, lower with control.'),
  ('Incline Barbell Press',      'chest',     'barbell',   'compound',  true,  'Set bench to 30-45°. Press bar from upper chest. Targets clavicular head.'),
  ('Incline Dumbbell Press',     'chest',     'dumbbell',  'compound',  true,  'Set bench to 30-45°. Press dumbbells from upper chest, slight inward arc at top.'),
  ('Push-Up',                    'chest',     'bodyweight','compound',  true,  'Hands shoulder-width, body straight. Lower chest to floor, press back up.'),
  ('Cable Fly',                  'chest',     'cable',     'isolation', true,  'Set cables at shoulder height. With slight elbow bend, bring hands together in front of chest.'),
  ('Dumbbell Fly',               'chest',     'dumbbell',  'isolation', true,  'Lie on bench. With slight elbow bend, lower dumbbells wide, return in a hugging arc.'),
  ('Chest Dip',                  'chest',     'bodyweight','compound',  true,  'Lean slightly forward on dip bars to emphasise chest over triceps. Lower until upper arms parallel.'),

  -- BACK – compound
  ('Pull-Up',                    'back',      'bodyweight','compound',  true,  'Hang from bar, pull chest toward bar leading with elbows, lower with control.'),
  ('Chin-Up',                    'back',      'bodyweight','compound',  true,  'Supinated grip (palms facing you). Pull chin above bar. Strong bicep involvement.'),
  ('Lat Pulldown',               'back',      'machine',   'compound',  true,  'Grip bar wide, pull to upper chest keeping torso upright and chest tall.'),
  ('Seated Cable Row',           'back',      'cable',     'compound',  true,  'Sit upright, pull handle to lower abdomen, squeeze shoulder blades together.'),
  ('Bent-Over Barbell Row',      'back',      'barbell',   'compound',  false, 'Hip-hinge to ~45°, pull bar to lower ribs. High spinal load – maintain neutral spine.'),
  ('Dumbbell Row',               'back',      'dumbbell',  'compound',  true,  'Brace on bench with one hand/knee. Pull dumbbell to hip, elbow tracking back.'),
  ('T-Bar Row',                  'back',      'barbell',   'compound',  false, 'Straddle bar, hip-hinge, pull to chest. Neutral spine required – disc caution.'),
  ('Face Pull',                  'back',      'cable',     'isolation', true,  'Set cable at face height, pull rope to forehead with elbows high. Targets rear delts.'),
  ('Straight-Arm Pulldown',      'back',      'cable',     'isolation', true,  'Stand, keep arms nearly straight, pull bar from overhead to hips. Isolates lats.'),

  -- SHOULDERS – compound & isolation
  ('Overhead Press',             'shoulders', 'barbell',   'compound',  true,  'Stand or sit, press bar from clavicle to lockout overhead. Keep core braced.'),
  ('Dumbbell Shoulder Press',    'shoulders', 'dumbbell',  'compound',  true,  'Press dumbbells from ear level overhead, controlled descent.'),
  ('Arnold Press',               'shoulders', 'dumbbell',  'compound',  true,  'Start with palms facing you, rotate to face forward as you press overhead.'),
  ('Lateral Raise',              'shoulders', 'dumbbell',  'isolation', true,  'Slight forward lean, raise dumbbells to shoulder height with thumbs slightly down.'),
  ('Front Raise',                'shoulders', 'dumbbell',  'isolation', true,  'Raise dumbbells alternately or together to shoulder height in front. Controlled tempo.'),
  ('Rear Delt Fly',              'shoulders', 'dumbbell',  'isolation', true,  'Hinge forward ~90°, raise dumbbells laterally with slight elbow bend.'),
  ('Upright Row',                'shoulders', 'barbell',   'compound',  true,  'Grip bar narrow, pull to chin level with elbows leading high.'),
  ('Cable Lateral Raise',        'shoulders', 'cable',     'isolation', true,  'Stand beside cable at ankle height, raise arm to shoulder level. Constant tension.'),

  -- ARMS – biceps
  ('Barbell Curl',               'arms',      'barbell',   'isolation', true,  'Elbows pinned to sides, curl bar to chin, lower slowly.'),
  ('Dumbbell Curl',              'arms',      'dumbbell',  'isolation', true,  'Alternate or together. Supinate wrist at top for full contraction.'),
  ('Hammer Curl',                'arms',      'dumbbell',  'isolation', true,  'Neutral grip throughout. Targets brachialis and brachioradialis.'),
  ('Cable Curl',                 'arms',      'cable',     'isolation', true,  'Low cable, curl handle to shoulders with elbows stationary.'),
  ('Preacher Curl',              'arms',      'barbell',   'isolation', true,  'Use preacher bench to eliminate momentum. Full range, slow negative.'),
  ('Incline Dumbbell Curl',      'arms',      'dumbbell',  'isolation', true,  'Lie back on incline bench, curl with arms behind torso for full stretch.'),

  -- ARMS – triceps
  ('Tricep Pushdown',            'arms',      'cable',     'isolation', true,  'Set cable high, elbows pinned to sides, push bar down to full extension.'),
  ('Overhead Tricep Extension',  'arms',      'dumbbell',  'isolation', true,  'Hold one dumbbell overhead with both hands, lower behind head, extend.'),
  ('Skull Crusher',              'arms',      'barbell',   'isolation', true,  'Lie on bench, lower bar to forehead with elbows fixed, press back up.'),
  ('Close-Grip Bench Press',     'arms',      'barbell',   'compound',  true,  'Grip bar at shoulder-width, lower to chest, press. Tricep-dominant bench variant.'),
  ('Dip (Tricep)',               'arms',      'bodyweight','compound',  true,  'Stay upright on dip bars to emphasise triceps. Lower until 90° at elbow.'),

  -- LEGS – quads / compound
  ('Barbell Back Squat',         'legs',      'barbell',   'compound',  false, 'Bar on upper traps, squat to parallel or below. High spinal compression – disc caution.'),
  ('Front Squat',                'legs',      'barbell',   'compound',  true,  'Bar on front delts, more upright torso. Lower spinal load than back squat.'),
  ('Goblet Squat',               'legs',      'dumbbell',  'compound',  true,  'Hold dumbbell at chest, squat deep with upright torso. Good for disc-safe training.'),
  ('Leg Press',                  'legs',      'machine',   'compound',  true,  'Set feet hip-width at mid-plate, press to extension without locking knees.'),
  ('Bulgarian Split Squat',      'legs',      'dumbbell',  'compound',  true,  'Rear foot elevated, lower front knee toward floor. Unilateral quad/glute focus.'),
  ('Walking Lunge',              'legs',      'dumbbell',  'compound',  true,  'Step forward, lower rear knee toward floor, alternate legs. Keep torso upright.'),
  ('Leg Extension',              'legs',      'machine',   'isolation', true,  'Isolates quads. Slow controlled movement – avoid ballistic extension.'),

  -- LEGS – posterior chain
  ('Romanian Deadlift',          'legs',      'barbell',   'compound',  true,  'Hip-hinge with soft knees, bar close to legs, feel hamstring stretch, drive hips forward.'),
  ('Deadlift',                   'legs',      'barbell',   'compound',  false, 'Pull bar from floor with neutral spine. High load – disc caution; master form first.'),
  ('Leg Curl',                   'legs',      'machine',   'isolation', true,  'Seated or lying. Curl heels to glutes with controlled eccentric.'),
  ('Hip Thrust',                 'legs',      'barbell',   'compound',  true,  'Upper back on bench, bar on hips, drive glutes to full extension. Spine stays neutral.'),
  ('Glute Bridge',               'legs',      'bodyweight','isolation', true,  'Bodyweight or with plate on hips. Drive hips up, squeeze glutes at top.'),
  ('Good Morning',               'legs',      'barbell',   'compound',  false, 'Bar on upper traps, hinge forward to ~90°. Extreme spinal load – disc unsafe.'),
  ('Cable Pull-Through',         'legs',      'cable',     'compound',  true,  'Face away from cable set low, hip-hinge pulling rope through legs. Glute/hamstring focus.'),

  -- CORE
  ('Plank',                      'core',      'bodyweight','isolation', true,  'Forearms on floor, body straight from head to heels. Breathe and brace.'),
  ('Dead Bug',                   'core',      'bodyweight','isolation', true,  'Lie on back, lower opposite arm/leg while pressing lower back into floor.'),
  ('Pallof Press',               'core',      'cable',     'isolation', true,  'Cable at chest height, press out and return. Anti-rotation core stability.'),
  ('Ab Wheel Rollout',           'core',      'bodyweight','compound',  true,  'Kneel, roll wheel out as far as possible maintaining hollow body, return.'),
  ('Cable Crunch',               'core',      'cable',     'isolation', true,  'Kneel below high cable, curl spine toward knees. Controlled throughout.'),
  ('Hanging Leg Raise',          'core',      'bodyweight','isolation', true,  'Hang from bar, raise straight legs to 90° or higher. Posterior pelvic tilt at top.'),
  ('Bird Dog',                   'core',      'bodyweight','isolation', true,  'On hands/knees, extend opposite arm and leg while keeping hips level.'),
  ('Side Plank',                 'core',      'bodyweight','isolation', true,  'Stack feet or stagger, body in straight line, hold. Lateral core stability.')

ON CONFLICT (name) DO NOTHING;
