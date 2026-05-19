import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSchedule } from '@/hooks/useSchedule';
import { getNutritionPlan } from '@/services/nutritionService';
import { BottomNav } from '@/components/BottomNav';
import { RecoveryRing } from '@/components/RecoveryRing';
import { RaceCountdownArc } from '@/components/RaceCountdownArc';
import { InsightCard } from '@/components/InsightCard';
import { useInsights } from '@/hooks/useInsights';
import { getTodayRecovery, getStreakMilestone } from '@/data/mockRecoveryData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Check, Calendar, ChefHat, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { getNutritionTargets } from '@/lib/nutritionEngine';
import { addMetrics, getLatestMetrics, getMetricsHistory } from '@/services/metricsService';

/* ---- helpers ---- */
const fmtDate = (d: Date) => d.toISOString().split('T')[0];

function getUserFirstName(user: any, profile: any): string {
  const meta = user?.user_metadata;
  if (meta?.first_name) return meta.first_name;
  if (meta?.name) return meta.name.split(' ')[0];
  if (profile?.display_name) return profile.display_name.split(' ')[0];
  const email = user?.email || '';
  const local = email.split('@')[0];
  if (local && local.length > 1) return local.charAt(0).toUpperCase() + local.slice(1);
  return '';
}

const workoutIcons: Record<string, string> = { bike: '🚴', run: '🏃', swim: '🏊', strength: '💪' };
const DEFAULT_NUTRITION = { kcal: 2400, protein: 170, carbs: 270, fat: 72 };

