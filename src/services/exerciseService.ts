import { supabase } from '@/integrations/supabase/client';

export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group', { ascending: true });
  return { data, error };
}

export async function getExercisesByMuscleGroup(muscleGroup: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('muscle_group', muscleGroup)
    .eq('is_disc_safe', true);
  return { data, error };
}

