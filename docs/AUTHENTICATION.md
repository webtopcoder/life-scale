# Authentication

Auth is **Amazon Cognito** (email/password + Google OAuth). The NestJS API validates Cognito JWTs; the React app uses Amplify Auth and sends `Authorization: Bearer <access_token>` to the API.

## Flow

1. User signs up / signs in via `cognitoAuth` (`src/integrations/api/cognitoAuth.ts`) — email/password or `signInWithRedirect` (Google).
2. `AuthContext` holds the current user and session token.
3. `setApiAccessTokenGetter` wires the access token into `api` (`src/integrations/api/client.ts`).
4. Protected Nest routes use the Cognito JWT guard; first API use can ensure a `profiles` row.

## Google sign-in

Cognito Hosted UI + Google identity provider (CDK). Flow: SPA → Cognito → Google → Cognito `/oauth2/idpresponse` → SPA callback → Amplify exchanges code for tokens.

| Stage | Cognito domain |
|-------|----------------|
| dev | `brainwave-dev.auth.us-east-1.amazoncognito.com` |
| prod | `brainwave-prod.auth.us-east-1.amazoncognito.com` |

Google OAuth credentials are stored in Secrets Manager (not Vite):

- `brainwave/cognito/dev/google` — JSON `{ "clientId": "...", "clientSecret": "..." }`
- `brainwave/cognito/prod/google` — same shape

Create before first Auth CDK deploy, e.g.:

```bash
aws secretsmanager create-secret \
  --profile estrelar --region us-east-1 \
  --name brainwave/cognito/dev/google \
  --secret-string '{"clientId":"...","clientSecret":"..."}'
```

Google Console authorized redirect URI:

`https://brainwave-dev.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

(and the prod domain equivalent).

## Frontend env

| Variable | Purpose |
|----------|---------|
| `VITE_COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `VITE_COGNITO_CLIENT_ID` | App client ID |
| `VITE_COGNITO_DOMAIN` | Hosted UI domain host (no scheme), e.g. `brainwave-dev.auth.us-east-1.amazoncognito.com` |
| `VITE_COGNITO_REGION` | AWS region (e.g. `us-east-1`) |
| `VITE_API_URL` | Nest API base (e.g. `https://api-dev.life-scale.com`) |

Also set `VITE_COGNITO_DOMAIN` in GitHub Actions secrets for SST deploy workflows.

## Key files

- `src/integrations/api/cognitoAuth.ts` — Amplify configure, signUp/signIn/Google redirect/signOut/reset
- `src/context/AuthContext.tsx` — React auth state
- `src/pages/funnel/AuthGatePage.tsx` — email/password + Continue with Google
- `api/src/auth/` — Nest JWT validation / guards
- `infra/cdk/lib/auth-stack.ts` — Cognito pool, domain, Google IdP, OAuth client (CDK)
