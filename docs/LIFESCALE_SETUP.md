# Life-Scale payment setup

Life Scale (brainwave-booster-47) accepts payments through the internal **Life-Scale** checkout widget and webhooks. Breeze Cash is retired.

## Environment

### Partner hosts

| Env | `api-base-url` | Widget script (derived) |
|-----|----------------|-------------------------|
| Staging / local / `dev` | `https://sirius.bigdog.app` | `{base}/widget/life-scale-checkout.umd.js` |
| Production / `prod` | `https://sirius.bigdog.app` | `{base}/widget/life-scale-checkout.umd.js` |

CSS is `{base}/widget/life-scale-checkout.css`. There is no separate widget-script env var — both assets come from the same base.

### Frontend (`VITE_*`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_LIFESCALE_API_BASE_URL` | Widget + partner API host | Sirius in every environment |

Set via:

- Root `.env` for local Vite (`https://sirius.bigdog.app`)
- `sst.config.ts` stage default (override with env)
- GitHub Actions environment variables `VITE_LIFESCALE_API_BASE_URL` on **dev** / **prod** (wired in `deploy-sst-*.yml`)

All embeds resolve the host via `lifeScaleApiBaseUrl()` (never hardcode a different host).

### API

| Variable | Purpose |
|----------|---------|
| `LIFESCALE_API_BASE_URL` | Partner API base (Nest outbound cancel / access / upsell) — staging vs Sirius per stage |
| `LIFESCALE_WEBHOOK_SECRET` | HMAC secret from webhook dashboard (copy once) |
| `LIFESCALE_API_KEY` | Server-to-server key sent as `X-API-Key` for cancel, access status, and `/api/upsell`. **No default in code** — leave empty only for local soft-cancel demo |

Add these keys to `api/.env` (dev) / `api/.env.prod` (prod). CDK creates Secrets Manager `brainwave/api/{stage}` but **does not overwrite `SecretString` on deploy** (see `infra/cdk/README.md`). Keep `api/.env` in sync for local development.

Set `LIFESCALE_API_BASE_URL` in Secrets Manager out-of-band:

- `brainwave/api/dev` → `https://sirius.bigdog.app`
- `brainwave/api/prod` → `https://sirius.bigdog.app`

Widget checkout does **not** use Nest `LIFESCALE_API_*`; only outbound Nest calls do.

## Register the webhook

1. Open https://sirius.bigdog.app/dashboard/webhooks (use production credentials from the payment team).
2. **+ Add endpoint** → URL:
   - Dev: `https://api-dev.life-scale.com/api/billing/webhooks/lifescale`
   - Prod: `https://api.life-scale.com/api/billing/webhooks/lifescale`
3. Select events:
   - `checkout.completed`
   - `checkout.failed`
   - `subscription.rebilled`
   - `subscription.payment_failed`
   - `subscription.cancelled`
   - `upsell.completed`
4. Copy the signing secret into `LIFESCALE_WEBHOOK_SECRET`.

Signature verification uses header `x-lifescale-signature` = `sha256=` + HMAC-SHA256(rawBody, secret).

## Offer IDs

### Subscription (tier × trial)

All 20 tier × trial offers live in `src/lib/lifeScaleOffers.ts` (mirrored parse helper in `api/src/billing/life-scale-offers.ts`).

Legacy IQ funnels default to `focus_1.00_3d_28.99_28d`. Multi-plan maps Focus 7d / 28d / 84d.

### Add-on / upsell products

Catalog keys live in `src/lib/addons.ts` (e.g. `addon_iq_weakness_report`). Partner SKUs add a suffix:

| Surface | Offer id |
|---------|----------|
| Funnel / in-app `#ls-upsell` widget | Catalog key as-is (e.g. `addon_iq_speed_accuracy_report`) |
| Future dashboard `POST /api/upsell` | Same catalog key |

Helpers: `toPartnerAddonOfferId` (strips legacy `_upsell` / `_dashboard` if present), `normalizeAddonOfferId`.

Life-Scale `customer_id` is stored on the subscription row as `user_purchases.ff_subscription_id`.

## User journeys

1. **Homepage (direct pay):** `/auth-gate` → `/choose-tier` → `/trial-offer` → `/checkout-summary` (`home-iframe`) → `/thank-you` → scale start. No upsell hop. Passes `data-email` from the signed-in user.
2. **Funnel (subscription + upsell):** `/checkout` (`funnel-iframe`) → `/upsell?customer_id=cust_…&offer_id=addon_…` (`#ls-upsell`) → `/thank-you`.
3. **In-app add-on buy (subscriber):** `/addons/:branch/:slug?customer_id=…&offer_id=addon_…` embeds `#ls-upsell` with the **same catalog title/price** as the dashboard card (`priceCents`). Success → `/addons/…/view` (polls for webhook entitlement, then generates the report). Nest `POST /api/billing/addon-upsell` charges via partner `POST /api/upsell` with `X-API-Key` when `LIFESCALE_API_KEY` is set.
4. **Upgrade:** `/upgrade/:branch/checkout` uses the same `home-iframe` summary page as homepage.

Before the widget loads, the SPA calls `POST /api/billing/checkout-intent` (subscription) or `POST /api/billing/addon-intent` (in-app add-on). After redirect, it calls `POST /api/billing/confirm-checkout` or `POST /api/billing/confirm-addon` so entitlement is activated even when the partner webhook is delayed or misnamed. Webhook `checkout.completed` / `upsell.completed` remain source of truth for `customer_id` / `transaction_id`. If the partner fires `subscription.rebilled` (or `checkout.completed`) with an `addon_*` `offer_id`, Nest fulfills it as an add-on purchase.

