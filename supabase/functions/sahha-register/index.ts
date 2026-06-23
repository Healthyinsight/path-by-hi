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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const SAHHA_CLIENT_ID = Deno.env.get('SAHHA_CLIENT_ID');
  const SAHHA_CLIENT_SECRET = Deno.env.get('SAHHA_CLIENT_SECRET');
  const SAHHA_BASE_URL = Deno.env.get('SAHHA_BASE_URL') ?? 'https://sandbox.sahha.ai';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SAHHA_CLIENT_ID || !SAHHA_CLIENT_SECRET) {
    return json({ error: 'Missing required environment variables' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const jwt = authHeader.replace('Bearer ', '');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  // 1. Get Sahha app token using client credentials
  const tokenRes = await fetch(`${SAHHA_BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: SAHHA_CLIENT_ID, clientSecret: SAHHA_CLIENT_SECRET }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return json({ error: `Sahha auth failed: ${err}` }, 502);
  }
  const { accessToken: appToken } = await tokenRes.json() as { accessToken: string };

  // 2. Create/get profile token for this user (externalId = Supabase user id)
  const profileRes = await fetch(`${SAHHA_BASE_URL}/api/v1/oauth/profile/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appToken}`,
    },
    body: JSON.stringify({ externalId: user.id }),
  });
  if (!profileRes.ok) {
    const err = await profileRes.text();
    return json({ error: `Sahha profile registration failed: ${err}` }, 502);
  }
  const { profileToken } = await profileRes.json() as { profileToken: string };

  // 3. Store profile token in DB
  const { error: dbError } = await supabase
    .from('users')
    .update({
      sahha_user_id: user.id,
      sahha_profile_token: profileToken,
      sahha_connected_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (dbError) return json({ error: dbError.message }, 500);

  return json({ ok: true });
});
