import { supabase } from '@/integrations/supabase/client';

export async function connectSahha(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('sahha-register');
  if (error) return { error: error.message };
  if ((data as any)?.error) return { error: (data as any).error as string };
  return { error: null };
}

export async function syncSahha(date?: string): Promise<{ error: string | null; imported?: number }> {
  const { data, error } = await supabase.functions.invoke('sahha-sync', {
    body: date ? { date } : {},
  });
  if (error) return { error: error.message };
  if ((data as any)?.error) return { error: (data as any).error as string };
  return { error: null, imported: (data as any)?.imported as number | undefined };
}

export async function disconnectSahha(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('users')
    .update({
      sahha_user_id: null,
      sahha_profile_token: null,
      sahha_connected_at: null,
    })
    .eq('id', userId);
  return { error: error?.message ?? null };
}
