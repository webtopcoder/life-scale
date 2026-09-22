# Brainwave CDK

Deploys Cognito + NestJS API (Lambda zip + HTTP API) for `dev` and `prod`.

Reuses Postgres from `estrelar-infra` via Secrets Manager secret `estrelar/rds/postgres`.
Databases: `iq_scale_dev` (dev) and `iq_scale` (prod). DNS is managed externally (no Route53).

## Domains

| Stage | API hostname | ACM |
|-------|----------------|-----|
| dev | `api-dev.life-scale.com` | `154ac7f1-fd0c-4077-b7e7-136e0c56473d` |
| prod | `api.life-scale.com` | same |

Point CNAMEs at the stack `ApiCustomDomainTarget` output (API Gateway regional domain).

## Deploy

From repo root (Node 22; **no Docker**). Uses AWS profile `estrelar` locally. Packaging builds a pruned zip into `api/.lambda-package` first:

```bash
npm run cdk:deploy:dev
npm run cdk:deploy:prod
```

CI uses the GitHub OIDC role (`github-oidc-cp-role`) — no profile.

Or explicitly:

```bash
npm run api:package:lambda
AWS_PROFILE=estrelar npm --prefix infra/cdk run deploy:dev
```

## App secrets (`brainwave/api/{stage}`)

**Why secrets kept resetting to `REPLACE_ME`:** the stack declared `secretObjectValue` on `AWS::SecretsManager::Secret`. Every `cdk deploy` re-applied that JSON. [`bin/brainwave.ts`](bin/brainwave.ts) loads `api/.env` at synth; any missing key used the fallback `REPLACE_ME`, and CloudFormation **overwrote** whatever you had set in the console.

**Current behavior:** CDK still owns the Secret *resource* (name + IAM grants for Lambda), but **`SecretString` is removed from the template** via `PropertyDeletionOverride`. Deploys no longer change secret values.

Update secrets out-of-band (Console, or):

```bash
AWS_PROFILE=estrelar aws secretsmanager put-secret-value \
  --secret-id brainwave/api/dev \
  --secret-string file://path/to/secrets.json
```

Keep `api/.env` in sync for local Nest. After changing SM, wait for a Lambda cold start (or republish the function) so `loadRuntimeSecrets()` reloads.

### Life-Scale partner host (`LIFESCALE_API_BASE_URL`)

| Secret | Value |
|--------|-------|
| `brainwave/api/dev` | `https://sirius.bigdog.app` |
| `brainwave/api/prod` | `https://sirius.bigdog.app` |

Widget traffic uses the SPA `VITE_LIFESCALE_API_BASE_URL` (SST / GitHub Actions), not this secret. Nest uses SM for cancel / access / server-to-server upsell (`LIFESCALE_API_KEY` as `X-API-Key`).

### Frontend SST / GitHub Actions

Set repository environment **variable** `VITE_LIFESCALE_API_BASE_URL` (already passed in `deploy-sst-dev.yml` / `deploy-sst-prod.yml`):

| GitHub environment | Value |
|--------------------|-------|
| `dev` | `https://sirius.bigdog.app` |
| `prod` | `https://sirius.bigdog.app` |

`sst.config.ts` defaults to Sirius for every stage if the variable is unset.

## Life-Scale webhook

- Dev: `https://api-dev.life-scale.com/api/billing/webhooks/lifescale`
- Prod: `https://api.life-scale.com/api/billing/webhooks/lifescale`

## Notes

- Lambda stays **out of the VPC** (RDS is publicly accessible).
- HTTP API integration timeout is **30s** (affects long AI streams).
- Zip is pruned (Prisma CLI / unused query compilers removed) to stay under the 250MB Lambda limit.
