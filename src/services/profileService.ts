import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toFiniteNumber } from './utils';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

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

export async function getProfile(
  userId: string,
): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return { data: data as UserProfile | null, error };
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
