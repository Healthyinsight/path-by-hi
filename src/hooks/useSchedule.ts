import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getScheduleForDate,
  upsertSchedule,
  updateScheduleRow,
  type ScheduleEntry as DbScheduleEntry,
  type ScheduleRow,
} from '@/services/scheduleService';
import { generateProfileWeeklySchedule } from '@/lib/scheduleEngine';

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

export type RegenerateProfileInput = {
  archetype: string;
  disciplines: string[];
  goal_date: string | null;
};

export function useSchedule() {
  const { user } = useAuth();
  const today = useMemo(() => fmtDate(new Date()), []);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setSchedule([]);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: e } = await getScheduleForDate(user.id, today);
    setSchedule(data ? [data] : []);
    setError(e);
    setLoading(false);
  }, [user?.id, today]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const regenerate = useCallback(
    async (profileInput: RegenerateProfileInput): Promise<boolean> => {
      if (!user?.id) {
        toast.error('Inte inloggad.');
        return false;
      }

      const base = new Date();
      const weeks = 4;
      const allEntries: DbScheduleEntry[] = [];
      for (let i = 0; i < weeks; i++) {
        const start = new Date(base);
        start.setDate(base.getDate() + i * 7);
        const rows = generateProfileWeeklySchedule(
          {
            archetype: profileInput.archetype,
            disciplines: profileInput.disciplines,
            goal_date: profileInput.goal_date,
          },
          start,
        );
        for (const e of rows) {
          const planned_type =
            e.planned_type === 'endurance_mix' ? 'cardio' : e.planned_type;
          allEntries.push({
            date: e.date,
            planned_type,
            planned_subtype: e.planned_subtype,
            planned_sport: e.planned_sport,
            planned_details: e.planned_details,
          } as DbScheduleEntry);
        }
      }

      const { error: insErr } = await upsertSchedule(user.id, allEntries);
      if (insErr) {
        toast.error('Kunde inte generera schema');
        return false;
      }
      toast.success('4-veckors schema genererat! 🎉');
      await refetch();
      return true;
    },
    [user?.id, refetch],
  );

  const markWorkoutCompleted = useCallback(
    async (workoutId: string): Promise<boolean> => {
      const { error: e } = await updateScheduleRow(workoutId, { completed: true });
      if (e) {
        toast.error('Kunde inte uppdatera');
        return false;
      }
      await refetch();
      return true;
    },
    [refetch],
  );

  return {
    schedule,
    loading,
    error,
    regenerate,
    refetch,
    /** Markera pass som klart (toast vid fel sker i hooken). */
    markWorkoutCompleted,
    today,
  };
}
