#!/usr/bin/env sh
# Print a signed curl command for the Body Battery fixture. Copy-paste the curl lines to execute.
#
# Env (required): GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET, GARMIN_WEBHOOK_SIGNING_URL
# Optional: GARMIN_WEBHOOK_POST_URL (defaults to signing URL), GARMIN_OAUTH_TOKEN, GARMIN_TOKEN_SECRET
#
# Before testing: set users.garmin_user_id to match fixtures/garmin/body-battery-webhook.json "userId".

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

export GARMIN_WEBHOOK_SIGNING_URL="${GARMIN_WEBHOOK_SIGNING_URL:-http://127.0.0.1:54321/functions/v1/garmin-webhook}"
export GARMIN_WEBHOOK_POST_URL="${GARMIN_WEBHOOK_POST_URL:-$GARMIN_WEBHOOK_SIGNING_URL}"

node scripts/garmin-webhook-sign-and-curl.mjs fixtures/garmin/body-battery-webhook.json
