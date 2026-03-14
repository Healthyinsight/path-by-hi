import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MacroRing } from '@/components/MacroRing';
import { BottomNav } from '@/components/BottomNav';
import { Battery, Moon, Heart, Target, Dumbbell, Bike, Waves } from 'lucide-react';
import type { UserProfile, TrainingSchedule, BodyMetric, NutritionPlan } from '@/types/database';

const RACE_DATE = new Date('2026-07-05');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDaysUntilRace() {
  const now = new Date();
  const diff = RACE_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const sportIcons: Record<string, React.ReactNode> = {
  bike: <Bike className="h-5 w-5" />,
  run: <Target className="h-5 w-5" />,
  swim: <Waves className="h-5 w-5" />,
  strength: <Dumbbell className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  cardio: 'bg-cardio/20 text-cardio border-cardio/30',
  strength: 'bg-strength/20 text-strength border-strength/30',
  swim: 'bg-swim/20 text-swim border-swim/30',
  rest: 'bg-rest/20 text-rest border-rest/30',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TrainingSchedule | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<BodyMetric | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<NutritionPlan | null>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('training_schedule').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('body_metrics').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).single(),
      supabase.from('nutrition_plan').select('*').eq('user_id', user.id).eq('date', today).single(),
    ]).then(([profileRes, scheduleRes, metricsRes, nutritionRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
      if (scheduleRes.data) setTodaySchedule(scheduleRes.data);
      if (metricsRes.data) setLatestMetrics(metricsRes.data);
      if (nutritionRes.data) setTodayNutrition(nutritionRes.data);
    });
  }, [user]);

  const userName = profile?.name || user?.user_metadata?.name || 'Athlete';
  const daysLeft = getDaysUntilRace();

  return (
    <div className="app-container pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">Let's crush today's training</p>
      </div>

      {/* Race countdown */}
      <div className="card-athletic mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ironman 70.3 Jönköping</p>
          <p className="stat-number text-primary">{daysLeft}</p>
          <p className="text-xs text-muted-foreground">days remaining</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Today's workout */}
      <div className="card-athletic mb-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Today's Workout</p>
        {todaySchedule ? (
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${typeColors[todaySchedule.planned_type] || 'bg-muted'}`}>
              {sportIcons[todaySchedule.planned_sport || ''] || <Target className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold capitalize">
                {todaySchedule.planned_sport} – {todaySchedule.planned_subtype?.replace(/_/g, ' ')}
              </p>
              {todaySchedule.planned_details && (
                <p className="text-sm text-muted-foreground">{todaySchedule.planned_details}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workout scheduled for today</p>
        )}
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
          <span className="text-[10px] text-muted-foreground">Sleep (h)</span>
        </div>
        <div className="card-athletic flex flex-col items-center">
          <Heart className="mb-1 h-4 w-4 text-destructive" />
          <span className="font-mono text-lg font-bold">{latestMetrics?.hrv_rmssd ?? '–'}</span>
          <span className="text-[10px] text-muted-foreground">HRV</span>
        </div>
      </div>

      {/* Nutrition summary */}
      <div className="card-athletic mb-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Today's Nutrition</p>
        {todayNutrition ? (
          <div className="flex items-center justify-around">
            <MacroRing
              label="Kcal"
              current={todayNutrition.actual_kcal}
              target={todayNutrition.target_kcal}
              unit=""
              color="hsl(var(--primary))"
            />
            <MacroRing
              label="Protein"
              current={todayNutrition.actual_protein}
              target={todayNutrition.target_protein}
              unit="g"
              color="hsl(var(--strength))"
            />
            <MacroRing
              label="Carbs"
              current={todayNutrition.actual_carbs}
              target={todayNutrition.target_carbs}
              unit="g"
              color="hsl(var(--cardio))"
            />
            <MacroRing
              label="Fat"
              current={todayNutrition.actual_fat}
              target={todayNutrition.target_fat}
              unit="g"
              color="hsl(var(--swim))"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No nutrition plan for today</p>
        )}
      </div>

      {/* Training phase */}
      <div className="card-athletic">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Training Phase</p>
        <p className="mt-1 text-lg font-bold capitalize">{profile?.training_phase || 'Base'}</p>
      </div>

      <BottomNav />
    </div>
  );
}
