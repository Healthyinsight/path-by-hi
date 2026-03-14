import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MacroRing } from '@/components/MacroRing';
import { BottomNav } from '@/components/BottomNav';
import {
  Battery, Moon, Heart, Target, Dumbbell, Bike, Waves, Check,
  ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
} from 'recharts';

const RACE_DATE = new Date('2026-07-05');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'God morgon';
  if (h < 17) return 'God eftermiddag';
  return 'God kväll';
}

function getDaysUntilRace() {
  return Math.ceil((RACE_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

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
  cardio: 'bg-cardio/20 text-cardio border-cardio/30',
  strength: 'bg-strength/20 text-strength border-strength/30',
  swim: 'bg-swim/20 text-swim border-swim/30',
  rest: 'bg-rest/20 text-rest border-rest/30',
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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [weekSchedule, setWeekSchedule] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const [todayNutrition, setTodayNutrition] = useState<any>(null);
  const [weekNutrition, setWeekNutrition] = useState<any[]>([]);
  const [zonesOpen, setZonesOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = fmtDate(new Date());
    const weekDates = getWeekDates();
    const weekStart = fmtDate(weekDates[0]);
    const weekEnd = fmtDate(weekDates[6]);

    Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd).order('date'),
      supabase.from('body_metrics').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd).order('date'),
    ]).then(([profileRes, scheduleRes, weekRes, metricsRes, nutritionRes, weekNutRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
      if (scheduleRes.data) setTodaySchedule(scheduleRes.data);
      if (weekRes.data) setWeekSchedule(weekRes.data);
      if (metricsRes.data) setLatestMetrics(metricsRes.data);
      if (nutritionRes.data) setTodayNutrition(nutritionRes.data);
      if (weekNutRes.data) setWeekNutrition(weekNutRes.data);
    });
  }, [user]);

  const userName = profile?.name || user?.user_metadata?.name || 'Athlete';
  const daysLeft = getDaysUntilRace();
  const weekDates = getWeekDates();
  const completedCount = weekSchedule.filter((s) => s.completed).length;
  const totalPlanned = weekSchedule.length;

  // Weekly nutrition chart data
  const chartData = weekDates.map((date, i) => {
    const dateStr = fmtDate(date);
    const entry = weekNutrition.find((n) => n.date === dateStr);
    return {
      day: DAY_LABELS[i],
      consumed: entry?.actual_kcal || 0,
      target: entry?.target_kcal || 0,
    };
  });

  // Recomp
  const currentWeight = latestMetrics?.weight || profile?.current_weight || 82;
  const weekDeficit = weekNutrition.reduce((sum, n) => {
    const diff = (n.actual_kcal || 0) - (n.target_kcal || 0);
    return sum + diff;
  }, 0);

  return (
    <div className="app-container pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {userName}</h1>
        <p className="text-sm text-muted-foreground">Låt oss krossa dagens träning</p>
      </div>

      {/* Race countdown */}
      <div className="card-athletic mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ironman 70.3 Jönköping</p>
          <p className="stat-number text-primary">{daysLeft}</p>
          <p className="text-xs text-muted-foreground">dagar kvar</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Today's workout */}
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
                <div className={`h-4 w-4 rounded-full border-2 transition-all ${
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

      {/* Nutrition summary */}
      <div className="card-athletic mb-4 cursor-pointer" onClick={() => navigate('/nutrition')}>
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
            <Plus className="h-4 w-4" />
            <span>Ingen måltid loggad än</span>
          </div>
        )}
      </div>

      {/* Weekly nutrition chart */}
      {weekNutrition.length > 0 && (
        <div className="card-athletic mb-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Veckans kalorier</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215 20.2% 65.1%)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="target" radius={[4, 4, 0, 0]} barSize={16}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="hsl(217.2 32.6% 25%)" />
                ))}
              </Bar>
              <Bar dataKey="consumed" radius={[4, 4, 0, 0]} barSize={16}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.consumed > 0 ? 'hsl(217 91% 60%)' : 'transparent'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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

      {/* Recomp progress */}
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
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-xs font-semibold text-cardio">🚴 Cykel</p>
              <p className="text-sm">Z2: 140-165W | Z5: 250-270W</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-xs font-semibold text-cardio">🏃 Löpning</p>
              <p className="text-sm">Z2: 5:15-5:45/km | Z5: 4:00-4:15/km</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3">
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
