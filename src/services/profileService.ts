import { supabase } from '@/integrations/supabase/client'
import { toFiniteNumber } from './utils'

export interface UserProfile {
  id: string
  user_id: string
  name?: string | null
  trail_name?: string | null
  height_cm?: number | null
  weight?: number | null
  body_fat_pct?: number | null
  training_phase?: string | null
  goal?: string | null
  updated_at?: string | null
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error }

  return {
    data: {
      ...data,
      height_cm: toFiniteNumber(data.height_cm),
      weight: toFiniteNumber(data.weight),
      body_fat_pct: toFiniteNumber(data.body_fat_pct),
    } as UserProfile,
    error: null,
  }
}

export async function upsertProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...updates, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single()

  return { data, error }
}
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toFiniteNumber } from '@/services/utils';

type ProfileRow = Database['public']['Tables']['user_profiles']['Row'];

/** user_profiles-rad; `height_cm` finns i DB (migration) men kan saknas i äldre codegen. */
export type UserProfile = ProfileRow & { height_cm?: number | null };

export type UserProfileUpsert = Partial<Omit<UserProfile, 'id'>>;

const NUMERIC_KEYS = ['weight', 'height_cm', 'body_fat_pct', 'target_weight'] as const;

function sanitizeProfilePayload(data: UserProfileUpsert): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of NUMERIC_KEYS) {
    if (key in out && out[key] !== undefined) {
      out[key] = toFiniteNumber(out[key]);
    }
  }
  return out;
}

export async function upsertProfile(
  userId: string,
  data: UserProfileUpsert,
): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
  const payload = {
    ...sanitizeProfilePayload(data),
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  const { data: row, error } = await (supabase as any)
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();
  return { data: row as UserProfile | null, error };
}
