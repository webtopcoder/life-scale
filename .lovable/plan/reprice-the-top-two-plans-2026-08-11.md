# Reprice the top two plans

Complete becomes **$38.99/mo** and Focus becomes **$28.99/mo**. Guide ($14) and Insight ($8) stay unchanged. Homepage plan cards keep their big round numbers: **$29** and **$39**.

## What changes

1. **Central pricing source** (`src/content/legalCopy.ts`)
   - `TIER_MONTHLY_USD`: complete `38.99`, focus `28.99`.
   - `monthlyPriceList()` / `renewalTerms*()` formatting updated so amounts render as `$8, $14, $28.99 or $38.99` (two decimals only where needed) instead of dropping cents.

2. **Trial offer page** (`src/pages/funnel/TrialOfferPage.tsx`)
   - Renewal lines ("Then $X/month") pick up the new values automatically from the central source.
   - Complete's 1-month trial price stays as presented today unless you want it changed too (see Open question).

3. **Homepage plan cards** (`src/pages/LandingPage.tsx`)
   - Complete card shows `$39`, Focus card shows `$29` — big rounded numbers only, no cents anywhere on the cards.

   

4. **Copy surfaces**
   - `src/pages/TermsPage.tsx`: recurring plan list → `$8.00, $14.00, $28.99, or $38.99 per month`.
   - `src/pages/HelpPage.tsx`: FAQ renewal answer uses the central copy helper instead of a hardcoded list.
   - `src/pages/CoachPage.tsx`: "Upgrade to Focus ($30/mo…)" → `$28.99/mo`.
   - `src/pages/RefundPolicyPage.tsx` already renders from `renewalTermsAll()`, so it updates itself.

5. **Guard test** (`src/test/legalCopy.test.ts`)
   - Extend the banned-fragment list so old `$30` / `$40` monthly-plan phrasing can't creep back into pages.

## Technical details
- Refund-form transaction amounts on `/help` currently list `$7.99, $13.99, $29.99, $39.99`; I'll align the top two to `$28.99` and `$38.99` so users who were charged can pick their real amount.
- No billing-provider price IDs are touched — Breeze products/prices are configured server-side; if the live checkout amounts must match, those prices need updating in the Breeze dashboard separately.

## Trial prices
Complete's 1-month introductory price moves from `$40` to `$38.99` and Focus's from `$30` to `$28.99`, so trial pricing matches the real recurring amounts.

