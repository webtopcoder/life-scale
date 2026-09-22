# Onboarding e2e (Playwright)

Assertion smoke tests that verify Nest-seeded onboarding questions load in the public funnels.

## Prerequisites

1. Database migrated and seeded:

```bash
npm run api:migrate:deploy
npm run api:seed
```

2. Nest API on port **3001** (include the Vite origin in CORS):

```bash
# api/.env should include:
# ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
npm run api:dev
```

3. Vite UI on port **8080**, with `VITE_API_URL=http://localhost:3001` in root `.env`:

```bash
npm run dev
```

Restart Vite after changing `VITE_*` env vars (they are baked in at startup).

4. Chromium for Playwright (once):

```bash
npx playwright install chromium
```

Optional: copy [`.env.e2e.example`](../.env.e2e.example) to `.env.e2e` to override `E2E_BASE_URL` / `E2E_API_URL`.

Servers are **not** started automatically — start API + Vite before running tests.

## Run

```bash
# All e2e
npm run test:e2e

# Onboarding only (API contract + UI smoke)
npm run test:e2e:onboarding
```

## What is covered

| Spec | Checks |
|------|--------|
| `onboarding/api-questions.spec.ts` | `GET /api/onboarding/questions?flow=<uuid>` returns expected counts |
| `onboarding/flows.spec.ts` | Public routes boot, leave intro, show assessment progress with expected total |

Public routes: `/onboarding`, `/onboarding-home`, `/onboarding-plans`, `/onboarding-boa`, `/onboarding-rvr`, `/short-iq`, `/preview/iq-start`.

Auth / BranchGate routes (`/iq-start`, `/bh-start`, `/hg-start`) are out of scope for this suite.

## Complete-tier test user (manual / future auth e2e)

Seed an auto-confirmed Cognito user with full branch access and score payloads (no upsells):

```bash
npm run api:seed:test-user
```

Defaults: `e2e-complete@iq-scale.test` / `TestUser123!` (see `api/prisma/seed/README.md`).
