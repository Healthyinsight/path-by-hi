import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type NutritionPlanRow = Database['public']['Tables']['nutrition_plan']['Row'];

export async function getNutritionPlan(
  userId: string,
  date: string,
): Promise<{ data: NutritionPlanRow | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('nutrition_plan')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  return { data, error };
}
