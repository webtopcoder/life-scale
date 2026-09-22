# Brainwave NestJS API

REST API for `brainwave-booster-47` (NestJS + Prisma + Cognito).

## Stack

- NestJS + Prisma 7 + Postgres (shared estrelar-infra RDS; DBs `iq_scale_dev` / `iq_scale`)
- Deployed as **AWS Lambda (zip) + API Gateway HTTP API** (serverless)
- Cognito JWT auth (email/password only; custom UI on the SPA)
- Breeze billing, OpenRouter AI, Klaviyo, SendGrid, Zendesk, Partner API

## Domains

| Stage | API |
|-------|-----|
| dev | `https://api-dev.life-scale.com` |
| prod | `https://api.life-scale.com` |

DNS is external (CNAME → API Gateway regional domain). ACM: `154ac7f1-fd0c-4077-b7e7-136e0c56473d`.

## Local development

```bash
cd api
cp .env.example .env   # set DATABASE_URL to .../iq_scale_dev?sslmode=require
npm install
npx prisma migrate deploy
npm run start:dev
```

Health: `GET http://localhost:3001/health`  
API prefix: `/api/*`

Dev auth bypass (no Cognito): `Authorization: Bearer dev:<userId>`

## Deploy

From repo root (Node 22 only — **no Docker**). `cdk:deploy:*` packages the Lambda zip, then deploys with AWS profile `estrelar`. CI uses the OIDC role instead.

```bash
npm run deploy:api:dev
npm run deploy:api:prod
```

`npm run package:lambda` builds a pruned staging dir at `.lambda-package/` (fails if ≥ 240MB).

Point Breeze webhooks to:

- Dev: `https://api-dev.life-scale.com/api/billing/webhooks/breeze`
- Prod: `https://api.life-scale.com/api/billing/webhooks/breeze`
