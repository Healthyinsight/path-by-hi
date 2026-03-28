#!/usr/bin/env node
/**
 * Builds a signed POST request for `supabase/functions/garmin-webhook`.
 *
 * Mode A (OAuth 1.0a HMAC-SHA1):
 *   Env required: GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL
 *   Optional 3-legged: GARMIN_OAUTH_TOKEN, GARMIN_TOKEN_SECRET (must match a row in public.users).
 *
 * Mode B (dev-only test auth, no Garmin keys):
 *   Env: GARMIN_WEBHOOK_TESTMODE_SECRET
 *   Header: `x-garmin-test-signature` = HMAC-SHA256(secret, rawBody) in hex.
 *
 * Usage:
 *   node scripts/garmin-webhook-sign-and-curl.mjs fixtures/garmin/body-battery-webhook.json
 *
 * Prints a curl command; pipe to shell or copy-paste. Uses --data-binary so bytes match the signed body.
 */
import { readFileSync } from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';

function rfc3986Encode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function normalizeSigningUrl(url) {
  const u = new URL(url);
  const scheme = u.protocol.replace(/:$/, '').toLowerCase();
  const host = u.hostname.toLowerCase();
  const path = u.pathname || '/';
  let port = u.port;
  const defaultPort = scheme === 'https' ? '443' : scheme === 'http' ? '80' : '';
  const omitPort = !port || port === defaultPort;
  const authority = omitPort ? host : `${host}:${port}`;
  return `${scheme}://${authority}${path}`;
}

// Escape for POSIX sh: single-quote by replacing ' -> '\''
const esc = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

const fixturePath = process.argv[2] || 'fixtures/garmin/body-battery-webhook.json';
const rawBody = readFileSync(fixturePath, 'utf8');

const consumerKey = process.env.GARMIN_CONSUMER_KEY;
const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;
const signingUrl = process.env.GARMIN_WEBHOOK_SIGNING_URL;
const postUrl =
  process.env.GARMIN_WEBHOOK_POST_URL ||
  signingUrl ||
  'http://127.0.0.1:54321/functions/v1/garmin-webhook';
const oauthToken = process.env.GARMIN_OAUTH_TOKEN || '';
const tokenSecret = process.env.GARMIN_TOKEN_SECRET || '';
const testSecret = process.env.GARMIN_WEBHOOK_TESTMODE_SECRET || '';

const oauthMode = !!(consumerKey && consumerSecret && signingUrl);
const testMode = !!testSecret && !oauthMode;

if (!oauthMode && !testMode) {
  console.error(
    'Missing request signing env. Provide either OAuth vars (GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL) or dev test var (GARMIN_WEBHOOK_TESTMODE_SECRET).',
  );
  process.exit(1);
}

// TESTMODE early exit (no Garmin OAuth header).
if (testMode) {
  const signature = createHmac('sha256', testSecret).update(rawBody).digest('hex');
  console.log(`# Signed POST in TESTMODE (header x-garmin-test-signature) for ${fixturePath}`);
  console.log(`curl -sS -X POST ${esc(postUrl)} \\`);
  console.log(`  -H ${esc('Content-Type: application/json')} \\`);
  console.log(`  -H ${esc('x-garmin-test-signature: ' + signature)} \\`);
  console.log(`  --data-binary ${esc(rawBody)}`);
  process.exit(0);
}

const nonce = randomBytes(16).toString('hex');
const timestamp = String(Math.floor(Date.now() / 1000));

/** @type {Record<string, string>} */
const oauthParams = {
  oauth_consumer_key: consumerKey,
  oauth_nonce: nonce,
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: timestamp,
  oauth_version: '1.0',
};
if (oauthToken) oauthParams.oauth_token = oauthToken;

const sortedKeys = Object.keys(oauthParams).sort((a, b) => a.localeCompare(b, 'en'));
const paramString = sortedKeys
  .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(oauthParams[k])}`)
  .join('&');

const baseString = [
  'POST',
  rfc3986Encode(normalizeSigningUrl(signingUrl)),
  rfc3986Encode(paramString),
].join('&');

const signingKey = `${consumerSecret}&${tokenSecret}`;
const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

const headerParts = [
  `oauth_consumer_key="${consumerKey}"`,
  `oauth_nonce="${nonce}"`,
  `oauth_signature_method="HMAC-SHA1"`,
  `oauth_timestamp="${timestamp}"`,
  `oauth_version="1.0"`,
  `oauth_signature="${encodeURIComponent(signature)}"`,
];
if (oauthToken) {
  headerParts.splice(4, 0, `oauth_token="${oauthToken}"`);
}

const authorization = `OAuth ${headerParts.join(', ')}`;

console.log(`# Signed POST (body must match ${fixturePath} exactly)`);
console.log(
  `curl -sS -X POST ${esc(postUrl)} \\`,
);
console.log(`  -H ${esc('Content-Type: application/json')} \\`);
console.log(`  -H ${esc('Authorization: ' + authorization)} \\`);
console.log(`  --data-binary ${esc(rawBody)}`);
