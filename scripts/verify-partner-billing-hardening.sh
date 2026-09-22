#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://api-dev.life-scale.com/api/partner}"
API_KEY="${PARTNER_API_KEY:-}"
JWT="${PARTNER_JWT:-}"

require_env() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Missing required env: $name"
    exit 1
  fi
}

require_env "PARTNER_API_KEY" "$API_KEY"
require_env "PARTNER_JWT" "$JWT"
require_env "SUBSCRIPTION_ID" "${SUBSCRIPTION_ID:-}"
require_env "ORDER_ID" "${ORDER_ID:-}"

auth_headers=(
  -H "x-api-key: ${API_KEY}"
  -H "Authorization: Bearer ${JWT}"
  -H "Content-Type: application/json"
)

call_endpoint() {
  local method="$1"
  local endpoint="$2"
  local payload="${3:-}"
  if [[ -n "$payload" ]]; then
    curl -sS -X "${method}" "${BASE_URL}/${endpoint}" "${auth_headers[@]}" -d "${payload}"
  else
    curl -sS -X "${method}" "${BASE_URL}/${endpoint}" "${auth_headers[@]}"
  fi
}

echo "1) Send MFA OTP"
send_out="$(call_endpoint POST "send-mfa" '{}')"
echo "${send_out}"

read -r -p "Enter OTP from email: " OTP
if [[ -z "${OTP}" ]]; then
  echo "OTP is required"
  exit 1
fi

echo "2) Verify MFA OTP"
verify_out="$(call_endpoint POST "verify-mfa" "{\"otp\":\"${OTP}\"}")"
echo "${verify_out}"

echo "3) Race test (same OTP twice on user-assets — expect both 200 within post-verify window)"
tmp1="$(mktemp)"
tmp2="$(mktemp)"

curl -sS -X POST "${BASE_URL}/user-assets" "${auth_headers[@]}" -d "{\"otp\":\"${OTP}\"}" > "${tmp1}" &
pid1=$!
curl -sS -X POST "${BASE_URL}/user-assets" "${auth_headers[@]}" -d "{\"otp\":\"${OTP}\"}" > "${tmp2}" &
pid2=$!
wait "${pid1}" || true
wait "${pid2}" || true

echo "Response A: $(cat "${tmp1}")"
echo "Response B: $(cat "${tmp2}")"
rm -f "${tmp1}" "${tmp2}"

echo "4) Invalid JSON body test (expect error)"
curl -sS -X POST "${BASE_URL}/refund-order" "${auth_headers[@]}" -d '{"otp":' || true
echo

echo "5) Input validation tests"
echo "- Refund with invalid amount (expect validation error)"
call_endpoint POST "refund-order" "{\"otp\":\"${OTP}\",\"order_id\":\"${ORDER_ID}\",\"amount\":-5}" || true
echo
echo "- Pause with invalid pause_till (expect validation error)"
call_endpoint POST "pause-subscription" "{\"otp\":\"${OTP}\",\"subs_id\":\"${SUBSCRIPTION_ID}\",\"pause_till\":\"invalid-date\"}" || true
echo
echo "- Refund with invalid soft_refund type (expect validation error)"
call_endpoint POST "refund-order" "{\"otp\":\"${OTP}\",\"order_id\":\"${ORDER_ID}\",\"soft_refund\":\"yes\"}" || true
echo

echo "Verification script complete."
