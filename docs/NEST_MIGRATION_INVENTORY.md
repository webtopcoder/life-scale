# Nest migration inventory (frozen)

## Domains

| Item | Value |
|------|--------|
| SST app name | `brainwave` |
| StaticSite id | `BrainwaveWeb` |
| Dev UI | `dev.life-scale.com` |
| Prod UI | `life-scale.com` + `www.life-scale.com` |
| Dev API | `api-dev.life-scale.com` |
| Prod API | `api.life-scale.com` |
| ACM | `arn:aws:acm:us-east-1:133954050840:certificate/154ac7f1-fd0c-4077-b7e7-136e0c56473d` |
| DNS | External (no Route53) — CNAME UI → CloudFront, API → API Gateway |
| Postgres | Shared estrelar-infra RDS; DBs `iq_scale_dev` / `iq_scale` |
| RDS secret | `estrelar/rds/postgres` (host/creds; DB name set per stage on Lambda) |
| API compute | Lambda zip + API Gateway HTTP API (serverless; no Docker) |

## Auth

Email/password via Cognito only (no Google/Apple, no Supabase).

## Frontend env

- `VITE_API_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_REGION`
- `VITE_PUBLIC_POSTHOG_*`

## Deploy scripts (root)

- `npm run deploy:web:dev` / `deploy:web:prod`
- `npm run deploy:api:dev` / `deploy:api:prod`
- `npm run deploy:dev` / `deploy:prod` (CDK + SST)
