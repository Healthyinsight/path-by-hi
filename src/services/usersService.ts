import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toFiniteNumber } from '@/services/utils';

export type User = Database['public']['Tables']['users']['Row'];

export type UserUpdate = Partial<Database['public']['Tables']['users']['Update']>;

const NUMERIC_KEYS: (keyof UserUpdate)[] = [
  'current_weight',
  'height_cm',
  'body_fat_pct',
  'ftp_watts',
  'vo2max_estimate',
];

function sanitizeUserPayload(data: UserUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of NUMERIC_KEYS) {
    if (key in out && out[key] !== undefined) {
      out[key] = toFiniteNumber(out[key]);
    }
  }
  return out;
}

export async function getUser(
  userId: string,
): Promise<{ data: User | null; error: PostgrestError | null }> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  return { data, error };
}

export async function updateUser(
  userId: string,
  data: UserUpdate,
): Promise<{ data: User | null; error: PostgrestError | null }> {
  const { data: row, error } = await supabase
    .from('users')
    .update(sanitizeUserPayload(data) as UserUpdate)
    .eq('id', userId)
    .select('*')
    .maybeSingle();
  return { data: row, error };
}
