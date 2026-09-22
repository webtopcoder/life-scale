# Breeze billing setup

Do **not** put `BREEZE_API_KEY` or webhook secrets in `VITE_*` variables—they would ship to the browser.

## Current pricing model

| Product | Amount |
|---------|--------|
| IQ subscription — default funnel (`/onboarding`) | **$29.99/month** recurring; **$1.00** for **3-day** trial (`planId: 3d` on `IQ_SUBSCRIPTION`) |
| IQ subscription — BOA funnel (`/onboarding-boa`) | Same regular onboarding `flow_id`; **$29.98/month** recurring; **$1.00** for **3-day** trial (`planId: 3d` on `IQ_SUBSCRIPTION_BOA`) |
| IQ subscription — RVR funnel (`/onboarding-rvr`) | Same regular onboarding `flow_id`; **$29.97/month** recurring; **$1.00** for **3-day** trial (`planId: 3d` on `IQ_SUBSCRIPTION_RVR`) |
| IQ subscription — alt funnel (`/onboarding-home`, `/onboarding-alt` redirect) | **$29.99/month** recurring; **$1.00** first week (discounted trial) |
| IQ subscription — plans funnel (`/onboarding-plans`) | **$29.99/month** recurring; trial depends on plan: **$4.99** (1 week), **$14.99** (4 weeks), or **$29.99** (12 weeks) |
| IQ subscription — short-IQ funnel (`/short-iq`) | **$29.99/month** recurring; **$1.00** for **3-day** trial (`planId: 3d` on `IQ_SUBSCRIPTION_ALT`) |
| Weakness Report, Genius Blueprint, Brain Coach | **$1.00** each (one-time) |

After changing script constants, re-run the npm `breeze:create-*` commands and update Nest API product/price secrets before deploying. To change recurring price on an **existing** product without creating a new product, use `breeze:create-subscription-price` (see below).

## 1. Dashboard: products & prices

