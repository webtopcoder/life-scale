# API and database

## API

NestJS app under `api/`, deployed as a Lambda behind HTTP API.

- Base URL (prod): `https://api.life-scale.com/api`
- Base URL (dev): `https://api-dev.life-scale.com/api`
- Auth: Cognito access token (`Authorization: Bearer …`)
- Frontend client: `src/integrations/api/client.ts`

Major modules: `auth`, `dashboard`, `billing`, `breeze`, `ai`, `partner`, `support`.

## Database

PostgreSQL via **Prisma 7** (`api/prisma/`, generated client under `api/src/generated/prisma`).

- Dev DB: `iq_scale_dev`
- Prod DB: `iq_scale`

Migrations: `npm run migrate:deploy` (see root `package.json`).

## AI / learning paths

`POST /api/ai/generate-learning-path` (and related AI routes) run on Nest — not third-party edge functions.

## Partner API

See [PARTNER_API.md](./PARTNER_API.md).
