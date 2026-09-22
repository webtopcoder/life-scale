# Guest account: underwriting@life-scale.com (production)

Create a fully-provisioned demo account in production with access to every category, every scale report, and all add-ons already owned.

## What the account gets

- Cognito user in the production pool, auto-confirmed (no verification email), password `Underwriting123!!!`
- Profile on the `complete` tier (all categories: Mind + Body), trial already used
- Completed tests with realistic report payloads for all six live scales:
  - Mind: IQ, Brain Health, Hidden Genius
  - Body: Body IQ, Sleep Health, Hidden Athlete
- Active purchases for: the subscription, the three funnel upsells (weakness report, genius blueprint, brain coach), and all 30 `addon_*` products
- Report-seen timestamps set so dashboards open in their normal post-report state

## Technical work

1. Extend `api/scripts/seed-test-user.ts`:
   - Add payload builders for `body`, `sleep-health`, `hidden-athlete` matching the shapes the live engines/report shells read (domain arrays, axis scores, archetype keys) — modelled on `src/engine/bodyScoring.ts`, the sleep-health and hidden-athlete quizzes and report copy.
   - Seed all six `test_completions` rows instead of three.
   - Add a `SEED_TEST_USER_INCLUDE_ADDONS` mode that inserts active purchases for every `addon_*` key (the 30 keys in `src/lib/addons.ts`), rather than deleting them.
   - Keep the script idempotent (re-running refreshes rather than duplicates).
2. Add an npm script for the "full guest" variant (email, password, upsells + add-ons all on).
3. Run it against production: production Cognito pool ID/region + production `DATABASE_URL`.
4. Verify by signing in on the live site: main dashboard shows both categories unlocked, each of the six reports renders, and the Add-Ons surfaces show the products as owned (no purchase prompts).

Add-on documents themselves are generated on first open from the stored quiz payload, so no pre-generated report rows are needed.

## Note

Production credentials for the prod Cognito pool and prod `DATABASE_URL` must be available to the run. If the environment only has dev credentials configured, I will need those production values before step 3 can execute.
