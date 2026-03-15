import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { RecoveryRing } from '@/components/RecoveryRing';
import { RaceCountdownArc } from '@/components/RaceCountdownArc';
import { InsightCard } from '@/components/InsightCard';
import { useInsights } from '@/hooks/useInsights';
import { getTodayRecovery, getStreakMessage } from '@/data/mockRecoveryData';
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

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return `God morgon, ${name} ☀️`;
  if (hour >= 11 && hour < 17) return `Hej ${name} 👋`;
  if (hour >= 17 && hour < 22) return `God kväll, ${name} 🌙`;
  return `Nattuglan är ute, ${name} 🦉`;
}

function getWorkoutMotivation(sport?: string, type?: string): string {
  if (!sport && !type) return 'Planera din dag – varje steg räknas 🛤️';
  if (sport === 'swim') return 'Simdag – låt vattnet bära dig 🏊';
  if (sport === 'run') return 'Löpdag – dags att bygga basen 🏃';
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

const sportLabels: Record<string, string> = { bike: 'Cykling', run: 'Löpning', swim: 'Simning', strength: 'Styrka' };
const subtypeLabels: Record<string, string> = {
  long_distance: 'Långdistans', vo2max: 'VO2max', upper: 'Överkropp', lower: 'Underkropp',
  long_swim: 'Långsim', technique_intervals: 'Teknik & Intervaller',
};
const workoutIcons: Record<string, string> = { bike: '🚴', run: '🏃', swim: '🏊', strength: '💪' };
const nutritionTips: Record<string, string> = {
  strength: '💪 Styrkedag = höj proteinet. Sikta på 175g+.',
  long_distance: '🚴 Långpass = fuel first. Kolhydrater är din vän idag.',
  vo2max: '⚡ Intervalldag = bra recovery-nutrition efter passet.',
  rest: '🧘 Vilodag = håll proteinet högt, minska kolhydrater.',
  long_swim: '🏊 Långsim = ät ordentligt innan, 310g carbs idag.',
  technique_intervals: '🏊 Tekniksim = lättare dag, perfekt för litet underskott.',
};
const DEFAULT_NUTRITION = { kcal: 2400, protein: 170, carbs: 270, fat: 72 };

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#5095AC', '#839F8D', '#D4E67C', '#FFFFFF'],
    gravity: 1.2,
    ticks: 150,
  });
}

