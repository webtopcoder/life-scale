# Add a Checkout step to the signup flow

New final step after the trial-length choice: a checkout/order-summary screen that confirms what the user picked, spells out the membership terms, and states that the charge appears as **LIFE SCALE**.

## New flow

```text
1. Choose test  →  2. Create account  →  3. Verify code
   →  4. Choose plan  →  5. Trial length  →  6. Checkout (new)  →  Test starts
```

## What the Checkout screen shows

- **Order summary card**: chosen scale/test, plan tier (Insight / Guide / Focus / Complete), trial length, "Due today" price.
- **Membership terms** in plain language: trial length and what it includes, the date-free renewal statement ("Then $X/month after the trial ends"), cancel any time, how to cancel/refund (link to Help).
- **Billing descriptor line**: "Charges appear on your card statement as LIFE SCALE."
- Standard pricing/disclaimer footnote already used elsewhere.
- Primary button: "Start my trial" — performs the same entitlement grant the trial page does today, then sends the user into their chosen test.
- Secondary link: "Back" to the trial-length step, so selections can be changed.
- If a selection is missing (no plan or trial in funnel state), the page sends the user back to the step that collects it.

## Technical notes

- New page `src/pages/funnel/CheckoutSummaryPage.tsx`, accepting a `previewMode` prop like the other funnel steps.
- `TrialOfferPage` no longer grants entitlement or redirects into the test; selecting a trial stores `selectedTrial` in funnel state and navigates to the new checkout route. The entitlement `PATCH /dashboard/profile` call plus `clearFunnelState()` move to the checkout page's confirm action.
- Route registered in `src/App.tsx` (`/checkout-summary`, added to `HEADERLESS_FUNNEL_ROUTES`), plus the `/upgrade/:branch` variant so the re-login upgrade path uses the same step.
- Trial-price and renewal figures come from a shared map so the checkout summary and the trial page cannot drift; renewal prices continue to come from `TIER_MONTHLY_USD` in `src/content/legalCopy.ts`.
- Descriptor wording: `statementDescriptorNote()` in `src/content/legalCopy.ts` currently renders `LIFE-SCALE.COM`. It changes to `LIFE SCALE`, so the Terms page and Help Center — which read the same function — update with it. No page hardcodes the descriptor.
- Preview: add `PreviewCheckoutSummary` to `PreviewSignupScreens.tsx`, a `/preview-signup/checkout` route, and a "6. Checkout" chip in `PreviewSignupShell`.
- Existing `/checkout` (old short-IQ funnel) is untouched.
