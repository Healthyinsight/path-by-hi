import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { RecoveryRing } from '@/components/RecoveryRing';
import { InsightCard } from '@/components/InsightCard';
import { getTodayInsights } from '@/data/mockInsights';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Calendar, ChefHat, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { generateSchedule, DEFAULT_ROTATOR } from '@/lib/scheduleEngine';
import { getNutritionTargets } from '@/lib/nutritionEngine';

/* ---- helpers ---- */
const fmtDate = (d: Date) => d.toISOString().split('T')[0];

const RACE_DATE = new Date('2026-07-05');

function daysUntilRace() {
  return Math.max(0, Math.ceil((RACE_DATE.getTime() - Date.now()) / 86400000));
}

function weeksProgress() {
  const totalWeeks = 16;
  const daysLeft = daysUntilRace();
  const weeksLeft = Math.ceil(daysLeft / 7);
  const currentWeek = Math.max(1, totalWeeks - weeksLeft + 1);
  return { currentWeek, totalWeeks };
}

function getGreeting(name: string): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { text: `God morgon, ${name}`, emoji: '☀️' };
  if (hour >= 11 && hour < 17) return { text: `Hej ${name}`, emoji: '👋' };
  if (hour >= 17 && hour < 22) return { text: `God kväll, ${name}`, emoji: '🌙' };
  return { text: `Nattuglan är ute, ${name}`, emoji: '🦉' };
}

function getWorkoutMotivation(sport?: string, type?: string): string {
  if (!sport && !type) return 'Planera din dag – varje steg räknas 🛤️';
  if (type === 'rest' || type === 'swim') {
    if (sport === 'swim') return 'Simdag – låt vattnet bära dig 🏊';
  }
  if (sport === 'run') return 'Löpdag – dags att bygga basen 🏃';
  if (sport === 'swim') return 'Simdag – låt vattnet bära dig 🏊';
  if (sport === 'bike') return 'Cykeldag – känn vinden 🚴';
  if (type === 'strength') return 'Styrkedag – bli starkare än igår 💪';
  if (type === 'rest') return 'Återhämtningsdag – din kropp tackar dig 🙏';
  return 'Planera din dag – varje steg räknas 🛤️';
}

function getUserFirstName(user: any, profile: any): string {
  const meta = user?.user_metadata;
  if (meta?.first_name) return meta.first_name;
  if (meta?.name) return meta.name.split(' ')[0];
  if (profile?.display_name) return profile.display_name.split(' ')[0];
  const email = user?.email || '';
  const local = email.split('@')[0];
  if (local && local.length > 1) return local.charAt(0).toUpperCase() + local.slice(1);
  return 'där';
}

const sportLabels: Record<string, string> = {
  bike: 'Cykling', run: 'Löpning', swim: 'Simning', strength: 'Styrka',
};

const subtypeLabels: Record<string, string> = {
  long_distance: 'Långdistans', vo2max: 'VO2max', upper: 'Överkropp', lower: 'Underkropp',
  long_swim: 'Långsim', technique_intervals: 'Teknik & Intervaller',
};

const workoutIcons: Record<string, string> = {
  bike: '🚴', run: '🏃', swim: '🏊', strength: '💪',
};

const nutritionTips: Record<string, string> = {
  strength: '💪 Styrkedag = höj proteinet. Sikta på 175g+.',
  long_distance: '🚴 Långpass = fuel first. Kolhydrater är din vän idag.',
  vo2max: '⚡ Intervalldag = bra recovery-nutrition efter passet.',
  rest: '🧘 Vilodag = håll proteinet högt, minska kolhydrater.',
  long_swim: '🏊 Långsim = ät ordentligt innan, 310g carbs idag.',
  technique_intervals: '🏊 Tekniksim = lättare dag, perfekt för litet underskott.',
};

const DEFAULT_NUTRITION = { kcal: 2400, protein: 170, carbs: 270, fat: 72 };

/* ---- stagger animation wrapper ---- */
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } },
  },
};

