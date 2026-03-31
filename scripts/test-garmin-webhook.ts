// Simple fixture-first test for the Garmin Body Battery webhook.
// Run with:
//   npx tsx scripts/test-garmin-webhook.ts
//
// In local Supabase, configure `GARMIN_WEBHOOK_TESTMODE_SECRET` to the same
// value as the env var you use when running this script so the signature matches.

const payload = {
  // Minimal body battery payload – Edge Function will handle parsing.
  // You can tweak this shape to mirror real Garmin Health payloads later.
  bodyBattery: [
    {
      startTimestampGMT: new Date().toISOString(),
      startTimestampLocal: new Date().toISOString(),
      bodyBatteryLevels: [
        { bodyBatteryLevel: 45, minutesOffset: 0 },
        { bodyBatteryLevel: 52, minutesOffset: 60 },
        { bodyBatteryLevel: 71, minutesOffset: 480 }, // latest = 71
      ],
    },
  ],
};

const url =
  process.env.GARMIN_WEBHOOK_LOCAL_URL ||
  'http://localhost:54321/functions/v1/garmin-webhook';

const testSecret = process.env.GARMIN_WEBHOOK_TESTMODE_SECRET || '';

async function main() {
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If a dev test secret is provided, sign the payload so it passes
  // the Edge Function's test-mode HMAC check.
  if (testSecret) {
    const cryptoMod = await import('node:crypto');
    const signature = cryptoMod
      .createHmac('sha256', testSecret)
      .update(body)
      .digest('hex');
    headers['x-garmin-test-signature'] = signature;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

