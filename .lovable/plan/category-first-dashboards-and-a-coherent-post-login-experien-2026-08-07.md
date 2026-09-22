# Category-first dashboards and a coherent post-login experience

Short answer to the question: **no, the hierarchy was not re-done.** `/main-dashboard` (`src/pages/funnel/MainDashboardPage.tsx:124-193`) still renders one flat grid of all six tests, grouped only by a category heading. Entitlement is still per single test — `entitledBranch` on the profile holds one scale key, and `entitledFromTier` (`src/lib/entitlements.ts:16-20`) unlocks exactly that one test unless the tier is Complete. So an Insight/Guide/Focus buyer sees 1 unlocked tile and 5 grey padlocks, which does not match how the plans read ("one scale").

This plan makes the **category** the unit the user buys and navigates.

## The new hierarchy

```text
/main-dashboard          Pick a category      Mind IQ | Body IQ | (Money/People/Work soon)
  /dash/mind             Category hub          IQ Test, Brain Health, Hidden Genius
    /iq-dash             Scale dashboard        challenge, tasks, library, add-ons
    /iq-report           Scale report
```

One plan = one category = all three tests inside it. Complete = every category.

## What the user experiences after logging in

1. **Land on `/main-dashboard`.** Two big category cards (Mind, Body) plus a coming-soon row. Each card shows plan status ("Included in your plan" / "Locked"), how many of its three tests are done, and one clear next action.
2. **No plan yet** — a single banner card at the top: "Choose a plan to unlock a category" leading to `/choose-tier`. Locked category cards route to `/upgrade/:category`.
3. **Open your category hub** (`/dash/mind`). Header with the category name, overall progress across its three tests, and three test rows in fixed order: Core test, Health screen, Hidden strengths. Each row is in one of three states — Not started (Start test), Ready (Open dashboard / View report), or Locked (only when the whole category is not owned; siblings inside an owned category are never locked).
4. **Below the tests**: the AI Coach card (unlocked on Focus and Complete, scoped to the owned category) and the Add-Ons rail filtered to tests completed in that category.
5. **Inside a test** the current scale dashboard and report are unchanged.
6. **Trying to reach another category** ("Body IQ" while on a Mind plan) gives the existing straight upgrade to Complete.

## Technical changes

**Entitlement becomes category-shaped, with no migration.** The `entitledBranch` column keeps storing a scale key; entitlement expands from it to that scale's whole category.

- `src/lib/entitlements.ts`: add `entitledCategories: Set<CategoryKey>`; `entitledFromTier` maps the stored branch through `getScale(branch).category` and returns every live scale in that category. Complete still returns all scales. `entitledBranches` keeps working, so `BranchGate` and every dashboard need no change.
- `src/config/scales.ts`: add `categoryFromScale()` and `scalesInLiveCategories()` helpers.

**Main dashboard becomes a category picker.**
- Rewrite `MainDashboardPage.tsx` to render one card per live category (owned / locked, "2 of 3 tests taken"), linking to `/dash/:category`. The all-add-ons section stays at the bottom.

**New category hub.**
- `src/pages/funnel/CategoryHubPage.tsx` — reads the category from the route, lists `scalesInCategory()` with per-test state from `listCompletions`, plus the coach card and category-scoped add-ons.
- `src/App.tsx`: add `/dash/:category` behind `ProtectedRoute`, add it to `HEADERLESS_FUNNEL_ROUTES`, and add `/upgrade/:category` handling. Keep existing `/upgrade/:branch` working.
- New `CategoryGate` (thin wrapper over the entitlement read) for the hub route.

**Funnel copy and selection switch to categories.**
- `src/pages/funnel/ChooseTestPage.tsx`: selecting a test still starts the funnel, but the sub-copy becomes "Your plan unlocks all three tests in that category."
- `src/pages/funnel/ChooseTierPage.tsx`: the mid-flow picker asks "Which category do you want?" and shows Mind / Body cards (each listing its three tests) instead of six scale cards. It stores the category's core scale in `entitledBranch`, which the new entitlement logic expands.
- `src/pages/funnel/TrialOfferPage.tsx`: benefit lines read "all three tests in your category".

**Copy sweep for the one-scale-equals-one-test wording.**
- `LandingPage.tsx` plan cards, `ChooseTierPage.tsx` tier benefits, `HelpPage.tsx`, `TermsPage.tsx`: "Full report from 1 scale" becomes "All three tests in one category", and Complete stays "every category".

**Deliverable diagram.**
- Save the post-login flow as a Mermaid diagram to `/mnt/documents/Post_Login_UX_Hierarchy.mmd` and surface it as an artifact.

## Verification

- Type check across app and API.
- Playwright: log in, confirm `/main-dashboard` shows two category cards; open `/dash/mind` and confirm three test rows with correct states; confirm a single-category user sees no padlocks inside their own category and a lock on the other category.
- Grep sweep for remaining "1 scale" plan copy and any `entitledBranches.size === 1` assumptions.
