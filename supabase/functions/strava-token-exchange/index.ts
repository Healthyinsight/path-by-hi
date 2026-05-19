/**
 * Strava OAuth token exchange + 30-day activity backfill.
 * Requires Supabase secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
 * Auth: caller must pass Authorization: Bearer <supabase_jwt>
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ActivityType = 'run' | 'bike' | 'swim' | 'strength';

const SPORT_TYPE_MAP: Record<string, ActivityType> = {
  Run: 'run',
  TrailRun: 'run',
  VirtualRun: 'run',
  Ride: 'bike',
  VirtualRide: 'bike',
  GravelRide: 'bike',
  MountainBikeRide: 'bike',
  EBikeRide: 'bike',
  Swim: 'swim',
  WeightTraining: 'strength',
  Workout: 'strength',
  Crossfit: 'strength',
};

function mapSportType(sportType: string): ActivityType | null {
  return SPORT_TYPE_MAP[sportType] ?? null;
}

interface StravaActivity {
  id: number;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  average_speed?: number;
  average_watts?: number;
}

function paceFromSpeed(speedMs: number, type: ActivityType): string | null {
  if (!speedMs || speedMs <= 0) return null;
  if (type === 'run') {
    const secPerKm = 1000 / speedMs;
    const min = Math.floor(secPerKm / 60);
    const sec = Math.round(secPerKm % 60);
    return `${min}:${String(sec).padStart(2, '0')}/km`;
  }
  if (type === 'bike') {
    const kmh = (speedMs * 3.6).toFixed(1);
    return `${kmh} km/h`;
  }
  if (type === 'swim') {
    const secPer100m = 100 / speedMs;
    const min = Math.floor(secPer100m / 60);
    const sec = Math.round(secPer100m % 60);
    return `${min}:${String(sec).padStart(2, '0')}/100m`;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stravaClientId = Deno.env.get('STRAVA_CLIENT_ID');
  const stravaClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

  if (!supabaseUrl || !serviceKey || !stravaClientId || !stravaClientSecret) {
    console.error('[strava-token-exchange] missing env vars');
    return json({ error: 'server_misconfigured' }, 500);
  }

  // Verify caller JWT
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return json({ error: 'missing_auth' }, 401);

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user?.id) return json({ error: 'invalid_token' }, 401);
  const userId = user.id;

  let body: { code?: string; redirect_uri?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { code, redirect_uri: redirectUri } = body;
  if (!code || !redirectUri) return json({ error: 'missing_code_or_redirect_uri' }, 400);

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error('[strava-token-exchange] token exchange failed', tokenRes.status, errBody);
    return json({ error: 'token_exchange_failed', detail: errBody }, 502);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: { id: number };
  };

  const { access_token, refresh_token, expires_at, athlete } = tokenData;
  if (!access_token || !refresh_token || !athlete?.id) {
    return json({ error: 'unexpected_token_response' }, 502);
  }

  // Save tokens to users table
  const { error: updateErr } = await supabase
    .from('users')
    .update({
      strava_athlete_id: String(athlete.id),
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
    })
    .eq('id', userId);

  if (updateErr) {
    console.error('[strava-token-exchange] save tokens failed', updateErr);
    return json({ error: 'save_tokens_failed' }, 500);
  }

  // Backfill last 30 days of activities
  const after30d = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const activitiesToInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (let page = 1; page <= 3; page++) {
    const url = `https://www.strava.com/api/v3/athlete/activities?after=${after30d}&per_page=100&page=${page}`;
    const actRes = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!actRes.ok) {
      console.warn('[strava-token-exchange] activities fetch failed', actRes.status);
      break;
    }

    const activities = await actRes.json() as StravaActivity[];

    for (const act of activities) {
      const type = mapSportType(act.sport_type);
      if (!type) {
        skipped++;
        console.log('[strava-token-exchange] skipping sport_type', act.sport_type);
        continue;
      }

      activitiesToInsert.push({
        user_id: userId,
        strava_activity_id: String(act.id),
        type,
        start_time: act.start_date,
        duration_seconds: act.elapsed_time ?? null,
        distance_meters: act.distance > 0 ? act.distance : null,
        avg_hr: act.average_heartrate ? Math.round(act.average_heartrate) : null,
        max_hr: act.max_heartrate ? Math.round(act.max_heartrate) : null,
        calories: act.calories ?? null,
        avg_pace: act.average_speed ? paceFromSpeed(act.average_speed, type) : null,
        avg_power: act.average_watts ? Math.round(act.average_watts) : null,
        source: 'strava',
      });
    }

    if (activities.length < 100) break;
  }

  let imported = 0;
  if (activitiesToInsert.length > 0) {
    const { error: upsertErr, count } = await supabase
      .from('activities')
      .upsert(activitiesToInsert, {
        onConflict: 'user_id,strava_activity_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (upsertErr) {
      console.error('[strava-token-exchange] upsert activities failed', upsertErr);
    } else {
      imported = count ?? activitiesToInsert.length;
    }
  }

  console.log(`[strava-token-exchange] user=${userId} imported=${imported} skipped=${skipped}`);
  return json({ ok: true, imported, skipped });
});
