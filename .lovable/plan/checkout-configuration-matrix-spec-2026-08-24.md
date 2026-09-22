# Checkout configuration matrix (spec)

Reference spec for the homepage onboarding funnel checkouts. No code changes are proposed here — this locks the numbers so widgets can be built against them.

## What the user configures

1. **Tier** — Complete, Focus, Guide, Insight.
2. **Category** — Focus/Guide/Insight only: Mind or Body (each covers all three tests inside it). Complete skips this step. No price effect.
3. **Trial length** — 3, 7, 14, 28, or 84 days.

Total: 20 checkout configurations (4 tiers x 5 trial lengths).

## Pricing rules

- 3-day trial: $1.00 for every tier.
- 7-day trial: existing per-tier intro prices.
- 14-day trial: 55% of the 28-day price.
- 28-day trial: full monthly tier price.
- 84-day trial: 2x the 28-day price.
- Rebill is always **monthly at the tier price**, starting when the trial ends — including the 84-day trial.

## The 20 configurations

| # | Tier | Due Today | Trial Length | Rebill Amount |
|---|---|---|---|---|
| 1 | Complete | $1.00 | 3 days | $38.99/mo |
| 2 | Complete | $10.00 | 7 days | $38.99/mo |
| 3 | Complete | $21.44 | 14 days | $38.99/mo |
| 4 | Complete | $38.99 | 28 days | $38.99/mo |
| 5 | Complete | $77.98 | 84 days | $38.99/mo |
| 6 | Focus | $1.00 | 3 days | $28.99/mo |
| 7 | Focus | $8.00 | 7 days | $28.99/mo |
| 8 | Focus | $15.94 | 14 days | $28.99/mo |
| 9 | Focus | $28.99 | 28 days | $28.99/mo |
| 10 | Focus | $57.98 | 84 days | $28.99/mo |
| 11 | Guide | $1.00 | 3 days | $13.99/mo |
| 12 | Guide | $4.00 | 7 days | $13.99/mo |
| 13 | Guide | $7.69 | 14 days | $13.99/mo |
| 14 | Guide | $13.99 | 28 days | $13.99/mo |
| 15 | Guide | $27.98 | 84 days | $13.99/mo |
| 16 | Insight | $1.00 | 3 days | $7.99/mo |
| 17 | Insight | $2.00 | 7 days | $7.99/mo |
| 18 | Insight | $4.39 | 14 days | $7.99/mo |
| 19 | Insight | $7.99 | 28 days | $7.99/mo |
| 20 | Insight | $15.98 | 84 days | $7.99/mo |

## Scope note

Complete grants access to all categories (no `entitledBranch`). Focus/Guide/Insight grant one category, resolved to that category's core scale key. The homepage funnel currently charges nothing — tier selection grants entitlement through a `PATCH /dashboard/profile` stub — so wiring real payment widgets is separate work not covered by this spec.
