# Content seed data

CSV snapshots of catalog tables from the Supabase backup (`brainwave-booster-47_260726.backup`).

| File | Rows |
|------|------|
| `onboarding_flows.csv` | 9 |
| `onboarding_questions.csv` | 328 |
| `achievements.csv` | 35 |
| `brain_teasers.csv` | 60 |
| `lessons.csv` | 60 |
| `puzzles.csv` | 100 |

Booleans use Postgres `t`/`f`. Nulls are empty fields. `puzzles.branches` uses Postgres array literals (`{iq}`, `{iq,hidden_genius}`). JSON columns are JSON strings.

Seed with:

```bash
cd api
npm run db:seed
```

## Complete-tier test user (Cognito + DB)

Creates an **auto-confirmed** Cognito user (no verification email) and seeds:

- `profiles`: `subscription_tier=complete`, `entitled_branch=null`, report-seen timestamps set
- `user_purchases`: `iq_subscription` / `active`
- `test_completions`: `iq`, `brain-health`, `hidden-genius` with report-ready payloads

By default, funnel upsells and `addon_*` purchases are cleared. To **grant** the three funnel upsells (`weakness_report`, `genius_blueprint`, `brain_coach`):

```bash
# From repo root (uses AWS_PROFILE=estrelar)
npm run api:seed:test-user:upsells
# equivalent: SEED_TEST_USER_INCLUDE_UPSELLS=1 npm run api:seed:test-user
```

Without upsells (e2e default):

```bash
npm run api:seed:test-user
```

Defaults (override with env):

| Env | Default |
|-----|---------|
| `SEED_TEST_USER_EMAIL` | `e2e-complete@life-scale.test` |
| `SEED_TEST_USER_PASSWORD` | `TestUser123!` |
| `SEED_TEST_USER_INCLUDE_UPSELLS` | unset (clear upsells) — set `1` / `true` to grant |

Requires `COGNITO_USER_POOL_ID`, `COGNITO_REGION`, and `DATABASE_URL` in `api/.env` (or the environment).

This is separate from the catalog CSV seed above.
