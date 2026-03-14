import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MacroRing } from '@/components/MacroRing';
import { BottomNav } from '@/components/BottomNav';
import { AppHeader } from '@/components/AppHeader';
import { MountainTimeline } from '@/components/MountainTimeline';
import { RaceReadinessGauge } from '@/components/RaceReadinessGauge';
import { CoachingCard } from '@/components/CoachingCard';
import { calculateReadiness } from '@/lib/raceReadiness';
import { getDailyCoachingMessage } from '@/lib/coachingEngine';
import {
  Battery, Moon, Heart, Target, Dumbbell, Bike, Waves, Check,
  ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const sportIcons: Record<string, React.ReactNode> = {
  bike: <Bike className="h-5 w-5" />,
  run: <Target className="h-5 w-5" />,
  swim: <Waves className="h-5 w-5" />,
  strength: <Dumbbell className="h-5 w-5" />,
};

const sportLabels: Record<string, string> = { bike: 'Cykling', run: 'Löpning', swim: 'Simning', strength: 'Styrka' };
const subtypeLabels: Record<string, string> = {
  long_distance: 'Långdistans', vo2max: 'VO2max', upper: 'Överkropp', lower: 'Underkropp',
  long_swim: 'Långsim', technique_intervals: 'Teknik & Intervaller',
};
const typeColors: Record<string, string> = {
  cardio: 'bg-primary/10 text-primary border-primary/20',
  strength: 'bg-secondary/10 text-secondary border-secondary/20',
  swim: 'bg-swim/10 text-swim border-swim/20',
  rest: 'bg-rest/10 text-rest border-rest/20',
};

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const DISTANCE_ESTIMATES: Record<string, { value: number; unit: string; sport: string }> = {
  'cardio_long_distance_bike': { value: 60, unit: 'km', sport: 'cykling' },
  'cardio_vo2max_bike': { value: 30, unit: 'km', sport: 'cykling' },
  'cardio_long_distance_run': { value: 15, unit: 'km', sport: 'löpning' },
  'cardio_vo2max_run': { value: 8, unit: 'km', sport: 'löpning' },
  'swim_long_swim_swim': { value: 2000, unit: 'm', sport: 'simning' },
  'swim_technique_intervals_swim': { value: 1500, unit: 'm', sport: 'simning' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [allSchedule, setAllSchedule] = useState<any[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const [bodyMetrics, setBodyMetrics] = useState<any[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<any>(null);
  const [weekNutrition, setWeekNutrition] = useState<any[]>([]);
  const [allNutrition, setAllNutrition] = useState<any[]>([]);
  const [zonesOpen, setZonesOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = fmtDate(new Date());
    const weekDates = getWeekDates();
    const weekStart = fmtDate(weekDates[0]);
    const weekEnd = fmtDate(weekDates[6]);

    Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd).order('date'),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).order('date'),
      supabase.from('body_metrics').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
      supabase.from('body_metrics').select('date,weight').eq('user_id', user.id).order('date'),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd).order('date'),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).order('date'),
    ]).then(([profileRes, goalRes, scheduleRes, weekRes, allSchedRes, metricsRes, bodyMetRes, nutritionRes, weekNutRes, allNutRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
      if (goalRes.data) setGoal(goalRes.data);
      else {
        // Auto-seed default goal
        supabase.from('user_goals').insert({
          user_id: user.id, goal_name: 'Ironman 70.3 Jönköping',
          goal_date: '2026-07-05', goal_emoji: '🏁', disciplines: ['swim', 'bike', 'run'],
        }).select().single().then(({ data }) => { if (data) setGoal(data); });
      }
      if (scheduleRes.data) setTodaySchedule(scheduleRes.data);
      if (weekRes.data) setWeekSchedule(weekRes.data);
      if (allSchedRes.data) setAllSchedule(allSchedRes.data);
      if (metricsRes.data) setLatestMetrics(metricsRes.data);
      if (bodyMetRes.data) setBodyMetrics(bodyMetRes.data);
      if (nutritionRes.data) setTodayNutrition(nutritionRes.data);
      if (weekNutRes.data) setWeekNutrition(weekNutRes.data);
      if (allNutRes.data) setAllNutrition(allNutRes.data);
    });
  }, [user]);

  const userName = profile?.name || user?.user_metadata?.name || 'Athlete';
  const weekDates = getWeekDates();
  const completedCount = weekSchedule.filter((s) => s.completed).length;
  const totalPlanned = weekSchedule.length;
  const totalCompleted = allSchedule.filter(s => s.completed).length;

  // Rotating stat (changes daily)
  const rotatingStat = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const completedEntries = allSchedule.filter(s => s.completed);
    const stats: string[] = [];

    // Bike km
    const bikeKm = completedEntries.reduce((sum, s) => {
      const key = `${s.planned_type}_${s.planned_subtype}_${s.planned_sport}`;
      return sum + (DISTANCE_ESTIMATES[key]?.sport === 'cykling' ? DISTANCE_ESTIMATES[key].value : 0);
    }, 0);
    if (bikeKm > 0) stats.push(`Du har cyklat ${bikeKm} km hittills 🚴`);

    // Run km
    const runKm = completedEntries.reduce((sum, s) => {
      const key = `${s.planned_type}_${s.planned_subtype}_${s.planned_sport}`;
      return sum + (DISTANCE_ESTIMATES[key]?.sport === 'löpning' ? DISTANCE_ESTIMATES[key].value : 0);
    }, 0);
    if (runKm > 0) stats.push(`Du har sprungit ${runKm} km 🏃`);

    // Swim m
    const swimM = completedEntries.reduce((sum, s) => {
      const key = `${s.planned_type}_${s.planned_subtype}_${s.planned_sport}`;
      return sum + (DISTANCE_ESTIMATES[key]?.sport === 'simning' ? DISTANCE_ESTIMATES[key].value : 0);
    }, 0);
    if (swimM > 0) stats.push(`Du har simmat ${swimM} m 🏊`);

    const strengthCount = completedEntries.filter(s => s.planned_type === 'strength').length;
    if (strengthCount > 0) stats.push(`${strengthCount} styrkepass genomförda 💪`);

    if (stats.length === 0) return 'Starta din resa idag!';
    return stats[dayOfYear % stats.length];
  }, [allSchedule]);

  // Race readiness
  const readiness = useMemo(() => {
    if (!goal) return { training: 0, nutrition: 0, consistency: 0, bodyComp: 70, total: 0 };
    return calculateReadiness(allSchedule, allNutrition, bodyMetrics, goal.goal_date);
  }, [allSchedule, allNutrition, bodyMetrics, goal]);

  const hasEnoughData = allSchedule.filter(s => s.date <= fmtDate(new Date())).length >= 7;

  // Coaching message
  const coaching = useMemo(() => {
    if (!goal) return { emoji: '🏔️', message: 'Sätt ditt mål i inställningarna för att aktivera coaching!' };
    const goalDate = new Date(goal.goal_date);
    const daysRemaining = Math.max(0, Math.ceil((goalDate.getTime() - Date.now()) / 86400000));
    const trainingStart = new Date(goalDate);
    trainingStart.setDate(trainingStart.getDate() - 16 * 7);
    const totalDays = (goalDate.getTime() - trainingStart.getTime()) / 86400000;
    const elapsed = (Date.now() - trainingStart.getTime()) / 86400000;
    const progressPct = Math.min(100, (elapsed / totalDays) * 100);

    return getDailyCoachingMessage(allSchedule, allNutrition, {
      goalName: goal.goal_name, goalDate: goal.goal_date, daysRemaining, progressPct,
    }, todaySchedule);
  }, [goal, allSchedule, allNutrition, todaySchedule]);

  // Weekly chart data
  const chartData = weekDates.map((date, i) => {
    const dateStr = fmtDate(date);
    const entry = weekNutrition.find((n) => n.date === dateStr);
    return { day: DAY_LABELS[i], consumed: entry?.actual_kcal || 0, target: entry?.target_kcal || 0 };
  });

  const currentWeight = latestMetrics?.weight || profile?.current_weight || 82;
  const weekDeficit = weekNutrition.reduce((sum, n) => sum + ((n.actual_kcal || 0) - (n.target_kcal || 0)), 0);

  return (
    <div className="app-container pt-2">
      <AppHeader />

      {/* 1. Mountain Journey Timeline */}
      {goal ? (
        <MountainTimeline
          goalName={goal.goal_name}
          goalEmoji={goal.goal_emoji || '🏁'}
          goalDate={goal.goal_date}
          completedWorkouts={totalCompleted}
          totalWorkouts={allSchedule.length}
          rotatingStat={rotatingStat}
        />
      ) : (
        <div className="card-athletic mb-4 flex flex-col items-center gap-2 py-6">
          <span className="text-2xl">🏔️</span>
          <p className="text-sm text-muted-foreground">Sätt ditt mål i inställningarna</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>Sätt ditt mål</Button>
        </div>
      )}

      {/* 2. Race Readiness Score */}
      <RaceReadinessGauge breakdown={readiness} hasEnoughData={hasEnoughData} />

      {/* 3. Smart Coaching Message */}
      <CoachingCard emoji={coaching.emoji} message={coaching.message} />

      {/* 4. Today's workout */}
      <div className="card-athletic mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Dagens pass</p>
        {todaySchedule ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${typeColors[todaySchedule.planned_type] || 'bg-muted'}`}>
                {sportIcons[todaySchedule.planned_sport || ''] || <Target className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {sportLabels[todaySchedule.planned_sport] || todaySchedule.planned_sport} – {subtypeLabels[todaySchedule.planned_subtype] || todaySchedule.planned_subtype}
                </p>
                {todaySchedule.planned_details && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{todaySchedule.planned_details}</p>
                )}
              </div>
            </div>
            {todaySchedule.completed ? (
              <div className="flex items-center gap-2 rounded-xl bg-rest/10 px-3 py-2 text-sm text-rest">
                <Check className="h-4 w-4" /> Genomfört
              </div>
            ) : (
              <Button className="w-full touch-target" onClick={() => navigate('/schedule')}>Starta pass</Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inget pass planerat idag</p>
        )}
      </div>

      {/* 5. Nutrition summary */}
      <div className="card-athletic mb-4 cursor-pointer transition-all duration-200 hover:shadow-md" onClick={() => navigate('/nutrition')}>
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Dagens näring</p>
        {todayNutrition ? (
          <div className="flex items-center justify-around">
            <MacroRing label="Kcal" current={todayNutrition.actual_kcal} target={todayNutrition.target_kcal} unit="" color="hsl(var(--primary))" size={64} />
            <MacroRing label="Protein" current={todayNutrition.actual_protein} target={todayNutrition.target_protein} unit="g" color="hsl(var(--nutrition-protein))" size={64} />
            <MacroRing label="Carbs" current={todayNutrition.actual_carbs} target={todayNutrition.target_carbs} unit="g" color="hsl(var(--nutrition-carbs))" size={64} />
            <MacroRing label="Fett" current={todayNutrition.actual_fat} target={todayNutrition.target_fat} unit="g" color="hsl(var(--nutrition-fat))" size={64} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" /><span>Ingen måltid loggad än</span>
          </div>
        )}
      </div>

      {/* 6. Weekly nutrition chart */}
      {weekNutrition.length > 0 && (
        <div className="card-athletic mb-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Veckans kalorier</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(200 12% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="target" radius={[4, 4, 0, 0]} barSize={16}>
                {chartData.map((_, i) => <Cell key={i} fill="hsl(207 22% 91%)" />)}
              </Bar>
              <Bar dataKey="consumed" radius={[4, 4, 0, 0]} barSize={16}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.consumed > 0 ? 'hsl(195 38% 50%)' : 'transparent'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Week summary dots */}
      <div className="card-athletic mb-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Denna vecka</p>
        <div className="mb-2 flex items-center justify-around">
          {weekDates.map((date) => {
            const dateStr = fmtDate(date);
            const workout = weekSchedule.find((s) => s.date === dateStr);
            const isToday = dateStr === fmtDate(new Date());
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{DAY_LABELS[(date.getDay() + 6) % 7]}</span>
                <div className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  workout?.completed ? 'border-rest bg-rest'
                  : workout ? `border-primary ${isToday ? 'bg-primary/30' : 'bg-transparent'}`
                  : 'border-muted-foreground/30 bg-transparent'
                }`} />
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">{completedCount} av {totalPlanned} pass genomförda denna vecka</p>
      </div>

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card-athletic flex flex-col items-center">
          <Battery className="mb-1 h-4 w-4 text-rest" />
          <span className="font-mono text-lg font-bold">{latestMetrics?.body_battery ?? '–'}</span>
          <span className="text-[10px] text-muted-foreground">Body Battery</span>
        </div>
        <div className="card-athletic flex flex-col items-center">
          <Moon className="mb-1 h-4 w-4 text-swim" />
          <span className="font-mono text-lg font-bold">{latestMetrics?.sleep_hours ?? '–'}</span>
          <span className="text-[10px] text-muted-foreground">Sömn (h)</span>
        </div>
        <div className="card-athletic flex flex-col items-center">
          <Heart className="mb-1 h-4 w-4 text-destructive" />
          <span className="font-mono text-lg font-bold">{latestMetrics?.hrv_rmssd ?? '–'}</span>
          <span className="text-[10px] text-muted-foreground">HRV</span>
        </div>
      </div>

      {/* 7. Recomp progress */}
      <div className="card-athletic mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Recomp-mål</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-lg font-bold">{currentWeight} kg</p>
            <p className="text-xs text-muted-foreground">Mål: 78–80 kg @ 15% bf</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-muted-foreground">
              {weekDeficit > 0 ? '+' : ''}{weekDeficit} kcal
            </p>
            <p className="text-[10px] text-muted-foreground">veckobalans</p>
          </div>
        </div>
      </div>

      {/* Training zones */}
      <Collapsible open={zonesOpen} onOpenChange={setZonesOpen}>
        <div className="card-athletic mb-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mina zoner</p>
            {zonesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-xs font-semibold text-primary">🚴 Cykel</p>
              <p className="text-sm">Z2: 140-165W | Z5: 250-270W</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-xs font-semibold text-primary">🏃 Löpning</p>
              <p className="text-sm">Z2: 5:15-5:45/km | Z5: 4:00-4:15/km</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Tröskelvärden</p>
              <p className="text-sm">FTP: {profile?.ftp_watts || 230}W | Löptröskel: {profile?.run_threshold_pace || '4:30'}/km</p>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Training phase */}
      <div className="card-athletic">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Träningsfas</p>
        <p className="mt-1 text-lg font-bold capitalize">{profile?.training_phase || 'Base'}</p>
      </div>

      <BottomNav />
    </div>
  );
}
