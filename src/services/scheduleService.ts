import { supabase } from '@/integrations/supabase/client'

export interface ScheduleEntry {
  id: string
  user_id: string
  date: string
  workout_type?: string | null
  planned_duration_minutes?: number | null
  notes?: string | null
  completed?: boolean | null
}

export async function getSchedule(userId: string, from?: string, to?: string) {
  let query = supabase
    .from('training_schedule')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  return { data, error }
}

export async function upsertScheduleEntry(userId: string, entry: Partial<ScheduleEntry>) {
  const { data, error } = await supabase
    .from('training_schedule')
    .upsert({ ...entry, user_id: userId })
    .select()
    .single()

  return { data, error }
}

export async function deleteScheduleEntry(entryId: string) {
  const { error } = await supabase
    .from('training_schedule')
    .delete()
    .eq('id', entryId)

  return { error }
}
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ScheduleRow = Database['public']['Tables']['training_schedule']['Row'];

/** Rad att skriva (utan user_id – sätts av service). */
export type ScheduleEntry = Omit<
  Database['public']['Tables']['training_schedule']['Insert'],
  'user_id'
>;

export type ScheduleUpdate = Database['public']['Tables']['training_schedule']['Update'];

export async function getScheduleForDate(
  userId: string,
  date: string,
): Promise<{ data: ScheduleRow | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('training_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  return { data, error };
}

export async function updateScheduleRow(
  id: string,
  patch: ScheduleUpdate,
): Promise<{ data: ScheduleRow | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('training_schedule')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  return { data, error };
}

export async function getSchedule(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ data: ScheduleRow[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('training_schedule')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  return { data, error };
}

/**
 * Infogar schemarader för användaren. (Inget unikt (user_id,date) i schema – riktig upsert kräver ev. delete + insert.)
 */
export async function upsertSchedule(
  userId: string,
  entries: ScheduleEntry[],
): Promise<{ data: ScheduleRow[] | null; error: PostgrestError | null }> {
  if (entries.length === 0) {
    return { data: [], error: null };
  }
  const rows = entries.map((e) => ({ ...e, user_id: userId }));
  const { data, error } = await supabase.from('training_schedule').insert(rows).select('*');
  return { data, error };
}

export async function deleteSchedule(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ data: ScheduleRow[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('training_schedule')
    .delete()
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .select('*');
  return { data, error };
}
