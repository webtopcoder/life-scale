# Show the exact trial-end / first-charge date at checkout

The renewal line currently says "When your 7 days of trial access ends…". It will name the actual calendar date the trial ends and the first monthly charge occurs, e.g.:

"Your trial ends on September 1, 2026. On that date your plan renews at $38.99/month. All subscriptions auto-renew until cancelled."

The date is computed from today's date plus the selected trial length (3 days, 7 days, or 1 month), in the visitor's local timezone, formatted as "September 1, 2026".

The order summary "Then" row will also show the date under the price ("$38.99/month — starting Sep 1, 2026") so the summary and the terms agree.

## Technical
- `src/lib/trialPricing.ts`: add a `days` (or month) duration to each `TrialOffer` and a helper `trialEndDate(trial, from = new Date())` plus `formatTrialDate()` (long and short forms) so the date logic lives in one place with the pricing.
- `src/pages/funnel/CheckoutSummaryPage.tsx`: compute the date once on render and use it in the renewal bullet (lines 159-165) and the "Then" row (lines 134-137).
- Applies automatically to `/checkout-summary`, `/upgrade/:branch/checkout`, and `/preview-signup/checkout`.
- Publish after the edit so the live site updates.

Note: this is the date implied by the trial length at the moment of checkout. Once a real payment provider is wired, the authoritative date should come from the provider's subscription record.
