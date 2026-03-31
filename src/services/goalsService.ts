import { supabase } from '@/integrations/supabase/client'
import { toFiniteNumber } from './utils'

export interface UserGoal {
  id: string
  user_id: string
  goal_type?: string | null
  target_value?: number | null
  target_date?: string | null
  created_at?: string | null
}

export async function getGoals(userId: string) {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }

  return {
    data: data.map(g => ({
      ...g,
      target_value: toFiniteNumber(g.target_value),
    })) as UserGoal[],
    error: null,
  }
}

export async function upsertGoal(userId: string, goal: Partial<UserGoal>) {
  const { data, error } = await supabase
    .from('user_goals')
    .upsert({ ...goal, user_id: userId })
    .select()
    .single()

  return { data, error }
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase
    .from('user_goals')
    .delete()
    .eq('id', goalId)

  return { error }
}
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type UserGoals = Database['public']['Tables']['user_goals']['Row'];

/** `profileGoalDate` används bara som fallback (samma som user_profiles.goal_date), skrivs inte till tabellen. */
export type UpsertGoalsInput = Partial<UserGoals> & { profileGoalDate?: string | null };

function defaultGoalDate(): string {
  return new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
}

function resolveGoalDate(
  fromData: string | undefined | null,
  profileGoalDate?: string | null,
): string {
  const a = typeof fromData === 'string' ? fromData.trim() : '';
  if (a !== '') return a;
  const b = typeof profileGoalDate === 'string' ? profileGoalDate.trim() : '';
  if (b !== '') return b;
  return defaultGoalDate();
}

export async function getGoals(
  userId: string,
): Promise<{ data: UserGoals | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return { data, error };
}

export async function upsertGoals(
  userId: string,
  data: UpsertGoalsInput,
): Promise<{ data: UserGoals | null; error: PostgrestError | null }> {
  const { profileGoalDate, ...rowFields } = data;
  const goal_date = resolveGoalDate(rowFields.goal_date, profileGoalDate);
  const goal_name =
    typeof rowFields.goal_name === 'string' && rowFields.goal_name.trim() !== ''
      ? rowFields.goal_name.trim()
      : 'Mitt mål';
  const goal_emoji =
    typeof rowFields.goal_emoji === 'string' && rowFields.goal_emoji.trim() !== ''
      ? rowFields.goal_emoji.trim()
      : '🏁';

  const payload = {
    user_id: userId,
    goal_name,
    goal_date,
    goal_emoji,
    ...(rowFields.disciplines !== undefined ? { disciplines: rowFields.disciplines } : {}),
  };

  const { data: row, error } = await supabase
    .from('user_goals')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  return { data: row, error };
}
