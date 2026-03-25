import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toFiniteNumber } from '@/services/utils';

export type BodyMetrics = Database['public']['Tables']['body_metrics']['Row'];

export type BodyMetricsInsert = Database['public']['Tables']['body_metrics']['Insert'];

const NUMERIC_METRIC_KEYS = [
  'weight',
  'body_fat_pct',
  'resting_hr',
  'hrv_rmssd',
  'vo2max_run',
  'vo2max_bike',
  'sleep_hours',
  'sleep_quality_score',
  'body_battery',
  'stress_level',
] as const;

function sanitizeMetricsPayload(
  data: Partial<BodyMetricsInsert>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of NUMERIC_METRIC_KEYS) {
    if (key in out && out[key] !== undefined) {
      out[key] = toFiniteNumber(out[key]);
    }
  }
  return out;
}

export async function getLatestMetrics(
  userId: string,
): Promise<{ data: BodyMetrics | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('garmin_measured_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function addMetrics(
  userId: string,
  data: Partial<Omit<BodyMetricsInsert, 'user_id'>> & Pick<BodyMetricsInsert, 'date'>,
): Promise<{ data: BodyMetrics | null; error: PostgrestError | null }> {
  const payload = {
    ...sanitizeMetricsPayload(data),
    user_id: userId,
  } as BodyMetricsInsert;

  const { data: row, error } = await supabase
    .from('body_metrics')
    .insert(payload)
    .select('*')
    .maybeSingle();
  return { data: row, error };
}

export async function getMetricsHistory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ data: BodyMetrics[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  return { data, error };
}