function moodStorageKey(userId: string, day: string) {
  return `pathTracker.dailyMood.${userId}.${day}`;
}

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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const {
    schedule,
    loading: loadingWorkout,
    regenerate,
    markWorkoutCompleted,
    today,
  } = useSchedule();

  const workout = schedule[0] ?? null;

  const [nutrition, setNutrition] = useState<any | null>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [latestMetrics, setLatestMetrics] = useState<{
    body_battery: number | null;
    hrv_rmssd: number | null;
    sleep_quality_score: number | null;
    garmin_measured_at: string | null;
    created_at: string;
    date: string | null;
  } | null>(null);
  const [loadingGarminBattery, setLoadingGarminBattery] = useState(true);

  const { insights, loading: loadingInsights } = useInsights(profile);
  const recovery = useMemo(() => getTodayRecovery(), []);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [moodSliderValue, setMoodSliderValue] = useState([3]);
  const [savedMoodToday, setSavedMoodToday] = useState<number | null>(null);
  const [showRecoveryMoodCard, setShowRecoveryMoodCard] = useState(false);
  const [showInlineMoodChoices, setShowInlineMoodChoices] = useState(false);

  const insightsLimited = insights.slice(0, 2);

  // True only when at least one Garmin field is non-null within the last 7 days
  const hasGarminRecoveryData = useMemo(() => {
    if (loadingGarminBattery || !latestMetrics) return false;
    const hasSignal =
      latestMetrics.body_battery != null ||
      latestMetrics.hrv_rmssd != null ||
      latestMetrics.sleep_quality_score != null;
    if (!hasSignal) return false;
    const dateStr =
      latestMetrics.date ?? latestMetrics.garmin_measured_at ?? latestMetrics.created_at;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(dateStr) >= sevenDaysAgo;
  }, [loadingGarminBattery, latestMetrics]);

  // Race countdown derived from profile.goal_date (not hardcoded)
  const goalDateStr = profile?.goal_date ?? null;
  const raceDate = useMemo(
    () => (goalDateStr ? new Date(goalDateStr + 'T00:00:00') : null),
    [goalDateStr],
  );
  const daysLeft = useMemo(
    () =>
      raceDate ? Math.max(0, Math.ceil((raceDate.getTime() - Date.now()) / 86400000)) : 0,
    [raceDate],
  );
  const { currentWeek, totalWeeks } = useMemo(() => {
    if (!raceDate) return { currentWeek: 1, totalWeeks: 16 };
    const tw = 16;
    const wLeft = Math.ceil(daysLeft / 7);
    return { currentWeek: Math.max(1, tw - wLeft + 1), totalWeeks: tw };
  }, [raceDate, daysLeft]);

  const trSport = (s?: string | null) =>
    s && ['bike', 'run', 'swim', 'strength'].includes(s) ? t(`sports.${s}`) : s || '';
  const trSubtype = (s?: string | null) =>
    s &&
    ['long_distance', 'vo2max', 'upper', 'lower', 'long_swim', 'technique_intervals'].includes(s)
      ? t(`subtypes.${s}`)
      : s || '';

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await getNutritionPlan(user.id, today);
      setNutrition(data);
      setLoadingNutrition(false);
    })();
  }, [user, today]);

  useEffect(() => {
    if (!user) {
      setLatestMetrics(null);
      setLoadingGarminBattery(false);
      return;
    }
    setLoadingGarminBattery(true);
    void (async () => {
      const { data, error } = await getLatestMetrics(user.id);
      if (error) {
        console.warn('[TodayView] getLatestMetrics', error);
        setLatestMetrics(null);
      } else if (!data) {
        setLatestMetrics(null);
      } else {
        setLatestMetrics({
          body_battery: data.body_battery,
          hrv_rmssd: data.hrv_rmssd,
          sleep_quality_score: data.sleep_quality_score,
          garmin_measured_at: data.garmin_measured_at,
          created_at: data.created_at,
          date: (data as any).date ?? null,
        });
      }
      setLoadingGarminBattery(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedMoodToday(null);
      return;
    }
    try {
      const raw = localStorage.getItem(moodStorageKey(user.id, today));
      if (!raw) {
        setSavedMoodToday(null);
        return;
      }
      const parsed = JSON.parse(raw) as { value?: unknown };
      if (typeof parsed.value === 'number' && parsed.value >= 1 && parsed.value <= 5) {
        setSavedMoodToday(parsed.value);
      } else {
        setSavedMoodToday(null);
      }
    } catch {
      setSavedMoodToday(null);
    }
  }, [user, today]);

  useEffect(() => {
    if (!user) {
      setShowRecoveryMoodCard(false);
      return;
    }
    void (async () => {
      try {
        const todayDate = new Date(today);
        const start = new Date(todayDate);
        start.setDate(todayDate.getDate() - 7);
        const startStr = fmtDate(start);
        const { data } = await getMetricsHistory(user.id, startStr, today);
        const withMood = (data ?? []).filter(
          (m) => typeof m.mood_score === 'number' && m.mood_score !== null,
        );
        if (withMood.length === 0) {
          setShowRecoveryMoodCard(true);
          return;
        }
        const last = withMood[withMood.length - 1]!;
        const lastDate = new Date(last.date as string);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / 86400000,
        );
        setShowRecoveryMoodCard(diffDays > 3);
      } catch {
        setShowRecoveryMoodCard(true);
      }
    })();
  }, [user, today]);

  const openMoodDialog = () => {
    setMoodSliderValue([savedMoodToday ?? 3]);
    setMoodDialogOpen(true);
  };

  const saveMood = () => {
    if (!user) return;
    const v = moodSliderValue[0] ?? 3;
    try {
      localStorage.setItem(
        moodStorageKey(user.id, today),
        JSON.stringify({ value: v, at: new Date().toISOString() }),
      );
      setSavedMoodToday(v);
      toast.success(t('today.toastMoodSaved'));
    } catch {
      toast.error(t('today.toastMoodFail'));
    }
    setMoodDialogOpen(false);
  };

  const handleQuickMoodSelect = async (moodValue: number) => {
    if (!user) {
      toast.error(t('today.toastMoodFail'));
      return;
    }

    const invertedMood = 6 - moodValue;

    const { error } = await addMetrics(user.id, {
      date: today,
      mood_score: invertedMood,
    } as any);

    if (error) {
      toast.error(t('today.toastMoodFail'));
      return;
    }

    toast.success('Tack! Noterat.');
    setShowRecoveryMoodCard(false);
    setShowInlineMoodChoices(false);
  };

  const markCompleted = async () => {
    if (!workout) return;
    const ok = await markWorkoutCompleted(workout.id);
    if (ok) {
      fireConfetti();
      const streak = recovery.currentStreak + 1;
      const milestone = getStreakMilestone(streak);
      if (milestone === 30) toast.success(t('streak.m30'));
      else if (milestone === 14) toast.success(t('streak.m14'));
      else if (milestone === 7) toast.success(t('streak.m7'));
      else toast.success(t('today.toastStreakDefault', { streak }));
    }
  };

  const generateNewSchedule = async () => {
    if (!user) {
      console.warn('[TodayView] generateNewSchedule: no user');
      return;
    }
    if (!profile) {
      console.warn('[TodayView] generateNewSchedule: profile not loaded');
      toast.error(t('today.toastNoProfile'));
      return;
    }

    console.log('[TodayView] generateNewSchedule', {
      userId: user.id,
      profile,
    });

    await regenerate({
      archetype: profile.archetype,
      disciplines: profile.disciplines || [],
      goal_date: profile.goal_date,
    });
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

  const tipKey = (workout?.planned_subtype || workout?.planned_type || 'rest') as string;
  const nutritionTipKey = [
    'strength',
    'long_distance',
    'vo2max',
    'rest',
    'long_swim',
    'technique_intervals',
  ].includes(tipKey)
    ? tipKey
    : 'rest';
  const nutritionTip = t(`today.nutritionTip.${nutritionTipKey}` as 'today.nutritionTip.rest');
  const firstNameRaw = getUserFirstName(user, profile);
  const firstName = firstNameRaw || t('common.nameFallback');
  const greeting = useMemo(() => {
    if (profile?.trail_name) return t('today.greetingTrail', { name: profile.trail_name });
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return t('today.greetingMorning', { name: firstName });
    if (hour >= 11 && hour < 17) return t('today.greetingDay', { name: firstName });
    if (hour >= 17 && hour < 22) return t('today.greetingEvening', { name: firstName });
    return t('today.greetingNight', { name: firstName });
  }, [profile?.trail_name, firstName, t]);
  const motivation = useMemo(() => {
    const sport = workout?.planned_sport;
    const type = workout?.planned_type;
    if (!sport && !type) return t('today.motivationDefault');
    if (sport === 'swim') return t('today.motivationSwim');
    if (sport === 'run') return t('today.motivationRun');
    if (sport === 'bike') return t('today.motivationBike');
    if (type === 'strength') return t('today.motivationStrength');
    if (type === 'rest') return t('today.motivationRest');
    return t('today.motivationDefault');
  }, [workout?.planned_sport, workout?.planned_type, t]);
  const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE';
  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const trainingPhase = profile?.training_phase as
    | 'base'
    | 'build'
    | 'peak'
    | 'taper'
    | undefined;

  const fallbackPhaseInsightBody = useMemo(() => {
    switch (trainingPhase) {
      case 'base':
        return 'Bygg din aeroba bas. Håll 80% av träningen i Zone 2 den här perioden.';
      case 'build':
        return 'Nu ökar belastningen. Säkerställ att du sover 7–9h och äter tillräckligt protein.';
      case 'peak':
        return 'Peak-fasen kräver precision. Lyssna noga på kroppen och undvik extra stress.';
      case 'taper':
        return 'Tapern är en del av träningen. Motstå frestelsen att träna mer — vila är strategi.';
      default:
        return 'Konsistens slår intensitet. Ett pass är bättre än inget pass.';
    }
  }, [trainingPhase]);

  const isRestDay = !!workout && workout.planned_type === 'rest';
  const hasWorkoutToday = !!workout && !isRestDay;
  const workoutSectionRef = useRef<HTMLDivElement | null>(null);

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
              <span className="streak-pill">🔥 {t('today.streakDays', { count: recovery.currentStreak })}</span>
            )}
          </div>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '14px', color: '#6B7B84', marginTop: '4px', textTransform: 'capitalize' }}>
            {formattedDate}
          </p>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontStyle: 'italic', color: '#8E9BA3', marginTop: '2px' }}>
            {motivation}
          </p>
        </motion.section>

        {/* Garmin Body Battery — only render when live data is available */}
        {!loadingGarminBattery && hasGarminRecoveryData && latestMetrics?.body_battery != null && (
          <motion.section variants={cardVariant(0)} initial="hidden" animate="visible" className="mb-4">
            <div className="card-glass space-y-1 py-4">
              <p
                style={{
                  fontFamily: "'Merriweather', serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1A2B32',
                }}
              >
                {t('today.bodyBatteryLatest')}
              </p>
              <p
                className="font-data-num"
                style={{ fontSize: '28px', fontWeight: 700, color: '#5095AC' }}
              >
                {latestMetrics.body_battery}
              </p>
              <p
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '12px',
                  color: '#6B7B84',
                }}
              >
                {t('today.lastUpdated')}{' '}
                {new Date(
                  latestMetrics.garmin_measured_at ?? latestMetrics.created_at,
                ).toLocaleString('sv-SE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </motion.section>
        )}

        {/* Recovery mood inline card when no recent body_metrics */}
        <AnimatePresence>
          {showRecoveryMoodCard && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '22px' }}>💤</span>
                  <h3
                    style={{
                      fontFamily: "'Merriweather', serif",
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#1A2B32',
                    }}
                  >
                    Hur mår kroppen?
                  </h3>
                </div>
                <p
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '14px',
                    color: '#6B7B84',
                    marginTop: '6px',
                  }}
                >
                  Logga hur du känner dig så kan appen ge bättre råd.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    className="touch-target"
                    style={{
                      borderRadius: '9999px',
                      backgroundColor: '#5095AC',
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontWeight: 600,
                    }}
                    onClick={() => setShowInlineMoodChoices((v) => !v)}
                  >
                    Logga hur du mår
                  </Button>
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    style={{
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontSize: '13px',
                      color: '#5095AC',
                      textDecoration: 'underline',
                    }}
                  >
                    Till inställningar
                  </button>
                </div>
                <AnimatePresence>
                  {showInlineMoodChoices && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"
                    >
                      {[
                        { value: 1, label: '😫 Utmattad' },
                        { value: 2, label: '😕 Trött' },
                        { value: 3, label: '😐 Okej' },
                        { value: 4, label: '😊 Bra' },
                        { value: 5, label: '🚀 På topp' },
                      ].map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => void handleQuickMoodSelect(m.value)}
                          className="h-10 rounded-full border text-sm"
                          style={{
                            borderColor: '#E0E7EB',
                            fontFamily: "'Merriweather Sans', sans-serif",
                            color: '#1A2B32',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 1. Insights */}
        <motion.section variants={cardVariant(5)} initial="hidden" animate="visible" className="mb-4 space-y-3">
          <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32' }}>
            💡 {t('today.insightsTitle')}
          </h3>
          {loadingInsights ? (
            <>
              <div className="card-glass animate-pulse h-24" />
              <div className="card-glass animate-pulse h-20" />
            </>
          ) : insights.length === 0 ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-white p-4 shadow-sm space-y-3"
              >
                <p
                  style={{
                    fontFamily: "'Merriweather', serif",
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1A2B32',
                  }}
                >
                  Dagens rekommendation
                </p>
                <p
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '14px',
                    color: '#3D4F58',
                    lineHeight: 1.5,
                  }}
                >
                  {fallbackPhaseInsightBody}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasWorkoutToday ? (
                    <Button
                      className="touch-target"
                      style={{
                        borderRadius: '10px',
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 600,
                        backgroundColor: '#5095AC',
                      }}
                      onClick={() => {
                        workoutSectionRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    >
                      Se dagens pass
                    </Button>
                  ) : (
                    <Button
                      className="touch-target"
                      style={{
                        borderRadius: '10px',
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 600,
                        backgroundColor: '#5095AC',
                      }}
                      onClick={() => navigate('/schedule')}
                    >
                      Justera schemat
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <>
              {insightsLimited.map((rule, i) => (
                <InsightCard key={rule.id} rule={rule} index={i} />
              ))}
            </>
          )}
        </motion.section>

        {/* 2. Recovery Ring — only render when live Garmin data exists. No empty rings/skeletons. */}
        {hasGarminRecoveryData && (
          <motion.section variants={cardVariant(1)} initial="hidden" animate="visible" className="mb-4">
            <RecoveryRing variant="live" />
          </motion.section>
        )}

        {/* 3. Race Countdown — only shown when show_race_countdown is set and goal_date exists */}
        {profile?.show_race_countdown && profile?.goal_date && (
          <motion.section variants={cardVariant(2)} initial="hidden" animate="visible" className="mb-4">
            <RaceCountdownArc
              currentWeek={currentWeek}
              totalWeeks={totalWeeks}
              daysLeft={daysLeft}
              goalName={profile?.goal_name || 'Ironman 70.3 Jönköping'}
            />
          </motion.section>
        )}

        {/* 4. Workout Card */}
        <motion.section
          variants={cardVariant(3)}
          initial="hidden"
          animate="visible"
          className="mb-4"
          ref={workoutSectionRef}
        >
          {loadingWorkout ? (
            <div className="card-glass animate-pulse h-28" />
          ) : workout ? (
            isRestDay ? (
              <div className="card-glass space-y-3 py-6">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '28px' }}>🛌</span>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Merriweather', serif",
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1A2B32',
                      }}
                    >
                      Vilodag
                    </p>
                    <p
                      style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontSize: '14px',
                        color: '#6B7B84',
                        lineHeight: 1.5,
                      }}
                    >
                      Din kropp bygger styrka nu. Aktiv återhämtning är också träning.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    size="sm"
                    className="touch-target w-full sm:w-auto"
                    style={{
                      borderRadius: '10px',
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontWeight: 600,
                    }}
                    onClick={() => navigate('/schedule')}
                  >
                    Se veckans schema
                  </Button>
                </div>
              </div>
            ) : (
            <div className="card-glass space-y-3" style={{ opacity: workout.completed ? 0.85 : 1 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '24px' }}>{workoutIcons[workout.planned_sport] || '🏋️'}</span>
                  <div>
                    <p style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32' }}>
                      {workout.completed && '✅ '}
                      {trSport(workout.planned_sport) || workout.planned_type}
                      {' – '}
                      {trSubtype(workout.planned_subtype) || workout.planned_subtype}
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
                    ✅ {t('today.workoutDone')}
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    borderRadius: '9999px', padding: '4px 12px',
                    background: 'rgba(80, 149, 172, 0.1)',
                    fontFamily: "'Merriweather Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#5095AC',
                  }}>
                    {t('today.workoutPlanned')}
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
                          {t('today.moreExercises', {
                            count: workout.planned_details.split('\n').length - 3,
                          })}
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
                    <Check className="mr-1.5 h-4 w-4" /> {t('today.markComplete')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target"
                  onClick={() => navigate('/schedule')}
                  style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
                >
                  {t('today.changePlan')}
                </Button>
              </div>
            </div>
            )
          ) : (
            <div className="card-glass space-y-3 py-6">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '28px' }}>📅</span>
                <div>
                  <p
                    style={{
                      fontFamily: "'Merriweather', serif",
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1A2B32',
                    }}
                  >
                    Ingen träning planerad idag
                  </p>
                  <p
                    style={{
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontSize: '14px',
                      color: '#6B7B84',
                      lineHeight: 1.5,
                    }}
                  >
                    Det kan vara en välförtjänt vilodag — eller så saknas ett schema.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  onClick={generateNewSchedule}
                  className="touch-target w-full sm:flex-1"
                  style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
                >
                  Generera nytt schema
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target w-full sm:flex-1"
                  onClick={() => navigate('/schedule')}
                  style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 600 }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Se hela veckan
                </Button>
              </div>
            </div>
          )}
        </motion.section>

        {/* 5. Nutrition */}
        <motion.section variants={cardVariant(4)} initial="hidden" animate="visible" className="mb-4">
          {loadingNutrition ? (
            <div className="card-glass animate-pulse h-28" />
          ) : (
            <div className="card-glass space-y-3">
              <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '16px', fontWeight: 600, color: '#1A2B32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🍽️ {t('today.nutritionTitle')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { label: t('today.calories'), actual: nutActuals.kcal, target: nutTargets.kcal, unit: 'kcal' },
                  { label: t('today.protein'), actual: nutActuals.protein, target: nutTargets.protein, unit: 'g' },
                  { label: t('today.carbs'), actual: nutActuals.carbs, target: nutTargets.carbs, unit: 'g' },
                  { label: t('today.fat'), actual: nutActuals.fat, target: nutTargets.fat, unit: 'g' },
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

        {/* Garmin integration CTA — subtle, shown only when no recovery data */}
        {!loadingGarminBattery && !hasGarminRecoveryData && (
          <motion.section variants={cardVariant(7)} initial="hidden" animate="visible" className="mb-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8EDEF] bg-white/60 px-4 py-3">
              <p
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '13px',
                  color: '#6B7B84',
                  lineHeight: 1.5,
                }}
              >
                Koppla träningsdata för djupare återhämtningsanalys
              </p>
              <a
                href="/settings#integrations"
                style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '12px',
                  color: '#5095AC',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                Läs mer →
              </a>
            </div>
          </motion.section>
        )}

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
              <ClipboardList className="mr-1.5 h-4 w-4" /> {t('today.logWorkout')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => toast.info(t('today.mealComingSoon'))}
              style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <ChefHat className="mr-1.5 h-4 w-4" /> {t('today.logMeal')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
              onClick={() => navigate('/schedule')}
              style={{ borderRadius: '10px', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <Calendar className="mr-1.5 h-4 w-4" /> {t('today.seeWeek')}
            </Button>
          </div>
        </motion.section>

        <Dialog open={moodDialogOpen} onOpenChange={setMoodDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Merriweather', serif" }}>{t('today.moodDialogTitle')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Merriweather Sans', sans-serif" }}>
              {t('today.moodDialogHint')}
            </p>
            <div className="py-4">
              <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                <span>1</span>
                <span className="font-data-num text-foreground text-lg">{moodSliderValue[0] ?? 3}</span>
                <span>5</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={moodSliderValue}
                onValueChange={setMoodSliderValue}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setMoodDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={saveMood}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </div>
  );
}
