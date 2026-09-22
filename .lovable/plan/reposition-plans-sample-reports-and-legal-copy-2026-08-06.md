# Reposition plans, sample reports, and legal copy

Three copy/UX updates so the site matches the multi-scale "IQ of You" positioning: Complete = every scale plus a 24/7 personalized AI coach, a sample report that lets you browse a sample per live scale, and legal/FAQ text that stops describing the product as "three brain tests".

## 1. Plan copy

Complete is currently described as "Everything, all three tests" / "Reports from all 3 tests". Reposition it across every surface that shows tiers:

- **Complete** — scope line: "Every scale, every category". Benefits: reports from every live scale (Mind and Body today, new categories added as they launch), a dashboard for each, and a personalized AI coach trained on your results, available 24/7.
- **Guide** — one scale, full report and dashboard, plus a static coaching kit (unchanged in substance, wording aligned to "scale" instead of "test/branch").
- **Insight** — one scale, full report and dashboard, no coach.

Surfaces to update: landing page pricing cards, the in-app tier chooser (including the "Upgrade to Complete" panel and its branch-picker copy), and the trial-offer page where tier names appear. Terminology moves from "branch/test" to "scale/category" wherever the tiers are described.

Note: this is a copy and positioning change. The entitlement plumbing (which scales a plan unlocks) is not being rewired in this pass — say so if you want that too.

## 2. Sample report with a picker

The current `/sample` page is a single fixed walkthrough of IQ, Brain Health, and Hidden Genius for one made-up person. Rework it into a chooser:

- A category tab row (Mind, Body live; Money, People, Work shown as disabled "Coming soon").
- Inside the selected category, a scale selector for its three scales (core, health, hidden).
- Each live scale renders its own sample: a representative result visual, area breakdown or archetype card, a few sample insight paragraphs in that scale's voice, and a "what the full report adds" note.
- Coming-soon categories render a single placeholder panel: category name, one-line description of what it will measure, "Coming soon", and no CTA into a flow.
- Scale accents come from the registry so each sample is themed correctly (Mind blues, Body teal/indigo/red).
- The bottom CTA stays: start a test / see plans.

Sample content is fictional and clearly labelled as an example, with no real scores implied.

## 3. FAQ, legal, and help copy

- **Landing FAQ**: keep the category framing, add/adjust entries so plan differences reflect the new Complete definition (every scale + 24/7 personalized AI coach) and remove any "three tests" framing.
- **Help center FAQ**: rewrite the plan-comparison answer to the new tier definitions; sweep other answers for "branch"/"three tests" language.
- **Terms**: replace the add-on clause naming "(IQ, Brain Health, or Hidden Genius)" with scale-neutral wording ("the relevant scale"), and align subscription-scope language with the tier definitions. Pricing figures stay as they are.
- **Privacy / Cookies / Refund**: sweep for "branch"/"three tests" phrasing and any plan-scope descriptions that contradict the new Complete definition. Company entity, billing descriptor, and refund terms stay unchanged.

## Technical notes

- Files touched: `src/pages/LandingPage.tsx`, `src/pages/funnel/ChooseTierPage.tsx`, `src/pages/funnel/TrialOfferPage.tsx`, `src/pages/SampleReportPage.tsx` (rewritten around the registry, with per-scale sample data extracted to a data module), `src/pages/HelpPage.tsx`, `src/pages/TermsPage.tsx`, plus small sweeps in the other legal pages.
- New sample data lives in one file keyed by `ScaleKey`, so adding a scale to `src/config/scales.ts` plus one entry there adds a sample.
- Category tabs and coming-soon placeholders are driven by `CATEGORIES` / `scalesInCategory` and each scale's `status`, so nothing is hardcoded.
- No schema, entitlement, or pricing-amount changes.
