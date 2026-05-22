import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { calcPersonalNutritionTargets } from '@/lib/nutritionEngine';
import { getProfile } from './profileService';
import { getScheduleForDate } from './scheduleService';

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

/**
 * Generates and upserts today's nutrition targets using Mifflin-St Jeor TDEE.
 * Falls back to 75 kg / 175 cm when body metrics are not yet recorded.
 * Idempotent: safe to call multiple times for the same date.
 */
export async function generateForToday(userId: string): Promise<{ error: PostgrestError | null }> {
  const dateStr = new Date().toISOString().split('T')[0]!;

  const [{ data: profile }, { data: schedule }] = await Promise.all([
    getProfile(userId),
    getScheduleForDate(userId, dateStr),
  ]);

  const targets = calcPersonalNutritionTargets({
    weight: profile?.weight ?? 75,
    height_cm: (profile as any)?.height_cm ?? 175,
    plannedType: schedule?.planned_type,
    plannedSubtype: schedule?.planned_subtype,
  });

  const { error } = await supabase
    .from('nutrition_plan')
    .upsert(
      {
        user_id: userId,
        date: dateStr,
        training_type:   schedule?.planned_type    ?? 'rest',
        planned_subtype: schedule?.planned_subtype ?? null,
        planned_sport:   schedule?.planned_sport   ?? null,
        target_kcal:     targets.target_kcal,
        target_protein:  targets.target_protein,
        target_carbs:    targets.target_carbs,
        target_fat:      targets.target_fat,
      },
      { onConflict: 'user_id,date' },
    );

  return { error };
}