In the [Breeze dashboard](https://dashboard.breeze.cash), create subscription and one-time products/prices that match your funnel. Copy each `prd_xxx` and `prc_xxx` ID.

### Optional: create subscription product + price via script

Put `BREEZE_API_KEY` in [`scripts/.env`](../scripts/.env) (do not commit secrets). Edit the constants at the top of [`scripts/create-breeze-subscription-product.ts`](../scripts/create-breeze-subscription-product.ts), then run:

```bash
npm run breeze:create-subscription-product
```

The script will print copy-ready IDs:

```bash
PRODUCT_ID=prd_...
PRICE_ID=prc_...

BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID=prd_...
BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
```

### Optional: create alt subscription product + price via script

For the **onboarding-alt** funnel (`IQ_SUBSCRIPTION_ALT` price key), edit constants in [`scripts/create-breeze-alt-subscription-product.ts`](../scripts/create-breeze-alt-subscription-product.ts), then run:

```bash
npm run breeze:create-alt-subscription-product
```

The script will print copy-ready IDs:

```bash
PRODUCT_ID=prd_...
PRICE_ID=prc_...

BREEZE_IQ_ALT_SUBSCRIPTION_PRODUCT_ID=prd_...
BREEZE_IQ_ALT_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
```

Alt checkout uses `variant="embedded"` in [`CheckoutPage.tsx`](../src/pages/CheckoutPage.tsx) and still records purchases as `productKey: iq_subscription` for entitlements.

### Add recurring price to an existing subscription product

Breeze prices are immutable — create a **new** recurring price on the existing product, then update Nest API recurring price secrets. Put `BREEZE_API_KEY` in [`scripts/.env`](../scripts/.env). Edit `PRODUCT_ID` and `PRICE_AMOUNT` in [`scripts/create-breeze-subscription-price.ts`](../scripts/create-breeze-subscription-price.ts), then run:

```bash
npm run breeze:create-subscription-price
```

The script prints copy-ready IDs:

```bash
PRODUCT_ID=prd_...
PRICE_ID=prc_...

BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
BREEZE_IQ_ALT_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
```

Existing subscriptions on the old `prc_` ID continue at their original rate until migrated in Breeze.

### Create BOA/RVR variant prices on the subscription product

For the **onboarding-boa** and **onboarding-rvr** funnels, put `BREEZE_API_KEY` and `BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID` in [`scripts/.env`](../scripts/.env), then run:

```bash
npm run breeze:create-onboarding-variant-prices
```

The script creates two new recurring prices on the existing subscription product and prints copy-ready IDs:

```bash
BREEZE_IQ_BOA_SUBSCRIPTION_PRODUCT_ID=prd_...
BREEZE_IQ_BOA_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
BREEZE_IQ_RVR_SUBSCRIPTION_PRODUCT_ID=prd_...
BREEZE_IQ_RVR_SUBSCRIPTION_RECURRING_PRICE_ID=prc_...
```

### Optional: create regular (one-time) products via script

For **REGULAR** products ([Create a product](https://docs.breeze.com/reference/createproduct)), use the same `scripts/.env` and edit constants in each script before running:

| Script | npm command |
|--------|-------------|
| [`scripts/create-breeze-weakness-report-product.ts`](../scripts/create-breeze-weakness-report-product.ts) | `npm run breeze:create-weakness-report-product` |
| [`scripts/create-breeze-genius-blueprint-product.ts`](../scripts/create-breeze-genius-blueprint-product.ts) | `npm run breeze:create-genius-blueprint-product` |
| [`scripts/create-breeze-brain-coach-product.ts`](../scripts/create-breeze-brain-coach-product.ts) | `npm run breeze:create-brain-coach-product` |

Each prints `PRODUCT_ID` / `PRICE_ID` plus the matching `BREEZE_*_PRODUCT_ID` and `BREEZE_*_PRICE_ID` lines for Nest API secrets. `UNIT_AMOUNT` is in **minor units** (e.g. `1000` = USD 10.00).

### Optional: look up an existing product

To fetch product details (including price IDs) via [Get a product by ID](https://docs.breeze.com/reference/getproduct), edit `PRODUCT_ID` in [`scripts/get-breeze-product.ts`](../scripts/get-breeze-product.ts), then run:

```bash
npm run breeze:get-product
```

The script prints the full product JSON to stdout (useful for copying `prc_xxx` IDs into Nest API secrets).

## 2. Nest API / Lambda secrets

Configure these in **Nest API / Lambda environment variables** (or `set as API / Lambda env`):

| Secret | Purpose |
|--------|---------|
| `BREEZE_API_KEY` | Server-side API key (`sk_live_...` / `sk_test_...`) |
| `BREEZE_WEBHOOK_SECRET` | Webhook signing secret (`whook_sk_...`) from Breeze dashboard |

### Price / product IDs (required by `breeze-create-page`)

Match names to [`api/src/ (Nest modules)/breeze-create-page/index.ts`](../api/src/ (Nest modules)/breeze-create-page/index.ts) `resolvePrice()`:

| Secret | Used for |
|--------|----------|
| `BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID` | Default IQ subscription (`prd_`) |
| `BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID` | Default recurring price after trial (`prc_`) |
| `BREEZE_IQ_ALT_SUBSCRIPTION_PRODUCT_ID` | Alt funnel IQ subscription (`prd_`) |
| `BREEZE_IQ_ALT_SUBSCRIPTION_RECURRING_PRICE_ID` | Alt recurring price after trial (`prc_`) |
| `BREEZE_IQ_BOA_SUBSCRIPTION_PRODUCT_ID` | BOA funnel IQ subscription (`prd_`) |
| `BREEZE_IQ_BOA_SUBSCRIPTION_RECURRING_PRICE_ID` | BOA recurring price after trial (`prc_`) |
| `BREEZE_IQ_RVR_SUBSCRIPTION_PRODUCT_ID` | RVR funnel IQ subscription (`prd_`) |
| `BREEZE_IQ_RVR_SUBSCRIPTION_RECURRING_PRICE_ID` | RVR recurring price after trial (`prc_`) |
| `BREEZE_WEAKNESS_REPORT_PRODUCT_ID` | One-time |
| `BREEZE_WEAKNESS_REPORT_PRICE_ID` | One-time |
| `BREEZE_GENIUS_BLUEPRINT_PRODUCT_ID` | One-time |
| `BREEZE_GENIUS_BLUEPRINT_PRICE_ID` | One-time |
| `BREEZE_BRAIN_COACH_PRODUCT_ID` | One-time |
| `BREEZE_BRAIN_COACH_PRICE_ID` | One-time |

### `breeze-create-page`: payment page context

Optional JSON body field **`paymentPageContext`** (sent only when `one_click`):

| Value | When to use |
|--------|-------------|
| *(omit or invalid)* | Defaults to **`web`**: main checkout ([`/checkout`](../src/pages/CheckoutPage.tsx)), dashboard Breeze checkouts. |
| **`one_click`** | Post-checkout **funnel upsells** ([`/upsell/*`](../src/pages/UpsellWeaknessReportPage.tsx) and siblings): same Breeze customer as initial checkout; required by Breeze for one-time `payment_pages` after the first purchase. |

### Customer resolution (`breeze-create-page`)

The edge function resolves a Breeze **`customer.id`** by **`GET /v1/customers`** ([get customer by query](https://docs.breeze.com/reference/getcustomerbyquery)) using **`referenceId`** (your billing `externalId`) first, then **`POST /v1/customers`** for new users, then GET again by **`referenceId`** and **`email`** if create fails (e.g. customer already exists). **`POST /v1/subscriptions`** requires **`customer.id`**; if it cannot be resolved, the function returns **400** with a clear error instead of a Breeze `WRONG_PARAMETER` response.

### IQ trial configuration

Trial settings in [`breeze-create-page`](../api/src/ (Nest modules)/breeze-create-page/index.ts):

| Price key | Breeze field | Trial |
|-----------|--------------|-------|
| `IQ_SUBSCRIPTION` | `discountedTrial` | **$29.99/month** recurring; **$1.00** for 3 days when `planId: 3d` |
| `IQ_SUBSCRIPTION_BOA` | `discountedTrial` | **$29.98/month** recurring; **$1.00** for 3 days when `planId: 3d` |
| `IQ_SUBSCRIPTION_RVR` | `discountedTrial` | **$29.97/month** recurring; **$1.00** for 3 days when `planId: 3d` |
| `IQ_SUBSCRIPTION_ALT` | `discountedTrial` | **$29.99/month** recurring; **$1.00** for 1 week when `planId` omitted, or **3 days** when `planId: 3d` |

**Plans funnel** (`/onboarding-plans`): same `IQ_SUBSCRIPTION_ALT` product/price secrets; pass optional JSON body field **`planId`** (`1w` \| `4w` \| `12w`) to override the trial:

| `planId` | Trial charge | Trial length | Recurring |
|----------|-------------|--------------|-----------|
| `1w` | $4.99 | 1 week | $29.99/month |
| `4w` | $14.99 | 4 weeks | $29.99/month |
| `12w` | $29.99 | 12 weeks | $29.99/month |

**Default funnel** (`/onboarding`): `IQ_SUBSCRIPTION` with **`planId: 3d`** for a **$1.00** trial over **3 days**, then **$29.99/month**.

**BOA funnel** (`/onboarding-boa`): uses the same regular onboarding `flow_id` as `/onboarding`; the route selects `IQ_SUBSCRIPTION_BOA` with **`planId: 3d`** for a **$1.00** trial over **3 days**, then **$29.98/month**.

**RVR funnel** (`/onboarding-rvr`): uses the same regular onboarding `flow_id` as `/onboarding`; the route selects `IQ_SUBSCRIPTION_RVR` with **`planId: 3d`** for a **$1.00** trial over **3 days**, then **$29.97/month**.

**Short-IQ funnel** (`/short-iq`): same `IQ_SUBSCRIPTION_ALT` product/price secrets; pass **`planId: 3d`** for a **$1.00** trial over **3 days**, then **$29.99/month**.

## 3. Webhook URL

After deploying functions, register the public URL of **`breeze-webhook`** in the Breeze dashboard so renewals, cancellations, and refunds sync.

## 4. Apple Pay domain association

Replace the placeholder in [`public/.well-known/apple-developer-merchantid-domain-association.txt`](../public/.well-known/apple-developer-merchantid-domain-association.txt) with the exact file Breeze emails you for your domain.

### Upsell tax quotes (`breeze-create-page`)

Funnel upsell pages pass **`taxAmountCents`** with **`paymentPageContext: one_click`**. [`breeze-create-page`](../api/src/ (Nest modules)/breeze-create-page/index.ts) calls [Get tax rate for merchant](https://docs.breeze.com/reference/getmerchanttaxrate) and includes optional **`taxQuote`** on the one-time response. [`BreezeCheckout`](../src/components/BreezeCheckout.tsx) shows the total above the iframe when `taxQuote` is present.

- **Request (extra fields):** `taxAmountCents` (integer, minor units, e.g. `100` for $1.00) — only honored when `paymentPageContext` is `one_click`.
- **Response (one-time):** `{ ..., taxQuote?: { taxRate, amountToCollect, subtotalCents, taxCents, totalCents, currency, ipInaccurate? } }`

## 5. Deploy edge functions

Deploy at least:

- `breeze-create-page`
- `breeze-checkout-status`
- `breeze-verify-payment`
- `breeze-webhook`
- `partner-user-assets`, `partner-cancel-subscription`, `partner-pause-subscription`, `partner-refund-order`
- `user-cancel-subscription`, `user-pause-subscription`

Apply the database migrations that add [`user_purchases.breeze_payment_page_id`](../api/prisma/migrations/20260512165527_c6243c4d-0896-4e6d-a79d-783f7aa19bff.sql) and [`cancel_otps.verified_at`](../api/prisma/migrations/20260512185912_83c04e0b-f0ff-47ff-837c-e57c2555a503.sql) so partner refunds and MFA verification windows work correctly.

All checkout paths use **Breeze** (`breeze-create-page`, `breeze-verify-payment`, `breeze-webhook`). Post-checkout upsell purchases use `paymentPageContext: one_click` on one-time payment pages. Partner billing MFA endpoints use Breeze plus `user_purchases` (not FunnelFox Billing).
