/**
 * Garmin Health API webhook: OAuth 1.0a (HMAC-SHA1) verification per RFC 5849 / Garmin Connect patterns.
 * Requires: GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL (exact callback URL Garmin signs).
 * Optional 3-legged: Authorization must include oauth_token matching public.users.garmin_access_token;
 * signing uses garmin_access_secret. If oauth_token is absent, verifies with consumer secret only (signing key ends with &).
 *
 * Dev-only test mode:
 *   - Set GARMIN_WEBHOOK_TESTMODE_SECRET
 *   - Send header `x-garmin-test-signature` = HMAC-SHA256(testSecret, rawBody) in hex
 *   - If Garmin OAuth verification fails, this test signature can be used (fail-closed).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-garmin-event-id',
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function parseOAuthAuthorization(authHeader: string | null): Record<string, string> | null {
  if (!authHeader || !/^OAuth\s+/i.test(authHeader)) return null;
  const raw = authHeader.replace(/^OAuth\s+/i, '').trim();
  const params: Record<string, string> = {};
  const re = /([a-zA-Z0-9_.-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const key = m[1];
    if (key.toLowerCase() === 'realm') continue;
    params[key] = m[2];
  }
  return Object.keys(params).length ? params : null;
}

function normalizeSigningUrl(url: string): string {
  try {
    const u = new URL(url);
    const scheme = u.protocol.replace(/:$/, '').toLowerCase();
    const host = u.hostname.toLowerCase();
    const path = u.pathname || '/';
    let port = u.port;
    if (!port) {
      if (scheme === 'https') port = '';
      else if (scheme === 'http') port = '';
    }
    const defaultPort = scheme === 'https' ? '443' : scheme === 'http' ? '80' : '';
    const omitPort = !port || port === defaultPort;
    const authority = omitPort ? host : `${host}:${port}`;
    return `${scheme}://${authority}${path}`;
  } catch {
    return url;
  }
}

async function hmacSha1Base64(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function verifyOAuth1aHmacSha1(opts: {
  method: string;
  signingUrl: string;
  oauthParams: Record<string, string>;
  consumerSecret: string;
  tokenSecret: string;
}): Promise<boolean> {
  const { method, signingUrl, oauthParams, consumerSecret, tokenSecret } = opts;
  const receivedSigEnc = oauthParams.oauth_signature;
  if (!receivedSigEnc) return false;

  let receivedSig: string;
  try {
    receivedSig = decodeURIComponent(receivedSigEnc.replace(/\+/g, '%2B'));
  } catch {
    return false;
  }

  const signParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(oauthParams)) {
    if (k === 'oauth_signature') continue;
    signParams[k] = v;
  }

  const sortedKeys = Object.keys(signParams).sort((a, b) =>
    a.localeCompare(b, 'en'),
  );
  const paramString = sortedKeys
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(signParams[k]!)}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    rfc3986Encode(normalizeSigningUrl(signingUrl)),
    rfc3986Encode(paramString),
  ].join('&');

  // Signing key: consumer secret and token secret are used as raw bytes (Garmin / common OAuth1 stacks).
  const signingKey = `${consumerSecret}&${tokenSecret}`;
  const computed = await hmacSha1Base64(signingKey, baseString);
  return timingSafeEqualString(computed, receivedSig);
}

async function sha256HexOfString(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  const bytes = new Uint8Array(sig);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeHexSignature(s: string): string {
  return s
    .trim()
    .replace(/^sha256:/i, '')
    .toLowerCase();
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function parseBodyBatteryPayload(payload: unknown): {
  garminUserId: string;
  calendarDate: string;
  bodyBattery: number;
  measuredAtIso: string | null;
  eventType: string;
} | null {
  const root = asRecord(payload);
  if (!root) return null;

  const eventType =
    typeof root.eventType === 'string' ? root.eventType : 'body_battery';

  const garminUserId = typeof root.userId === 'string' && root.userId.trim()
    ? root.userId.trim()
    : '';
  if (!garminUserId) return null;

  const calendarDate =
    (typeof root.calendarDate === 'string' && root.calendarDate) ||
    (typeof root.date === 'string' && root.date) ||
    '';
  if (!calendarDate || !/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) return null;

  let bodyBattery: number | null = null;
  let measuredAtIso: string | null = null;

  if (typeof root.bodyBattery === 'number' && Number.isFinite(root.bodyBattery)) {
    bodyBattery = Math.round(root.bodyBattery);
  }

  const startSec =
    typeof root.startTimeInSeconds === 'number' && Number.isFinite(root.startTimeInSeconds)
      ? root.startTimeInSeconds
      : null;

  const offsets = root.timeOffsetBodyBatteryValues;
  if (Array.isArray(offsets) && offsets.length > 0) {
    let bestOffset = -Infinity;
    let bestVal: number | null = null;
    for (const item of offsets) {
      const o = asRecord(item);
      if (!o) continue;
      const off =
        typeof o.offset === 'number'
          ? o.offset
          : typeof o.timeOffset === 'number'
            ? o.timeOffset
            : null;
      const val =
        typeof o.value === 'number'
          ? o.value
          : typeof o.bodyBattery === 'number'
            ? o.bodyBattery
            : null;
      if (off === null || val === null) continue;
      if (off >= bestOffset) {
        bestOffset = off;
        bestVal = Math.round(val);
      }
    }
    if (bestVal !== null) {
      bodyBattery = bestVal;
      if (startSec !== null) {
        measuredAtIso = new Date((startSec + bestOffset) * 1000).toISOString();
      }
    }
  }

  if (bodyBattery === null) return null;
  if (bodyBattery < 0 || bodyBattery > 100) return null;

  if (!measuredAtIso && startSec !== null) {
    measuredAtIso = new Date(startSec * 1000).toISOString();
  }

  return {
    garminUserId,
    calendarDate,
    bodyBattery,
    measuredAtIso,
    eventType,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return jsonResponse({ ok: true }, 200);
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET');
  const signingUrl = Deno.env.get('GARMIN_WEBHOOK_SIGNING_URL');
  const testSecret = Deno.env.get('GARMIN_WEBHOOK_TESTMODE_SECRET') || null;

  if (!supabaseUrl || !serviceKey) {
    console.error('[garmin-webhook] missing SUPABASE env');
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const rawBody = await req.text();

  const oauthParams = parseOAuthAuthorization(req.headers.get('Authorization'));
  const testSigHeader =
    req.headers.get('x-garmin-test-signature') ||
    req.headers.get('X-Garmin-Test-Signature');

  const hasOauthVerification =
    !!(consumerKey && consumerSecret && signingUrl);

  let verified = false;

  // Path 1: Garmin OAuth 1.0a (fail-closed).
  if (oauthParams && hasOauthVerification) {
    try {
      if (oauthParams.oauth_signature_method === 'HMAC-SHA1' &&
          oauthParams.oauth_consumer_key === consumerKey) {
        const ts = oauthParams.oauth_timestamp
          ? parseInt(oauthParams.oauth_timestamp, 10)
          : NaN;
        if (Number.isFinite(ts)) {
          const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
          if (skew <= 600) {
            const supabase = createClient(supabaseUrl, serviceKey);
            let tokenSecret = '';
            const oauthToken = oauthParams.oauth_token;

            if (oauthToken) {
              const { data: userRow, error: userErr } = await supabase
                .from('users')
                .select('garmin_access_secret')
                .eq('garmin_access_token', oauthToken)
                .maybeSingle();

              if (!userErr && userRow?.garmin_access_secret) {
                tokenSecret = userRow.garmin_access_secret;
              } else {
                tokenSecret = '';
                // invalid oauth token => keep verified=false
              }
            }

            const okSig = await verifyOAuth1aHmacSha1({
              method: 'POST',
              signingUrl,
              oauthParams,
              consumerSecret,
              tokenSecret,
            });
            verified = okSig;
          }
        }
      }
    } catch (e) {
      verified = false;
    }
  }

  // Path 2: Dev-only test signature (still fail-closed).
  if (!verified && testSecret && testSigHeader) {
    const expected = await hmacSha256Hex(testSecret, rawBody);
    verified = timingSafeEqualString(
      expected,
      normalizeHexSignature(testSigHeader),
    );
  }

  if (!verified) {
    return jsonResponse({ error: 'invalid_signature' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let parsedJson: unknown;
  try {
    parsedJson = rawBody.length ? JSON.parse(rawBody) : null;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const headerEventId =
    req.headers.get('x-garmin-event-id')?.trim() ||
    req.headers.get('X-Garmin-Event-Id')?.trim();
  const dedupeKey =
    headerEventId ||
    `sha256:${await sha256HexOfString(rawBody)}`;

  const root = asRecord(parsedJson);
  const eventType =
    (root && typeof root.eventType === 'string' && root.eventType) || 'body_battery';

  const { data: inserted, error: insertErr } = await supabase
    .from('garmin_webhook_events')
    .insert({
      event_type: eventType,
      payload_json: parsedJson as Record<string, unknown>,
      dedupe_key: dedupeKey,
    })
    .select('id')
    .maybeSingle();

  if (insertErr) {
    if (insertErr.code === '23505') {
      return jsonResponse({ ok: true, duplicate: true }, 200);
    }
    console.error('[garmin-webhook] inbox insert', insertErr);
    return jsonResponse({ error: 'inbox_insert_failed' }, 500);
  }

  if (!inserted?.id) {
    return jsonResponse({ error: 'inbox_insert_failed' }, 500);
  }

  const inboxId = inserted.id;

  const parsed = parseBodyBatteryPayload(parsedJson);
  if (!parsed) {
    await supabase
      .from('garmin_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        error: 'body_battery_parse_failed',
      })
      .eq('id', inboxId);
    return jsonResponse({ ok: true, processed: false, reason: 'parse_failed' }, 200);
  }

  const { data: appUser, error: lookupErr } = await supabase
    .from('users')
    .select('id')
    .eq('garmin_user_id', parsed.garminUserId)
    .maybeSingle();

  if (lookupErr || !appUser?.id) {
    await supabase
      .from('garmin_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        error: 'unknown_garmin_user_id',
      })
      .eq('id', inboxId);
    return jsonResponse({ ok: true, processed: false, reason: 'unknown_user' }, 200);
  }

  const { error: rpcErr } = await supabase.rpc('merge_body_battery_from_garmin', {
    p_user_id: appUser.id,
    p_date: parsed.calendarDate,
    p_body_battery: parsed.bodyBattery,
    p_garmin_measured_at: parsed.measuredAtIso,
  });

  if (rpcErr) {
    console.error('[garmin-webhook] merge rpc', rpcErr);
    await supabase
      .from('garmin_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        error: rpcErr.message || 'merge_failed',
      })
      .eq('id', inboxId);
    return jsonResponse({ ok: false, error: 'merge_failed' }, 500);
  }

  await supabase
    .from('garmin_webhook_events')
    .update({ processed_at: new Date().toISOString(), error: null })
    .eq('id', inboxId);

  return jsonResponse({ ok: true, processed: true }, 200);
});
