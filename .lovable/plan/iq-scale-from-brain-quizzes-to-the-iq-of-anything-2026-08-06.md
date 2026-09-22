# IQ Scale: from brain quizzes to "the IQ of anything"

## The idea

IQ Scale stops meaning "intelligence test" and starts meaning **Intelligence Quotient of anything** — every part of your life gets measured, scored, and coached on one scale.

- Brand line: **"We give you the IQ of You."**
- Sub-line: **"Any part of your life, scored on one scale."**
- Naming system: every assessment is a **Scale**, named `<Domain> IQ` — Money IQ, Sleep IQ, Love IQ, Career IQ.
- The current three stay as the flagship **Mind** category (IQ Test, Brain Health, Hidden Genius) — names unchanged, now grouped under a category header.

## Categories (housing structure)

Each category follows the **same three-scale format as Mind**: one core scored test, plus two companions — a health/risk screen and a hidden-strengths profiler.

| Category | Core test | Health screen | Hidden-strengths |
|---|---|---|---|
| Mind (live) | IQ Test | Brain Health | Hidden Genius |
| Body (new) | Body IQ | Sleep Health | Hidden Athlete |
| Money, People, Work | later | later | later |

Homepage shows categories, not just three orbs. Adding a scale later = adding a config entry, not new pages.

## What gets built

### 1. Scale registry (the extensibility layer)
A single config file describes every scale: key, display name, category, role (`core` / `health` / `hidden`), tagline, color/accent, icon, quiz source, report route, dashboard route, pricing tier eligibility, status (`live` / `coming-soon`).

Everything currently hardcoded to `'iq' | 'brain-health' | 'hidden-genius'` reads from the registry instead:
- test selection, tier selection, trial offer, upgrade flows
- entitlements and completions
- main dashboard tiles
- add-on/upsell targeting
- challenge/XP engine

Legacy branch keys keep working, so nothing existing breaks.

### 2. Copy pass across the site
Rewrite to the broader brand: hero, branches section, pricing scope lines, FAQ, Help, footer, meta title/description, and any "three tests" language ("your scales", with Mind and Body as the open categories). Legal pages get terminology alignment only — no policy changes.

### 3. The Body category, end to end

**Body IQ (core)** — mirrors the IQ Test's role: a single headline score on the 100-mean / 15-SD scale covering general health and wellbeing. Sub-scores across domains (energy, movement, nutrition, recovery, resilience, vitals awareness, stress load). Report shows the score, distribution position, ranking, strongest and weakest domains, and a certificate — same structure as the IQ report.

**Sleep Health** — mirrors Brain Health: no headline score, a domain-status screen (Strong / Stable / Needs Attention / Priority Area) across sleep duration, latency, continuity, timing/rhythm, environment, stimulants, daytime function. Produces a risk-style index, top-3 priority areas, and an age baseline comparison, matching `brainHealthScoring.ts` conventions.

**Hidden Athlete** — mirrors Hidden Genius: archetype-based, no score shown. Likert self-report blended with projective/forced-choice items using the same zero-sum directional vectors and 70/30 blend, producing 8 body archetypes (e.g. Endurance Engine, Explosive Spark, Recovery Specialist), a composite identity synthesis, and evidence-backed non-literal conclusions.

Each of the three ships with: intro screen, ~20-question flow on the existing quiz engine, scoring module in `src/engine/`, a ~1,470-word report following the existing report structure and add-on placement rules, a branch dashboard using the 3-phase practice arc (Foundations / Build / Mastery) with daily tasks and percentage completion, funnel entry, and a main-dashboard tile.

Five add-ons per Body scale in the existing $1–$5 band, generated from the user's own answers, with token-based personalized headlines.


## Technical notes

- New `src/config/scales.ts` as the single source of truth; `Branch` becomes `ScaleKey` derived from it (alias retained).
- `entitlements.ts`, `testCompletions.ts`, `funnelState.ts`, `upsellOffers.ts`, and the challenge libs get parameterized by scale key instead of switch statements.
- New scales need `test_completions` / entitlement rows to accept their keys; a migration widens the allowed values and adds category metadata. Grants and RLS follow existing table patterns.
- Quiz data lives beside `hiddenGeniusQuiz.ts` / `brainHealthQuiz.ts`; scoring modules mirror `scoringEngine.ts` (Body IQ), `brainHealthScoring.ts` (Sleep Health), and `hiddenGeniusScoring.ts` (Hidden Athlete). Report copy modules follow `src/engine/reportCopy/` conventions and reuse the leak-safe copy builders (no option names or quoted prompts in reports).
- New routes follow existing naming: `/body-start`, `/sleep-start`, `/ha-start`, `/body-dash`, `/sleep-dash`, `/ha-dash`, plus matching report routes and preview routes.
- Pricing model unchanged: Insight / Guide / Complete, with Complete now meaning "all scales".

## Out of scope

Money, People, and Work categories ship as "coming soon" cards only. No changes to billing, auth, or refund/legal policy terms.