/* ---- stagger animation ---- */
const cardVariant = (i: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
});

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

  const { insights, loading: loadingInsights } = useInsights();
  const [showAllInsights, setShowAllInsights] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
      setWorkout(data);
      setLoadingWorkout(false);
    })();
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
      setNutrition(data);
      setLoadingNutrition(false);
    })();
  }, [user, today]);

  const markCompleted = async () => {
    if (!workout) return;
    const { error } = await supabase
      .from('training_schedule').update({ completed: true }).eq('id', workout.id);
    if (error) {
      toast.error('Kunde inte uppdatera');
    } else {
      fireConfetti();
      const streak = recovery.currentStreak + 1;
      const milestoneMsg = getStreakMessage(streak);
      toast.success(milestoneMsg || `🎉 Bra jobbat! ${streak} dagar i rad!`);
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
        .from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
      setWorkout(data);
    }
  };

  const targets = workout ? getNutritionTargets(workout.planned_type, workout.planned_subtype) : null;
  const nut = nutrition || null;
  const nutTargets = {
    kcal: nut?.target_kcal ?? targets?.kcal ?? DEFAULT_NUTRITION.kcal,
    protein: nut?.target_protein ?? targets?.protein ?? DEFAULT_NUTRITION.protein,
    carbs: nut?.target_carbs ?? targets?.carbs ?? DEFAULT_NUTRITION.carbs,
    fat: nut?.target_fat ?? targets?.fat ?? DEFAULT_NUTRITION.fat,
  };
  const nutActuals = {
    kcal: nut?.actual_kcal ?? 0, protein: nut?.actual_protein ?? 0,
    carbs: nut?.actual_carbs ?? 0, fat: nut?.actual_fat ?? 0,
  };

  const tipKey = workout?.planned_subtype || workout?.planned_type || 'rest';
  const nutritionTip = nutritionTips[tipKey] || nutritionTips.rest;
  const { currentWeek, totalWeeks } = weeksProgress();
  const daysLeft = daysUntilRace();
  const firstName = getUserFirstName(user, profile);
  const greeting = getGreeting(firstName);
  const motivation = getWorkoutMotivation(workout?.planned_sport, workout?.planned_type);
  const swedishDate = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="bg-today">
      <div className="app-container pt-4">
        {/* 0. Greeting Header */}
        <motion.section
          variants={cardVariant(0)}
          initial="hidden"
          animate="visible"
          className="mb-5"
        >
          <div className="flex items-center justify-between">
            <h1 style={{ fontFamily: "'Merriweather', serif", fontSize: '24px', fontWeight: 700, color: '#1A2B32' }}>
              {greeting}
            </h1>
            {recovery.currentStreak > 0 && (
              <span className="streak-pill">🔥 {recovery.currentStreak} dagar i rad</span>
            )}
          </div>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '14px', color: '#6B7B84', marginTop: '4px', textTransform: 'capitalize' }}>
            {swedishDate}
          </p>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontStyle: 'italic', color: '#8E9BA3', marginTop: '2px' }}>
            {motivation}
          </p>
        </motion.section>

        {/* 1. Recovery Ring */}
        <motion.section variants={cardVariant(1)} initial="hidden" animate="visible" className="mb-4">
          <RecoveryRing />
        </motion.section>

        {/* 2. Race Countdown */}
        <motion.section variants={cardVariant(2)} initial="hidden" animate="visible" className="mb-4">
          <RaceCountdownArc
            currentWeek={currentWeek}
            totalWeeks={totalWeeks}
            daysLeft={daysLeft}
            goalName={profile?.goal_name || 'Ironman 70.3 Jönköping'}
          />
        </motion.section>

        {/* 3. Workout Card */}
        <motion.section variants={cardVariant(3)} initial="hidden" animate="visible" className="mb-4">
          {loadingWorkout ? (
            <div className="card-glass animate-pulse h-28" />
          ) : workout ? (
            <div className="card-glass space-y-3" style={{ opacity: workout.completed ? 0.85 : 1 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '24px' }}>{workoutIcons[workout.planned_sport] || '🏋️'}</span>
                  <div>
                    <p style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32' }}>
                      {workout.completed && '✅ '}
                      {sportLabels[workout.planned_sport] || workout.planned_type}
                      {' – '}
                      {subtypeLabels[workout.planned_subtype] || workout.planned_subtype}
                    </p>
                    <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#6B7B84', textTransform: 'capitalize' }}>
                      {workout.planned_type}
                    </p>
                  </div>
                </div>
                {workout.completed ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    borderRadius: '9999px', padding: '4px 12px',
                    background: 'rgba(131, 159, 141, 0.15)',
                    fontFamily: "'Merriweather Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#839F8D',
                  }}>
                    ✅ Klart
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    borderRadius: '9999px', padding: '4px 12px',
                    background: 'rgba(80, 149, 172, 0.1)',
                    fontFamily: "'Merriweather Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#5095AC',
                  }}>
                    Planerat
                  </span>
                )}
              </div>

              {workout.planned_details && (
                <div style={{ borderRadius: '12px', border: '1px solid #E8EDEF', background: '#F0F4F5', padding: '12px' }}>
                  {workout.planned_type === 'strength' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {workout.planned_details.split('\n').slice(0, 3).map((line: string, i: number) => (
                        <p key={i} style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#3D4F58', lineHeight: 1.6 }}>• {line}</p>
                      ))}
                      {workout.planned_details.split('\n').length > 3 && (
                        <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '12px', color: '#8E9BA3' }}>
                          +{workout.planned_details.split('\n').length - 3} fler övningar
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#3D4F58', lineHeight: 1.6 }}>
                      {workout.planned_details}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!workout.completed && (
                  <Button
                    onClick={markCompleted}
                    size="sm"
                    className="flex-1 touch-target"
                    style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Markera som klart
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target"
                  onClick={() => navigate('/schedule')}
                  style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
                >
                  Ändra plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="card-glass flex flex-col items-center gap-3 py-6">
              <span style={{ fontSize: '32px' }}>📋</span>
              <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '14px', color: '#6B7B84' }}>
                Inget pass planerat idag
              </p>
              <Button
                size="sm"
                onClick={generateNewSchedule}
                className="touch-target"
                style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
              >
                Generera schema
              </Button>
            </div>
          )}
        </motion.section>

        {/* 4. Nutrition */}
        <motion.section variants={cardVariant(4)} initial="hidden" animate="visible" className="mb-4">
          {loadingNutrition ? (
            <div className="card-glass animate-pulse h-28" />
          ) : (
            <div className="card-glass space-y-3">
              <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🍽️ Dagens kost
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { label: 'Kalorier', actual: nutActuals.kcal, target: nutTargets.kcal, unit: 'kcal' },
                  { label: 'Protein', actual: nutActuals.protein, target: nutTargets.protein, unit: 'g' },
                  { label: 'Kolhydrater', actual: nutActuals.carbs, target: nutTargets.carbs, unit: 'g' },
                  { label: 'Fett', actual: nutActuals.fat, target: nutTargets.fat, unit: 'g' },
                ] as const).map((macro) => (
                  <div key={macro.label}>
                    <div className="flex justify-between" style={{ marginBottom: '2px' }}>
                      <span style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#6B7B84' }}>
                        {macro.label}
                      </span>
                      <span className="font-data-num" style={{ fontSize: '13px', color: '#3D4F58' }}>
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
                <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', color: '#3D4F58' }}>
                  {nutritionTip}
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* 5. Insights */}
        <motion.section variants={cardVariant(5)} initial="hidden" animate="visible" className="mb-4 space-y-3">
          <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32' }}>
            💡 Insikter
          </h3>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </motion.section>

        {/* 6. Quick Actions */}
        <motion.section variants={cardVariant(6)} initial="hidden" animate="visible" className="pb-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => navigate('/schedule')}
              style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <ClipboardList className="mr-1.5 h-4 w-4" /> Logga pass
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => toast.info('Måltidsloggning kommer snart!')}
              style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <ChefHat className="mr-1.5 h-4 w-4" /> Logga måltid
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => navigate('/schedule')}
              style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <Calendar className="mr-1.5 h-4 w-4" /> Se veckan
            </Button>
          </div>
        </motion.section>

        <BottomNav />
      </div>
    </div>
  );
}
