import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type DailyMetricsRow = Database['public']['Tables']['daily_metrics']['Row'];

export interface DailyMetricsInput {
  hrv_rmssd?: number | null;
  rhr?: number | null;
  sleep_hours?: number | null;
  sleep_quality_score?: number | null;
  body_battery?: number | null;
  steps?: number | null;
}

export async function addDailyMetric(
  userId: string,
  date: string,
  metrics: DailyMetricsInput,
  source: 'manual' | 'garmin' | 'sahha' | 'derived' = 'manual',
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('daily_metrics')
    .upsert(
      { user_id: userId, date, source, ...metrics },
      { onConflict: 'user_id,date,source' },
    );
  return { error };
}

export async function getResolvedMetrics(
  userId: string,
  date: string,
): Promise<{ data: DailyMetricsRow | null; error: PostgrestError | null }> {
  const { data, error } = await (supabase as any)
    .from('daily_metrics_resolved')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  return { data: data as DailyMetricsRow | null, error };
}
