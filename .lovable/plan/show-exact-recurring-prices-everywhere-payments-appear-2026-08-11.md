# Show exact recurring prices everywhere payments appear

All payment-related surfaces show the four recurring prices as **$7.99, $13.99, $28.99, $38.99**. The homepage plan cards keep their clean rounded look ($8, $14, $29, $39).

## Changes

1. **Central pricing source** (`src/content/legalCopy.ts`)
   - Set Guide to `13.99` and Insight to `7.99` (Focus/Complete already 28.99/38.99).
   - Every derived string (renewal sentences, the "renews monthly at ..." list) picks up cents automatically.

2. **Trial offer page** (`src/pages/funnel/TrialOfferPage.tsx`)
   - 1-month introductory price for Guide becomes `$13.99` and Insight becomes `$7.99`, matching the recurring price.
   - Shorter trial prices ($1 / weekly) stay as they are.

3. **Terms** (`src/pages/TermsPage.tsx`)
   - Replace the hardcoded "$8.00, $14.00, $28.99, or $38.99" with the centralized price list so it reads $7.99, $13.99, $28.99, $38.99.

4. **Other payment copy**
   - Sweep Help Center, Refund Policy, Coach upgrade prompt, and checkout/upgrade surfaces for hardcoded `$8` / `$14` recurring mentions and switch them to the centralized formatter. (Help Center's refund amount picker already lists the four correct prices.)

5. **Homepage plan cards** (`src/pages/LandingPage.tsx`)
   - Left as rounded display values: $39, $29, $14, $8.

6. **Guard test** (`src/test/legalCopy.test.ts`)
   - Extend the banned-fragment list so `$8.00`/`$14.00` recurring strings cannot be reintroduced outside the central module, while allowing the rounded homepage card values.

## Technical notes

`TIER_MONTHLY_USD` remains the single source of truth; `formatMonthlyUsd` already renders two decimals for non-integer amounts, so no formatting changes are needed. No backend or billing-provider amounts are altered by this plan — display copy only.
