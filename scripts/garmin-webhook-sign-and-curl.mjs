#!/usr/bin/env node
/**
 * Builds OAuth 1.0a Authorization (HMAC-SHA1) for POST body identical to Garmin Health API patterns.
 * Env (required): GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL
 *   GARMIN_WEBHOOK_SIGNING_URL = exact URL Garmin signs (often same as POST target).
 * Optional 3-legged: GARMIN_OAUTH_TOKEN, GARMIN_TOKEN_SECRET (must match a row in public.users).
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

const fixturePath = process.argv[2] || 'fixtures/garmin/body-battery-webhook.json';
const rawBody = readFileSync(fixturePath, 'utf8');

const consumerKey = process.env.GARMIN_CONSUMER_KEY;
const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;
const signingUrl = process.env.GARMIN_WEBHOOK_SIGNING_URL;
const postUrl = process.env.GARMIN_WEBHOOK_POST_URL || signingUrl;
const oauthToken = process.env.GARMIN_OAUTH_TOKEN || '';
const tokenSecret = process.env.GARMIN_TOKEN_SECRET || '';

if (!consumerKey || !consumerSecret || !signingUrl || !postUrl) {
  console.error(
    'Missing env: GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL (and optional GARMIN_WEBHOOK_POST_URL)',
  );
  process.exit(1);
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

// Escape for POSIX sh: single-quote by replacing ' -> '\''
const esc = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

console.log(`# Signed POST (body must match ${fixturePath} exactly)`);
console.log(
  `curl -sS -X POST ${esc(postUrl)} \\`,
);
console.log(`  -H ${esc('Content-Type: application/json')} \\`);
console.log(`  -H ${esc('Authorization: ' + authorization)} \\`);
console.log(`  --data-binary ${esc(rawBody)}`);