/* ---- component ---- */
export default function TodayView() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const today = fmtDate(new Date());

  const [workout, setWorkout] = useState<any | null>(null);
  const [nutrition, setNutrition] = useState<any | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [loadingNutrition, setLoadingNutrition] = useState(true);

  const insights = useMemo(() => getTodayInsights(), []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('training_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      setWorkout(data);
      setLoadingWorkout(false);
    })();
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('nutrition_plan')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      setNutrition(data);
      setLoadingNutrition(false);
    })();
  }, [user, today]);

  const markCompleted = async () => {
    if (!workout) return;
    const { error } = await supabase
      .from('training_schedule')
      .update({ completed: true })
      .eq('id', workout.id);
    if (error) toast.error('Kunde inte uppdatera');
    else {
      toast.success('Pass genomfört! 💪');
      setWorkout({ ...workout, completed: true });
    }
  };

  const generateNewSchedule = async () => {
    if (!user) return;
    const { entries } = generateSchedule(new Date(), 4, { ...DEFAULT_ROTATOR });
    const rows = entries.map((e) => ({ ...e, user_id: user.id }));
    const { error } = await supabase.from('training_schedule').insert(rows);
    if (error) toast.error('Kunde inte generera schema');
    else {
      toast.success('4-veckors schema genererat! 🎉');
      const { data } = await supabase
        .from('training_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      setWorkout(data);
    }
  };

  const targets = workout
    ? getNutritionTargets(workout.planned_type, workout.planned_subtype)
    : null;
  const nut = nutrition || null;
  const nutTargets = {
    kcal: nut?.target_kcal ?? targets?.kcal ?? DEFAULT_NUTRITION.kcal,
    protein: nut?.target_protein ?? targets?.protein ?? DEFAULT_NUTRITION.protein,
    carbs: nut?.target_carbs ?? targets?.carbs ?? DEFAULT_NUTRITION.carbs,
    fat: nut?.target_fat ?? targets?.fat ?? DEFAULT_NUTRITION.fat,
  };
  const nutActuals = {
    kcal: nut?.actual_kcal ?? 0,
    protein: nut?.actual_protein ?? 0,
    carbs: nut?.actual_carbs ?? 0,
    fat: nut?.actual_fat ?? 0,
  };

  const tipKey = workout?.planned_subtype || workout?.planned_type || 'rest';
  const nutritionTip = nutritionTips[tipKey] || nutritionTips.rest;

  const { currentWeek, totalWeeks } = weeksProgress();
  const daysLeft = daysUntilRace();

  const firstName = getUserFirstName(user, profile);
  const greeting = getGreeting(firstName);
  const motivation = getWorkoutMotivation(
    workout?.planned_sport,
    workout?.planned_type
  );
  const swedishDate = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="app-container pt-4">
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* A. Personal Greeting Header */}
        <motion.section variants={stagger.item} className="space-y-1 mb-2">
          <h1 className="text-xl tracking-tight">
            {greeting.text} {greeting.emoji}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{swedishDate}</p>
          <p className="text-xs text-muted-foreground italic">{motivation}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground font-data-num">
              Vecka {currentWeek}/{totalWeeks} → {profile?.goal_name || 'Ironman 70.3'}
            </span>
            <span className="text-[11px] text-muted-foreground font-data-num">
              · {daysLeft} dagar kvar
            </span>
          </div>
        </motion.section>

        {/* B. Recovery Ring */}
        <motion.section variants={stagger.item}>
          <RecoveryRing />
        </motion.section>

        {/* C. Today's Workout */}
        <motion.section variants={stagger.item}>
          {loadingWorkout ? (
            <div className="card-athletic animate-pulse h-28" />
          ) : workout ? (
            <div className="card-athletic space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{workoutIcons[workout.planned_sport] || '🏋️'}</span>
                  <div>
                    <p className="font-bold text-sm">
                      {sportLabels[workout.planned_sport] || workout.planned_type}
                      {' – '}
                      {subtypeLabels[workout.planned_subtype] || workout.planned_subtype}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{workout.planned_type}</p>
                  </div>
                </div>
                {workout.completed ? (
                  <span className="flex items-center gap-1 rounded-full bg-rest/10 px-3 py-1 text-xs font-medium text-rest">
                    <Check className="h-3 w-3" /> Klart
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Planerat
                  </span>
                )}
              </div>

              {workout.planned_details && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  {workout.planned_type === 'strength' ? (
                    <div className="space-y-1.5">
                      {workout.planned_details.split('\n').slice(0, 3).map((line: string, i: number) => (
                        <p key={i} className="text-xs leading-relaxed">• {line}</p>
                      ))}
                      {workout.planned_details.split('\n').length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{workout.planned_details.split('\n').length - 3} fler övningar
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{workout.planned_details}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!workout.completed && (
                  <Button onClick={markCompleted} size="sm" className="flex-1 touch-target">
                    <Check className="mr-1.5 h-4 w-4" /> Markera som klart
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target"
                  onClick={() => navigate('/schedule')}
                >
                  Ändra plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="card-athletic flex flex-col items-center gap-3 py-6">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-muted-foreground">Inget pass planerat idag</p>
              <Button size="sm" onClick={generateNewSchedule} className="touch-target">
                Generera schema
              </Button>
            </div>
          )}
        </motion.section>

        {/* D. Today's Nutrition */}
        <motion.section variants={stagger.item}>
          {loadingNutrition ? (
            <div className="card-athletic animate-pulse h-28" />
          ) : (
            <div className="card-athletic space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                🍽️ Dagens kost
              </h3>

              <div className="space-y-2">
                {([
                  { label: 'Kalorier', actual: nutActuals.kcal, target: nutTargets.kcal, unit: 'kcal' },
                  { label: 'Protein', actual: nutActuals.protein, target: nutTargets.protein, unit: 'g' },
                  { label: 'Kolhydrater', actual: nutActuals.carbs, target: nutTargets.carbs, unit: 'g' },
                  { label: 'Fett', actual: nutActuals.fat, target: nutTargets.fat, unit: 'g' },
                ] as const).map((macro) => (
                  <div key={macro.label} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{macro.label}</span>
                      <span className="font-data-num">
                        {macro.actual}/{macro.target}{macro.unit}
                      </span>
                    </div>
                    <Progress
                      value={macro.target > 0 ? Math.min(100, (macro.actual / macro.target) * 100) : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              <div className="tip-callout">
                <p className="text-xs">{nutritionTip}</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* E. Insights */}
        <motion.section variants={stagger.item} className="space-y-3">
          <h3 className="text-sm font-bold">💡 Insikter</h3>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </motion.section>

        {/* F. Quick Actions */}
        <motion.section variants={stagger.item} className="pb-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target text-xs"
              onClick={() => navigate('/schedule')}
            >
              <ClipboardList className="mr-1.5 h-4 w-4" /> Logga pass
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target text-xs"
              onClick={() => toast.info('Måltidsloggning kommer snart!')}
            >
              <ChefHat className="mr-1.5 h-4 w-4" /> Logga måltid
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target text-xs"
              onClick={() => navigate('/schedule')}
            >
              <Calendar className="mr-1.5 h-4 w-4" /> Se veckan
            </Button>
          </div>
        </motion.section>
      </motion.div>

      <BottomNav />
    </div>
  );
}
