import { supabase } from '@/integrations/supabase/client';
import { updateUser } from '@/services/usersService';

const STRAVA_STATE_KEY = 'strava_oauth_state';

export function getStravaAuthUrl(): string {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID as string;
  if (!clientId) throw new Error('VITE_STRAVA_CLIENT_ID is not set');

  const nonce = crypto.randomUUID();
  sessionStorage.setItem(STRAVA_STATE_KEY, nonce);

  const redirectUri = `${window.location.origin}/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: nonce,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export function validateStravaState(state: string | null): boolean {
  const stored = sessionStorage.getItem(STRAVA_STATE_KEY);
  sessionStorage.removeItem(STRAVA_STATE_KEY);
  return !!stored && stored === state;
}

export async function connectStrava(
  code: string,
): Promise<{ ok: boolean; imported: number }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const redirectUri = `${window.location.origin}/strava/callback`;

  const { data, error } = await supabase.functions.invoke('strava-token-exchange', {
    body: { code, redirect_uri: redirectUri },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? 'strava_token_exchange_failed');

  return { ok: true, imported: data.imported ?? 0 };
}

export async function disconnectStrava(userId: string): Promise<void> {
  const { error } = await updateUser(userId, {
    strava_athlete_id: null,
    strava_access_token: null,
    strava_refresh_token: null,
    strava_token_expires_at: null,
  });
  if (error) throw error;
}
