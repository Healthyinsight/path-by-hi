import { supabase } from '@/integrations/supabase/client';

/** Converts unknown values to a finite number or null */
export function toFiniteNumber(value: unknown): number | null {
  if (value === '' || value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Returns the currently authenticated user's ID, or null */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
