import { supabase } from '@/integrations/supabase/client';

/**
 * Returnerar ett giltigt tal eller null (aldrig NaN).
 */
export function toFiniteNumber(val: unknown): number | null {
  if (val === '' || val === undefined || val === null) return null;
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : null;
}

/**
 * Aktuellt auth-användar-id. Kastar om ingen session finns.
 */
export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error(error?.message ?? 'Not authenticated');
  }
  return data.user.id;
}
