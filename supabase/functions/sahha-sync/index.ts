import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const stateToScore: Record<string, number> = { poor: 1, fair: 2, good: 3, great: 4 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const SAHHA_BASE_URL = Deno.env.get('SAHHA_BASE_URL') ?? 'https://sandbox.sahha.ai';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Missing required environment variables' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const jwt = authHeader.replace('Bearer ', '');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('sahha_profile_token')
    .eq('id', user.id)
    .single();

  if (userError || !dbUser?.sahha_profile_token) {
    return json({ error: 'Sahha not connected. Register first.' }, 400);
  }

  // Parse requested date from body, default to today
  const body = await req.json().catch(() => ({})) as { date?: string };
  const targetDate = body.date ?? new Date().toISOString().split('T')[0];

  const scoreUrl = new URL(`${SAHHA_BASE_URL}/api/v1/profile/score`);
  scoreUrl.searchParams.set('startDateTime', `${targetDate}T00:00:00Z`);
  scoreUrl.searchParams.set('endDateTime', `${targetDate}T23:59:59Z`);
  ['sleep', 'activity', 'readiness'].forEach((t) => scoreUrl.searchParams.append('types[]', t));

  const scoresRes = await fetch(scoreUrl.toString(), {
    headers: { 'Authorization': `Bearer ${dbUser.sahha_profile_token}` },
  });

  if (!scoresRes.ok) {
    const err = await scoresRes.text();
    return json({ error: `Sahha scores fetch failed: ${err}` }, 502);
  }

  const raw = await scoresRes.json();
  // Handle both array response and { categories: [...] } envelope
  const categories: Array<{ type: string; value: number; state: string }> =
    Array.isArray(raw) ? raw : (raw?.categories ?? raw?.data ?? []);

  if (categories.length === 0) return json({ ok: true, imported: 0, skipped: 1 });

  const byType = Object.fromEntries(categories.map((c) => [c.type, c]));
  const sleep = byType['sleep'];
  const readiness = byType['readiness'];
  const activity = byType['activity'];

  const metric: Record<string, unknown> = {
    user_id: user.id,
    date: targetDate,
    source: 'sahha',
    raw_payload: raw,
  };

  if (sleep) metric.sleep_quality_score = stateToScore[sleep.state] ?? null;
  if (readiness) {
    metric.body_battery = Math.round(readiness.value * 100);
  } else if (activity) {
    metric.body_battery = Math.round(activity.value * 100);
  }

  const { error: upsertError } = await supabase
    .from('daily_metrics')
    .upsert(metric, { onConflict: 'user_id,date,source' });

  if (upsertError) return json({ error: upsertError.message }, 500);

  return json({ ok: true, imported: 1, skipped: 0 });
});
