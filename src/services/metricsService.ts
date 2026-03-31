import { supabase } from '@/integrations/supabase/client'
import { toFiniteNumber } from './utils'

export interface BodyMetric {
  id: string
  user_id: string
  recorded_at: string
  weight?: number | null
  body_fat_pct?: number | null
  resting_hr?: number | null
  notes?: string | null
}

export async function getMetrics(userId: string, limit = 30) {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }

  return {
    data: data.map(m => ({
      ...m,
      weight: toFiniteNumber(m.weight),
      body_fat_pct: toFiniteNumber(m.body_fat_pct),
      resting_hr: toFiniteNumber(m.resting_hr),
    })) as BodyMetric[],
    error: null,
  }
}

export async function insertMetric(userId: string, metric: Partial<BodyMetric>) {
  const { data, error } = await supabase
    .from('body_metrics')
    .insert({ ...metric, user_id: userId })
    .select()
    .single()

  return { data, error }
}
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
