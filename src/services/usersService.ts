import { supabase } from '@/integrations/supabase/client'
import { toFiniteNumber } from './utils'

export interface User {
  id: string
  email: string
  name?: string | null
  current_weight?: number | null
  height_cm?: number | null
  body_fat_pct?: number | null
  training_phase?: string | null
  garmin_user_id?: string | null
}

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error }

  return {
    data: {
      ...data,
      current_weight: toFiniteNumber(data.current_weight),
      height_cm: toFiniteNumber(data.height_cm),
      body_fat_pct: toFiniteNumber(data.body_fat_pct),
    } as User,
    error: null,
  }
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}
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
