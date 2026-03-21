import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGoals,
  upsertGoals as upsertGoalsService,
  type UpsertGoalsInput,
  type UserGoals,
} from '@/services/goalsService';

export type { UserGoals, UpsertGoalsInput };

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setGoals(null);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: e } = await getGoals(user.id);
    setGoals(data);
    setError(e);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const upsertGoalsFn = async (
    data: UpsertGoalsInput,
    opts?: { quiet?: boolean },
  ): Promise<{ data: UserGoals | null; error: PostgrestError | null }> => {
    if (!user?.id) {
      toast.error('Inte inloggad.');
      return { data: null, error: null };
    }
    const { data: row, error: e } = await upsertGoalsService(user.id, data);
    if (e) {
      if (!opts?.quiet) toast.error('Kunde inte spara mål.');
      return { data: null, error: e };
    }
    setGoals(row);
    if (!opts?.quiet) toast.success('Mål sparade!');
    return { data: row, error: null };
  };

  return { goals, loading, error, upsertGoals: upsertGoalsFn, refetch };
}
