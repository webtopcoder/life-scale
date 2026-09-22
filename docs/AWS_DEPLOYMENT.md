# AWS deployment

## Frontend (SST)

Static Vite app → S3 + CloudFront. Domains: `dev.life-scale.com` (dev), `life-scale.com` / `www` (prod).

### Prerequisites

- AWS profile `estrelar` configured
- Frontend build env:
  - `VITE_API_URL`
  - `VITE_COGNITO_USER_POOL_ID`
  - `VITE_COGNITO_CLIENT_ID`
  - `VITE_COGNITO_DOMAIN`
  - `VITE_COGNITO_REGION`
  - `VITE_PUBLIC_POSTHOG_KEY` / `VITE_PUBLIC_POSTHOG_HOST` (optional)

### Deploy locally

```bash
npm install
npm run deploy:web:dev    # or deploy:web:prod
```

### GitHub Actions

- Dev: `.github/workflows/deploy-sst-dev.yml`
- Prod: `.github/workflows/deploy-sst-prod.yml`

Secrets include Cognito + API URL + PostHog, plus Apple merchant domain association hex for `/.well-known/`.

CORS for the API is configured on the Nest/HTTP API stack (allowed web origins), not a third-party BaaS.

## API (CDK + Lambda)

```bash
npm run deploy:api:dev    # or deploy:api:prod
```

Packages a pruned zip (`api/scripts/package-lambda.mjs`), then deploys via CDK (`infra/cdk`). CI uses GitHub OIDC role `github-oidc-cp-role` (see `.github/workflows/deploy-api.yml`).

## Validate

1. Open the web domain / CloudFront URL.
2. Sign in with Cognito, confirm API calls to `api-dev.life-scale.com` / `api.life-scale.com` succeed.
3. Check browser network for `401`/`CORS` if something fails.

## Config

- SST: [`sst.config.ts`](../sst.config.ts)
- CDK: [`infra/cdk/`](../infra/cdk/)
