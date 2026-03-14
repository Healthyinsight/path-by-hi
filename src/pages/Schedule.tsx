import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { generateSchedule, DEFAULT_ROTATOR } from '@/lib/scheduleEngine';
import {
  Check,
  Bike,
  Dumbbell,
  Waves,
  Target,
  Coffee,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const sportIcons: Record<string, React.ReactNode> = {
  bike: <Bike className="h-5 w-5" />,
  run: <Target className="h-5 w-5" />,
  swim: <Waves className="h-5 w-5" />,
  strength: <Dumbbell className="h-5 w-5" />,
};

const typeConfig: Record<string, { color: string; bgClass: string }> = {
  cardio: { color: 'text-cardio', bgClass: 'bg-cardio/15 border-cardio/30' },
  strength: { color: 'text-strength', bgClass: 'bg-strength/15 border-strength/30' },
  swim: { color: 'text-swim', bgClass: 'bg-swim/15 border-swim/30' },
  rest: { color: 'text-rest', bgClass: 'bg-rest/15 border-rest/30' },
};

const sportLabels: Record<string, string> = {
  bike: 'Cykling',
  run: 'Löpning',
  swim: 'Simning',
  strength: 'Styrka',
};

const subtypeLabels: Record<string, string> = {
  long_distance: 'Långdistans',
  vo2max: 'VO2max',
  upper: 'Överkropp',
  lower: 'Underkropp',
  long_swim: 'Långsim',
  technique_intervals: 'Teknik & Intervaller',
};

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtShortDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function Schedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(fmtDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const weekDates = getWeekDates(weekOffset);

  const loadSchedule = useCallback(async () => {
    if (!user) return;
    const start = fmtDate(weekDates[0]);
    const end = fmtDate(weekDates[6]);
    const { data } = await supabase
      .from('training_schedule')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date');
    if (data) setSchedule(data);
    setLoading(false);
  }, [user, weekOffset]);

  const seedSchedule = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    const { entries } = generateSchedule(new Date(), 4, { ...DEFAULT_ROTATOR });
    const rows = entries.map((e) => ({ ...e, user_id: user.id }));
    const { error } = await supabase.from('training_schedule').insert(rows);
    if (error) {
      toast.error('Kunde inte generera schema');
    } else {
      toast.success('4-veckors schema genererat! 🎉');
      await loadSchedule();
    }
    setGenerating(false);
  }, [user, loadSchedule]);

  const regenerateSchedule = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    // Delete future uncompleted entries
    const today = fmtDate(new Date());
    await supabase
      .from('training_schedule')
      .delete()
      .eq('user_id', user.id)
      .gte('date', today)
      .eq('completed', false);

    const { entries } = generateSchedule(new Date(), 4, { ...DEFAULT_ROTATOR });
    const rows = entries.map((e) => ({ ...e, user_id: user.id }));
    const { error } = await supabase.from('training_schedule').insert(rows);
    if (error) {
      toast.error('Kunde inte generera schema');
    } else {
      toast.success('Nytt 4-veckors schema genererat! 🎉');
      await loadSchedule();
    }
    setGenerating(false);
  }, [user, loadSchedule]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Auto-seed on first visit if no data
  useEffect(() => {
    if (!loading && schedule.length === 0 && weekOffset === 0 && user) {
      // Check if ANY schedule exists
      supabase
        .from('training_schedule')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          if (count === 0) seedSchedule();
        });
    }
  }, [loading, schedule.length, weekOffset, user]);

  const selectedWorkout = schedule.find((s) => s.date === selectedDate);
  const todayStr = fmtDate(new Date());

  const markCompleted = async () => {
    if (!selectedWorkout) return;
    const { error } = await supabase
      .from('training_schedule')
      .update({ completed: true })
      .eq('id', selectedWorkout.id);
    if (error) {
      toast.error('Kunde inte uppdatera');
    } else {
      toast.success('Pass genomfört! 💪');
      setSchedule((prev) =>
        prev.map((s) => (s.id === selectedWorkout.id ? { ...s, completed: true } : s))
      );
    }
  };

  const getConfig = (type: string) => typeConfig[type] || typeConfig.cardio;

  return (
    <div className="app-container pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Träningsschema</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={regenerateSchedule}
          disabled={generating}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
          Generera nytt
        </Button>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((p) => p - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {fmtShortDate(weekDates[0])} – {fmtShortDate(weekDates[6])}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((p) => p + 1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week strip */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2">
        {weekDates.map((date, i) => {
          const dateStr = fmtDate(date);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const workout = schedule.find((s) => s.date === dateStr);
          const config = workout ? getConfig(workout.planned_type) : null;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`touch-target flex flex-1 min-w-0 flex-col items-center gap-1 rounded-2xl border p-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : isToday
                  ? 'border-primary/50 bg-card'
                  : 'border-border bg-card'
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
              <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                {date.getDate()}
              </span>
              {workout && (
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${config?.bgClass || ''} ${
                    workout.completed ? 'opacity-60' : ''
                  }`}
                >
                  {workout.completed ? (
                    <Check className="h-3.5 w-3.5 text-rest" />
                  ) : (
                    <span className={config?.color || ''}>
                      {sportIcons[workout.planned_sport || ''] || <Coffee className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
              )}
              {workout && (
                <span className="max-w-full truncate text-[8px] text-muted-foreground">
                  {sportLabels[workout.planned_sport] || workout.planned_type}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <div className="card-athletic">
        {selectedWorkout ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                    getConfig(selectedWorkout.planned_type).bgClass
                  }`}
                >
                  <span className={getConfig(selectedWorkout.planned_type).color}>
                    {sportIcons[selectedWorkout.planned_sport || ''] || (
                      <Coffee className="h-6 w-6" />
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {sportLabels[selectedWorkout.planned_sport] || selectedWorkout.planned_type}{' '}
                    – {subtypeLabels[selectedWorkout.planned_subtype] || selectedWorkout.planned_subtype}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedWorkout.planned_type}
                  </p>
                </div>
              </div>
              {selectedWorkout.completed && (
                <span className="flex items-center gap-1 rounded-full bg-rest/20 px-3 py-1 text-xs font-medium text-rest">
                  <Check className="h-3 w-3" />
                  Genomfört
                </span>
              )}
            </div>

            {/* Workout details */}
            {selectedWorkout.planned_details && (
              <div className="space-y-2">
                {selectedWorkout.planned_type === 'strength' ? (
                  <div className="space-y-2">
                    {selectedWorkout.planned_details.split('\n').map((line: string, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border bg-background/50 p-3"
                      >
                        <p className="text-sm">{line}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <p className="text-sm leading-relaxed">{selectedWorkout.planned_details}</p>
                  </div>
                )}
              </div>
            )}

            {selectedWorkout.notes && (
              <div className="rounded-xl bg-background/50 p-3">
                <p className="text-xs uppercase text-muted-foreground">Anteckningar</p>
                <p className="mt-1 text-sm">{selectedWorkout.notes}</p>
              </div>
            )}

            {!selectedWorkout.completed && (
              <Button onClick={markCompleted} className="w-full touch-target">
                <Check className="mr-2 h-4 w-4" />
                Markera som genomfört
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <Coffee className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Inget pass planerat</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
