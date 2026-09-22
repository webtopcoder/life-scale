# Life Scale (brainwave-booster-47)

React + Vite frontend and NestJS API for [life-scale.com](https://life-scale.com).

## Stack

- **Frontend:** Vite, React, TypeScript, Tailwind, SST (CloudFront)
- **API:** NestJS on AWS Lambda + HTTP API
- **Auth:** Amazon Cognito (email/password)
- **DB:** PostgreSQL (Prisma 7) — `iq_scale_dev` / `iq_scale`

## Local development

```sh
# Frontend (root)
npm i
npm run dev

# API
cd api && npm i && npm run start:dev
```

Copy `.env` / `api/.env` from your team secrets. Frontend expects:

- `VITE_API_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_DOMAIN` (Hosted UI host, e.g. `brainwave-dev.auth.us-east-1.amazoncognito.com`)
- `VITE_COGNITO_REGION`

## Deploy

```sh
# API (CDK + Lambda zip), profile estrelar
npm run deploy:api:dev   # or deploy:api:prod

# Web (SST)
npm run deploy:web:dev   # or deploy:web:prod
```

See `docs/` for partner API, auth, and deployment notes.
