# Rebuild the public website around the multi-scale brand

The Body category exists in code (quizzes, scoring, reports, dashboards, add-ons) but the website itself was never re-done. The homepage, test picker, and main dashboard still hardcode the original three Mind tests. This plan replaces that hardcoded copy with the scale registry and repositions IQ Scale as "we give you the IQ of You" — one brand, many scales, grouped into categories.

## What changes for a visitor

Homepage
- Hero: reframe from "Test how your brain works" to the platform promise — measure the IQ of any part of your life. Sub-copy points at Mind and Body being live, more categories coming.
- New Categories section (replaces "One goal, three tests"): a row of category cards — Mind (live), Body (live), Money / People / Work (coming soon, muted, no CTA). Each live category expands into its three scales: Core test (scored), Health screen, Hidden-strengths profiler.
- Each scale tile is generated from the registry: name, tagline, bullets, orb, accent, status. No more per-test copy blocks in the page.
- "Turn your results into real gains" growth-plan card: driven by the live scales instead of the fixed three Mind rows, and worded so it applies to any category.
- Method steps and "What's in your report" copy generalized away from "brain"/"thinking skills" to "the scale you take".
- FAQ rewritten: what IQ Scale is (a family of score-based scales), what a category is, which are live now, plus the existing length / not-medical / cancellation answers.
- Footer + section anchors updated so the burger menu still scrolls correctly to the new Categories section.

Funnel
- `/choose-test` becomes a two-level picker on one screen: pick category (Mind / Body; coming-soon ones shown disabled), then pick the scale within it. Cards come from the registry, so the Body three appear automatically.
- The selected scale is stored in funnel state and continues through the existing auth-gate → tier → trial → start path unchanged. Pricing and trial offers are untouched.

Main dashboard
- `/main-dashboard` groups scale cards under category headings (Mind, Body) instead of a flat three-card row, still driven by entitlements and completions. Coming-soon categories render as a single muted "coming soon" strip.
- Locked / take-test / open states and the `/upgrade/:scale` route behavior stay as they are.

Everything not mentioned — reports, scoring, add-ons, legal pages, billing copy — stays as is.

## Technical notes

- `src/config/scales.ts` becomes the single source for all marketing and funnel copy. Any tagline/blurb/bullet edits needed for the website land there, not in page files.
- Add registry helpers: `liveCategories()`, `scalesForCategory(key)`, `coreScale(category)` so pages never filter by hand.
- `src/components/marketing/BranchesSection.tsx` is replaced by `CategoriesSection.tsx` (registry-driven, renders category groups + scale tiles). `BranchOrb` gains the Body-category orb keys already added.
- `ChooseTestPage.tsx` and `MainDashboardPage.tsx` drop their local `TESTS` / `CARDS` arrays and map over the registry; `SelectedTest` widens to `ScaleKey`.
- `LandingPage.tsx` keeps its layout/styling system (`iq-*` tokens, serif headings, emerald accent) — only content sources and the categories block change. No new color values.
- Section id `framework` is kept as the anchor id for the new Categories section so `scrollToSection` and the header menu keep working; menu label updated to "Categories".
- Typecheck after the edits; smoke-check `/`, `/choose-test`, and `/main-dashboard` in the browser at mobile and desktop widths.
