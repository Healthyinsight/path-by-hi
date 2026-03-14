import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Check, Bike, Dumbbell, Waves, Target, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { TrainingSchedule } from '@/types/database';

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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<TrainingSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const weekDates = getWeekDates();

  useEffect(() => {
    if (!user) return;
    const start = weekDates[0].toISOString().split('T')[0];
    const end = weekDates[6].toISOString().split('T')[0];
    supabase
      .from('training_schedule')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .then(({ data }) => {
        if (data) setSchedule(data);
      });
  }, [user]);

  const selectedWorkout = schedule.find((s) => s.date === selectedDate);

  const markCompleted = async () => {
    if (!selectedWorkout) return;
    const { error } = await supabase
      .from('training_schedule')
      .update({ completed: true })
      .eq('id', selectedWorkout.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Workout completed! 💪');
      setSchedule((prev) =>
        prev.map((s) => (s.id === selectedWorkout.id ? { ...s, completed: true } : s))
      );
    }
  };

  return (
    <div className="app-container pt-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Training Schedule</h1>

      {/* Week strip */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const workout = schedule.find((s) => s.date === dateStr);
          const config = workout ? typeConfig[workout.planned_type] : null;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`touch-target flex min-w-[52px] flex-col items-center gap-1 rounded-2xl border p-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
              <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                {date.getDate()}
              </span>
              {workout && (
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${config?.bgClass || ''}`}>
                  {workout.completed ? (
                    <Check className="h-3.5 w-3.5 text-rest" />
                  ) : workout.planned_type === 'rest' ? (
                    <Coffee className={`h-3.5 w-3.5 ${config?.color || ''}`} />
                  ) : (
                    <span className={config?.color || ''}>
                      {sportIcons[workout.planned_sport || ''] || <Target className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
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
              <div>
                <p className="text-lg font-bold capitalize">
                  {selectedWorkout.planned_sport || selectedWorkout.planned_type}
                </p>
                <p className="text-sm capitalize text-muted-foreground">
                  {selectedWorkout.planned_subtype?.replace(/_/g, ' ')}
                </p>
              </div>
              {selectedWorkout.completed && (
                <span className="rounded-full bg-rest/20 px-3 py-1 text-xs font-medium text-rest">
                  Completed
                </span>
              )}
            </div>

            {selectedWorkout.planned_details && (
              <p className="text-sm text-muted-foreground">{selectedWorkout.planned_details}</p>
            )}

            {selectedWorkout.notes && (
              <div className="rounded-xl bg-background/50 p-3">
                <p className="text-xs uppercase text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{selectedWorkout.notes}</p>
              </div>
            )}

            {!selectedWorkout.completed && (
              <Button onClick={markCompleted} className="w-full touch-target">
                <Check className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <Coffee className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No workout planned</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