`LIFESCALE_API_KEY` is required for Nest→partner cancel, access status, and `/api/upsell`. Widget checkout does not use it.

React wrappers: `LifeScaleCheckout` / `LifeScaleUpsell` in `src/components/LifeScaleCheckout.tsx`.

**Without an active `iq_subscription` purchase + profile tier, the main dashboard shows locked categories and `BranchGate` sends users to `/upgrade/:branch`.**

## Database

Migration `20260831200000_lifescale_checkout` adds:

- `checkout_intents`
- `lifescale_webhook_events`
- indexes on `user_purchases.ff_subscription_id` / `ff_payment_id` (store Life-Scale `customer_id` / `transaction_id`)

Apply with your usual Prisma migrate path before deploying the API.

## Cancel / pause / access

Outbound Nest calls use header `X-API-Key: $LIFESCALE_API_KEY` (no code default). Hosts:

| Env | Base |
|-----|------|
| Staging / local | `https://sirius.bigdog.app` |
| Production | `https://sirius.bigdog.app` |

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/access/:customer_id_or_email` | Live subscription access. **200** returns fields like `customer_id`, `offer_id`, `subscription_id`, `next_charge_date` (often no `active` flag). **404** `{ error: "Customer not found: …" }` when none |
| `POST` | `/api/ops/customer/:customer_id/cancel` | Cancel subscription at the partner |
| `POST` | `/api/upsell` | Charge saved card for an add-on (`customer_id`, `upsell_offer_id`, `payment_method: "card"`) |

Help Center OTP cancel (`POST /api/billing/cancel-subscription`) and partner chatbot cancel resolve Life-Scale `customer_id` from `user_purchases.ff_subscription_id`, then:

1. `GET /api/access/:customer_id` (email fallback if needed)
2. If not active → `404 No active subscription found`
3. `POST /api/ops/customer/:customer_id/cancel`
4. Soft-update local `user_purchases.status = cancelled` **only after** a successful partner cancel

Without `LIFESCALE_API_KEY` / `LIFESCALE_API_BASE_URL`, cancel soft-updates locally only (demo). Webhook `subscription.cancelled` remains an additional source of truth for entitlement revocation.

**Pause** is local-only until the partner publishes a pause HTTP API. Partner `POST /api/partner/pause-subscription` returns 501.

## Frontend embeds

Load **both** assets (CSS is required — the UMD alone renders unstyled HTML). Host: `VITE_LIFESCALE_API_BASE_URL` (staging or Sirius — see Environment above).

### Home iframe (direct pay — `/checkout-summary`)

```html
<link rel="stylesheet" href="https://sirius.bigdog.app/widget/life-scale-checkout.css" />
<div
  id="ls-checkout"
  data-variant="home-iframe"
  data-offer-id="complete_1.00_3d_38.99_28d"
  data-success-url="/thank-you"
  data-api-base-url="https://sirius.bigdog.app"
></div>
<script src="https://sirius.bigdog.app/widget/life-scale-checkout.umd.js"></script>
```

### Funnel iframe (checkout → upsell — `/checkout`)

```html
<link rel="stylesheet" href="https://sirius.bigdog.app/widget/life-scale-checkout.css" />
<div
  id="ls-checkout"
  data-variant="funnel-iframe"
  data-offer-id="complete_1.00_3d_38.99_28d"
  data-upsell-offer-id="addon_iq_weakness_report"
  data-upsell-url="/upsell"
  data-success-url="/thank-you"
  data-api-base-url="https://sirius.bigdog.app"
></div>
<script src="https://sirius.bigdog.app/widget/life-scale-checkout.umd.js"></script>
<script>
  const params = new URLSearchParams(window.location.search);
  const el = document.getElementById('ls-checkout');
  if (params.get('email')) el.dataset.email = params.get('email');
  if (params.get('name')) el.dataset.name = params.get('name');
  window.addEventListener('message', function (e) {
    if (e.data.type === 'funnel:height') el.style.height = e.data.height + 'px';
  });
</script>
```

### Upsell page (`/upsell?customer_id=cust_…&offer_id=addon_…`)

```html
<link rel="stylesheet" href="https://sirius.bigdog.app/widget/life-scale-checkout.css" />
<div
  id="ls-upsell"
  data-upsell-offer-id="addon_iq_weakness_report"
  data-success-url="/thank-you"
  data-decline-url="/thank-you"
  data-api-base-url="https://sirius.bigdog.app"
></div>
<script src="https://sirius.bigdog.app/widget/life-scale-checkout.umd.js"></script>
```

The widget reads `customer_id` and `offer_id` from the **page URL**. The SPA also sets `data-upsell-offer-id` and will backfill `customer_id` from the subscription purchase when missing.

### In-app add-on (widget — current)

Same `#ls-upsell` embed as funnel upsell, on `/addons/:branch/:slug` with URL `customer_id` + bare `offer_id` (e.g. `addon_iq_speed_accuracy_report`). Page copy uses the catalog add-on title / `priceCents` so it matches the dashboard card the user clicked. Success URL is the add-on report view.

### Dashboard add-on API

Authenticated Nest route: `POST /api/billing/addon-upsell` `{ "addonKey": "addon_iq_weakness_report" }`  
→ partner `POST {LIFESCALE_API_BASE_URL}/api/upsell` with `{ customer_id, upsell_offer_id: "addon_iq_weakness_report", payment_method: "card" }` and `X-API-Key: $LIFESCALE_API_KEY`.

`data-variant`: `home-iframe` (card UI, no upsell hop) or `funnel-iframe` (compact panel + upsell).
