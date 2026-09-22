# Breeze sandbox testing checklist

Prerequisites: all secrets in [BREEZE_SETUP.md](./BREEZE_SETUP.md), functions deployed, webhook URL registered.

## Checkout (IQ subscription)

1. Open `/checkout` with a valid funnel session and email.
2. Complete payment in the embedded invoice iframe (sandbox test cards from [Checkout.com test cards](https://www.checkout.com/docs/developer-resources/testing/test-cards) per Breeze docs).
3. Confirm Breeze charges **$1.00** at checkout and subscription status is **DISCOUNTED_TRIALING**.
4. Confirm `user_purchases` row for `iq_subscription` with `amount_cents: 100` and optional welcome email.

## Dashboard one-time (e.g. Weakness Report)

1. From `/dashboard/weakness-report`, trigger purchase and complete payment in the embedded Breeze hosted-page iframe.
2. Confirm `breeze-verify-payment` records `weakness_report`.

## Funnel upsells (Weakness → Genius Blueprint → Brain Coach)

Prerequisites: one-time upsell prices are **$1.00** (100 cents each). Baseline IQ subscription funnels bill **$29.99/month** after trial, with `/onboarding-boa` at **$29.98/month** and `/onboarding-rvr` at **$29.97/month**. Trial is **$1.00** for **3 days** on the default, BOA, RVR, and short-IQ funnels (`planId: 3d`) and **$1.00** for the first week on the alt funnel (`discountedTrial` default). The **plans funnel** (`/onboarding-plans`) uses plan-specific trial amounts (499 / 1499 / 2999 cents).

1. Complete `/checkout` or `/onboarding-plans` (IQ subscription) and land on `/upsell/weakness-report`.
2. **Skip** weakness → `/upsell/genius-blueprint` shows **$1.00**; Breeze checkout uses `GENIUS_BLUEPRINT`.
3. Buy Weakness Report ($1.00) → redirect to `/upsell/genius-blueprint` → still **$1.00** (no bundle); Breeze uses `GENIUS_BLUEPRINT`.
4. In `user_purchases`: each upsell at **100** cents when purchased.

## Plans funnel checkout (`/onboarding-plans`)

1. Complete the IQ test through calculating; land on plan selection.
2. Choose **1-Week** ($4.99), **4-Week** ($14.99), or **12-Week** ($29.99) and click **Get My Report**.
3. On `/onboarding-plans/pay`, confirm the Breeze iframe shows the correct trial amount for the selected plan.
4. Complete payment; confirm `user_purchases` for `iq_subscription` with `amount_cents` matching the plan (499, 1499, or 2999).
5. Confirm redirect to `/upsell/weakness-report`.

Preview UI only (no payment): `/preview/plan-selection`.

## Partner cancel

Call `partner-cancel-subscription` with valid OTP and `subs_id` = Breeze `subs_xxx`. Expect subscription canceled in Breeze (immediate cancel vs legacy end-of-period).

## Partner refund

Call `partner-refund-order` with `order_id` = **`page_xxx`** (Breeze payment page id). Full refunds only.

## Partner pause

Expect HTTP **501** with message that pause is unsupported. The OTP row is not deleted; the same code remains valid for other MFA-gated calls within the post-verify window (see Partner API).

## Webhooks

Use Breeze dashboard to resend events or complete flows that emit `INVOICE_STATUS_UPDATED`, `SUBSCRIPTION_STATUS_UPDATED`, `REFUND_STATUS_UPDATE`. Validate signature verification in function logs.
