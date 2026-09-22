# Add a $30 single-scale plan with the 24/7 AI Coach

A fourth recurring plan sits between Guide ($14) and Complete ($40): everything Complete gives you, but limited to one scale of your choice — including the personalized AI coach, 24/7.

Name: **Focus** — $30/mo.

Plan lineup after this change:

```text
Insight  $8   one scale, report + dashboard
Guide    $14  one scale, + static coaching kit
Focus    $30  one scale, + personalized AI coach 24/7   <-- new
Complete $40  every scale, every category, + AI coach 24/7
```

## What the user sees

- **Homepage pricing section**: four plan cards (Complete stays "Most popular"). Grid becomes 2-up on tablet, 4-up on desktop so the cards stay readable.
- **Onboarding flow (/choose-tier)**: Focus appears as a fourth option. Like Insight and Guide, picking it asks which scale to unlock, then continues.
- **Trial offer page**: Focus gets its own trial ladder ($1 for 3 days, $8 for 1 week, $30 for 1 month) and renews at $30/month.
- **AI Coach**: unlocked for Focus users, scoped to their one entitled scale. Coach card in the dashboard no longer shows a "Complete only" lock for them.
- **Upgrade path**: a Focus user clicking a locked scale still gets the existing straight upgrade to Complete.
- **Copy**: homepage FAQ, Help Center FAQ, Terms and Refund Policy updated so the plan list and renewal prices read "$8.00, $14.00, $30.00, or $40.00".

## Technical changes

**Tier model**
- `src/lib/funnelState.ts`: add `'focus'` to `SelectedTier`.
- `src/lib/entitlements.ts`: `normalizeTier` accepts `focus`; `entitledFromTier` treats `focus` like Insight/Guide (single entitled branch).

**Funnel**
- `src/pages/funnel/ChooseTierPage.tsx`: add the Focus tier object (icon, tagline, benefits incl. "A personalized AI coach trained on your results, 24/7"); it routes into the existing branch-picker path, not the immediate-grant path used by Complete.
- `src/pages/funnel/TrialOfferPage.tsx`: add `focus: 30` to `TIER_RENEWAL` and a `focus` entry to `TIER_TRIALS`.

**Marketing**
- `src/pages/LandingPage.tsx`: add the Focus card to the plans array; change the plans grid to `sm:grid-cols-2 lg:grid-cols-4` and drop the `items-end` / negative-margin featured offset that only works in a 3-up row. Update the plan-comparison FAQ answer.

**AI Coach access**
- `api/src/ai/ai.controller.ts` (`coach/chat`): allow `complete` and `focus`. For `focus`, restrict the injected context to the user's `entitledBranch` completion and adjust the forbidden message.
- `src/pages/CoachPage.tsx` and `src/components/dashboard/MyCoachCard.tsx`: access check becomes `tier === 'complete' || tier === 'focus'`; the coach card's locked-state copy stops saying "Complete only" and instead points to the cheapest coach-enabled plan.

**Legal / support copy**
- `src/pages/TermsPage.tsx`, `src/pages/RefundPolicyPage.tsx`, `src/pages/HelpPage.tsx`: renewal price lists and "three recurring plans" / "Insight, Guide, or Complete" phrasing updated to include Focus, plus the Help Center answers about plan comparison, renewal price, upgrades, and Coach availability.

No database migration is needed — `subscriptionTier` is a string column and `entitledBranch` already carries the single-scale entitlement.

## End-to-end coverage checklist

Every place tier is read or priced, and what happens to it:

| Surface | Change |
| --- | --- |
| `src/lib/funnelState.ts` | `'focus'` added to `SelectedTier` |
| `src/lib/entitlements.ts` | `normalizeTier` accepts it; single-branch entitlement |
| `src/pages/LandingPage.tsx` | 4th plan card, 4-up grid, FAQ answer |
| `src/pages/funnel/ChooseTierPage.tsx` | 4th tier in homepage funnel and `/upgrade/:branch` mode; 4-up grid |
| `src/pages/funnel/TrialOfferPage.tsx` | `focus` trial ladder + $30 renewal line |
| `src/pages/CoachPage.tsx` | coach unlocked |
| `src/components/dashboard/MyCoachCard.tsx` | unlocked + locked-state copy |
| `api/src/ai/ai.controller.ts` | server-side gate + scale-scoped context |
| `src/pages/TermsPage.tsx` | plan count + renewal prices |
| `src/pages/RefundPolicyPage.tsx` | renewal prices |
| `src/pages/HelpPage.tsx` | 4 FAQ/dispute answers |

Deliberately unchanged, and why:
- `api/src/billing/billing.service.ts` still provisions `insight` for the legacy checkout path — that flow sells the old IQ-only product and has no Focus SKU.
- Add-on pricing (`src/lib/addons.ts`, `upsellPricing.ts`) is tier-independent; its `tier` field is a card style, not a plan.
- `BranchGate` / `ScaleDashboard` read `entitledBranches` from entitlements, so they gate Focus correctly with no edit.
- The locked-scale upgrade offer stays "upgrade to Complete" — Focus is single-scale by definition.

## Verification

- Type check (`tsgo`) across app and API.
- Playwright: homepage shows four plan cards including $30 Focus; `/choose-tier` shows four tiers and Focus opens the scale picker; trial page shows the $30/month renewal line.
- Grep sweep for any remaining "three recurring plans", "$8, $14, or $40", or `=== 'complete'` tier check that should now include Focus.

