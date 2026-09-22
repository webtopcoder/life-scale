# Partner API Integration Guide

## Overview

This document describes the Partner API endpoints available for external integrations (e.g. chatbot systems). All endpoints require **dual authentication**: a shared API key and a user JWT token.

---

## Authentication

Every request must include **two headers**:

| Header | Description |
|--------|-------------|
| `x-api-key` | Shared partner API key (provided during onboarding) |
| `Authorization` | `Bearer <user_jwt>` — the user's session JWT obtained after login |

If either header is missing or invalid, the endpoint returns `401 Unauthorized`.

---

## Base URL

```
https://api.life-scale.com/api/partner
```

Dev: `https://api-dev.life-scale.com/api/partner`

---

## Endpoints

### 1. Validate User

Confirms the JWT is valid and returns basic user info.

**POST** `/validate-user`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/validate-user \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

No request body required.

#### Success Response (200)

```json
{
  "valid": true,
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com"
}
```

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 401 | `{ "valid": false, "error": "Invalid API key" }` | Bad or missing `x-api-key` |
| 401 | `{ "valid": false, "error": "Missing or invalid Authorization header" }` | Bad or missing JWT |
| 401 | `{ "valid": false, "error": "Invalid or expired JWT" }` | JWT signature invalid or expired |

---

### 2. Send MFA Code

Sends a 6-digit verification code to the authenticated user's email address.

**POST** `/send-mfa`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/send-mfa \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

No request body required. The email is extracted from the JWT — it cannot be spoofed.

#### Success Response (200)

```json
{
  "success": true,
  "message": "Verification code sent"
}
```

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 401 | `{ "error": "..." }` | Auth failure (see Validate User errors) |
| 429 | `{ "error": "Too many requests. Please try again later." }` | Rate limit: max 3 codes per email per hour |
| 500 | `{ "error": "Failed to generate verification code" }` | Internal error |

#### Notes

- The code must be entered and verified via `/verify-mfa` before **`expires_at`** (approximately **10 minutes** after send).
- Maximum **3 OTP requests per email per hour**.
- The user receives an email with the 6-digit code (delivered via SendGrid).

#### Email Provider Configuration

`/send-mfa` requires these API environment variables:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

---

### 3. Verify MFA Code

Verifies a 6-digit code previously sent via `/send-mfa`.

**POST** `/verify-mfa`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/verify-mfa \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "otp": "123456" }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | The 6-digit code the user received via email |

#### Success Response (200)

```json
{
  "valid": true,
  "message": "Verification successful"
}
```

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "OTP code is required" }` | Missing or non-string `otp` field |
| 400 | `{ "valid": false, "error": "Invalid or expired verification code" }` | Wrong code, expired, or max attempts exceeded |
| 401 | `{ "error": "..." }` | Auth failure |
| 500 | `{ "error": "Verification failed" }` | Internal error |

#### Notes

- Maximum **3 incorrect attempts** per OTP code. After that, a new code must be requested.
- On success, the OTP is marked verified and **`verified_at`** is set. The same code may be sent to any MFA-gated partner endpoint for **10 minutes** after that moment (the row is not deleted per call). Codes verified before `verified_at` existed in the database will not pass gated checks until the user verifies again with a new code.

---

### 4. Get User Stats

Returns the number of tests completed by the user. **Requires a previously verified MFA code.**

**POST** `/partner-user-stats`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/user-stats \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "otp": "123456" }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | A previously **verified** OTP code (from `/verify-mfa`) |

#### Success Response (200)

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "assessment_count": 3,
  "likert_count": 5,
  "total": 8
}
```

| Field | Description |
|-------|-------------|
| `user_id` | The user's unique identifier |
| `email` | The user's email address |
| `assessment_count` | Number of completed IQ assessment sessions |
| `likert_count` | Number of completed personality/trait tests |
| `total` | Sum of both counts |

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "Verified OTP is required" }` | Missing `otp` field |
| 401 | `{ "error": "..." }` | Auth failure |
| 403 | `{ "error": "MFA verification required. Please verify your OTP first." }` | OTP not verified, or outside the 10-minute window after successful `/verify-mfa` |

#### Notes

- The same verified OTP stays valid for **10 minutes** after `/verify-mfa` (see section 3). You may call this endpoint again within that window without a new code.

---

### 5. Get User Assets (Orders & Subscriptions)

Returns Breeze-linked purchases for the authenticated user from application data (`user_purchases`), with optional live subscription status from Breeze. **Requires a previously verified MFA code.**

**POST** `/partner-user-assets`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/user-assets \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "otp": "123456" }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | A previously **verified** OTP code (from `/verify-mfa`) |

#### Success Response (200)

JSON built from `user_purchases` (synced via Breeze payment verify/webhook handlers on the Nest API) plus optional live Breeze subscription status when `BREEZE_API_KEY` is configured.

```json
{
  "source": "breeze_user_purchases",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "subscriptions": [
    {
      "subs_id": "subs_xxx",
      "product_key": "iq_subscription",
      "amount_cents": 990,
      "purchased_at": "2026-05-01T12:00:00.000Z",
      "breeze_status": "ACTIVE"
    }
  ],
  "one_time_orders": [
    {
      "product_key": "weakness_report",
      "amount_cents": 1000,
      "purchased_at": "2026-05-02T12:00:00.000Z",
      "refund_page_id": "page_xxx",
      "payment_id": "py_xxx"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `source` | Always `breeze_user_purchases` for this endpoint. |
| `user_id` | Authenticated user id (JWT `sub`). |
| `subscriptions` | Rows with a Breeze subscription id. `subs_id` is used with `/partner-cancel-subscription`. `breeze_status` is from Breeze when the server key is present; otherwise `null`. |
| `one_time_orders` | One-time products (no subscription id). `refund_page_id` is the Breeze **payment page** id (`page_xxx`) to send as `order_id` to `/partner-refund-order` when present. `payment_id` is the stored Breeze payment id when known and may be a `py_xxx` id (not always usable as `order_id` for refunds). |

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "Verified OTP is required" }` | Missing `otp` field |
| 401 | `{ "error": "..." }` | Auth failure |
| 403 | `{ "error": "MFA verification required. Please verify your OTP first." }` | OTP not verified, or outside the 10-minute window after successful `/verify-mfa` |

#### Notes

- The same verified OTP stays valid for **10 minutes** after `/verify-mfa`; the row is not deleted when you call this endpoint.
- **Migration from older responses:** this endpoint no longer returns the FunnelFox Billing `my_assets` shape. Integrations must use `subs_id` and `refund_page_id` as documented.
- New checkouts should persist `breeze_payment_page_id` via `breeze-verify-payment` when the client sends `breezePageId`. Older rows may only have `payment_id` (`py_xxx`); refunds require a `page_xxx` — use Breeze dashboard or re-run verification with page id if `refund_page_id` is null.

---

### 6. Refund an Order

Refunds a Breeze **payment page** (one-time purchase). **Requires a previously verified MFA code.**

**POST** `/refund-order`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/refund-order \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "order_id": "page_abc123",
    "reason": "customer_request",
    "comment": "User requested refund via chatbot"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | A previously **verified** OTP code |
| `order_id` | string | Yes | Breeze **payment page** id (`page_xxx`) from `/partner-user-assets` `one_time_orders[].refund_page_id` when set |
| `reason` | string | No | Reason for the refund |
| `comment` | string | No | Additional comment |
| `amount` | number | No | Partial refund amount (must be a positive number; omit for full refund) |
| `soft_refund` | boolean | No | If `true`, marks as refunded without processing payment reversal. Also used automatically when `BREEZE_API_KEY` is not configured (demo mode). |

#### Success Response (200)

Returns the Breeze refund API JSON (or an error payload with `details`).

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "Verified OTP is required" }` | Missing `otp` field |
| 400 | `{ "error": "order_id is required" }` | Missing `order_id` field |
| 401 | `{ "error": "..." }` | Auth failure |
| 403 | `{ "error": "MFA verification required. Please verify your OTP first." }` | OTP not verified or outside post-verify window |

#### Notes

- The same verified OTP stays valid for **10 minutes** after `/verify-mfa`; the row is not deleted on success.
- Breeze integration currently performs a **full** refund via `POST /v1/payment_pages/{pageId}/refund`. Optional body fields `amount`, `soft_refund`, `reason`, and `comment` are accepted for API compatibility but are **not** applied to the Breeze call in the current implementation.

---

### 7. Cancel Subscription (Breeze)

Cancels the subscription in **Breeze** (immediate cancel per Breeze behavior). **Requires a previously verified MFA code.**

**POST** `/cancel-subscription`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/cancel-subscription \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "subs_id": "subs_abc123",
    "reason": "customer_request",
    "comment": "User cancelled via chatbot"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | A previously **verified** OTP code |
| `subs_id` | string | Yes | Breeze subscription id from `/partner-user-assets` `subscriptions[].subs_id` |
| `reason` | string | No | Reason for cancellation |
| `comment` | string | No | Additional comment |

#### Success Response (200)

Returns the Breeze cancel API JSON (or an error payload with `details`).

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "Verified OTP is required" }` | Missing `otp` field |
| 400 | `{ "error": "subs_id is required" }` | Missing `subs_id` field |
| 401 | `{ "error": "..." }` | Auth failure |
| 403 | `{ "error": "MFA verification required. Please verify your OTP first." }` | OTP not verified or outside post-verify window |

#### Notes

- The same verified OTP stays valid for **10 minutes** after `/verify-mfa`; the row is not deleted on success.

---

### 8. Pause Subscription

Breeze **does not support** pausing subscriptions via API. This endpoint validates partner auth and MFA (same **10-minute** post-verify window as other gated calls), then returns **501**. The OTP row is **not** deleted.

**POST** `/pause-subscription`

#### Request

```bash
curl -X POST \
  https://api.life-scale.com/api/partner/pause-subscription \
  -H "x-api-key: YOUR_PARTNER_API_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "subs_id": "subs_abc123",
    "pause_till": "2026-04-23T00:00:00Z",
    "reason": "customer_request",
    "comment": "User paused via chatbot"
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | A previously **verified** OTP code |
| `subs_id` | string | Yes | Breeze subscription id (request shape only; pause is not performed) |
| `pause_till` | string | Yes | ISO 8601 datetime (validated; pause is not performed) |
| `reason` | string | No | Reason for pausing |
| `comment` | string | No | Additional comment |

#### Error Responses

| Status | Body | Reason |
|--------|------|--------|
| 400 | `{ "error": "..." }` | Missing or invalid body fields |
| 401 | `{ "error": "..." }` | Auth failure |
| 403 | `{ "error": "MFA verification required. Please verify your OTP first." }` | OTP missing, not verified, or expired |
| 501 | `{ "error": "Pause is not supported by Breeze. ..." }` | Pause is not available |

#### Notes

- The verified OTP is **not** deleted when this endpoint returns 501.
- Use `/partner-cancel-subscription` if the user should stop renewing.

---

## Typical Integration Flow

```
┌─────────┐       ┌──────────────┐       ┌─────────────┐
│  User   │       │  Partner     │       │  Our API    │
│ (App)   │       │  Server      │       │             │
└────┬────┘       └──────┬───────┘       └──────┬──────┘
     │                   │                      │
     │  Login → JWT      │                      │
     │──────────────────>│                      │
     │                   │                      │
     │                   │  POST /partner-validate-user
     │                   │  x-api-key + JWT     │
     │                   │─────────────────────>│
     │                   │  { valid, user_id }  │
     │                   │<─────────────────────│
     │                   │                      │
     │                   │  POST /send-mfa
     │                   │  x-api-key + JWT     │
     │                   │─────────────────────>│
     │                   │  { success }         │
     │                   │<─────────────────────│
     │                   │                      │
     │  User enters OTP  │                      │
     │──────────────────>│                      │
     │                   │                      │
     │                   │  POST /verify-mfa
     │                   │  x-api-key + JWT     │
     │                   │  { otp: "123456" }   │
     │                   │─────────────────────>│
     │                   │  { valid: true }     │
     │                   │<─────────────────────│
     │                   │                      │
     │                   │  POST /partner-user-assets
     │                   │  x-api-key + JWT     │
     │                   │  { otp: "123456" }   │
     │                   │─────────────────────>│
     │                   │  { subscriptions, purchases }
     │                   │<─────────────────────│
     │                   │                      │
     │                   │  POST /partner-refund-order
     │                   │  { otp, order_id }   │
     │                   │─────────────────────>│
     │                   │  { success }         │
     │                   │<─────────────────────│
```

---

## Rate Limits & Security

| Rule | Value |
|------|-------|
| OTP generation limit | 3 per email per hour |
| OTP code entry deadline | 10 minutes from send (`expires_at` until `/verify-mfa` succeeds) |
| Post-verify reuse window | Same code valid for **10 minutes** after successful `/verify-mfa` (`verified_at`) on MFA-gated endpoints |
| OTP verification attempts | 3 per code |
| Email source | Always extracted from JWT (cannot be spoofed) |

### OTP Concurrency

MFA-gated endpoints **no longer** use an atomic delete to enforce single-use. The same verified OTP may be used for multiple successful calls until the post-verify window ends. **Concurrent** requests with the same OTP can both succeed within that window; design integrations accordingly if that matters.

---

## Error Format

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes used: `200`, `400`, `401`, `403`, `429`, `500`, `501`.
