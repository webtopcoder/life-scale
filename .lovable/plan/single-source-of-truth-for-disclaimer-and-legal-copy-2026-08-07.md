# Single source of truth for disclaimer and legal copy

Disclaimer and billing-legal wording is currently duplicated and already drifting across the app. Confirmed examples:

- Start-screen disclaimers are hardcoded per page with three different wordings: `src/pages/body/BodyStartPage.tsx:14`, `SleepStartPage.tsx:14`, `AthleteStartPage.tsx:14`, `src/pages/funnel/BrainHealthFlow.tsx:97`.
- Report-footer disclaimers are inline strings: `src/pages/funnel/BrainHealthReportPage.tsx:193, 288, 617, 671`, `src/pages/addons/AddonReportPage.tsx:151`, plus long-form limits paragraphs in `src/engine/reportCopy/bodyIqCopy.ts:174` and `sleepHealthCopy.ts:157`.
- The card-statement descriptor paragraph exists in three places with **different** variant lists: `src/pages/CheckoutPage.tsx:344` and `src/pages/PlanCheckoutPaymentPage.tsx:119` say `IQ-SCALE.COM/IQ, /BRAIN, /GENIUS`, while `src/pages/HelpPage.tsx:933` says `/MIND, /BODY`. `src/pages/TermsPage.tsx:113` repeats the first version.
- The "not clinical / entertainment" paragraph lives in `src/components/marketing/MarketingFooter.tsx:60-65` and again as FAQ answers in `src/pages/LandingPage.tsx:36, 52` and `src/pages/HelpPage.tsx:365`.

## What gets built

A new content module, `src/content/legalCopy.ts`, becomes the only place this wording is authored. Everything else imports from it.

It exports:

1. **Assessment disclaimers**, keyed by kind so each surface picks a tone rather than inventing one:
   - `assessmentShort` — one line for quiz start screens and in-flow footers.
   - `reportShort` — one line for report page footers.
   - `reportLong` — the paragraph-length "limits of this report" text used inside report copy.
   - `productLong` — the marketing/footer "not clinical, for personal interest" paragraph.
   - `addonShort` — the add-on report line.
   - Optional per-category override map (`mind` / `body`) so wellbeing scales can say "wellbeing check-in" and Mind scales say "cognitive check-in", while all other surfaces fall back to the shared default.

2. **Billing legal copy**, generated from existing price data rather than retyped:
   - `statementDescriptor` — the descriptor paragraph, with one canonical variant list (`IQ-SCALE.COM/MIND`, `IQ-SCALE.COM/BODY`, …) derived from the live category registry in `src/config/scales.ts`.
   - `renewalTerms(tier)` — introductory term plus recurring price sentence.
   - `refundGuarantee`, `cancelAnytime`, `autoRenewNotice`.

3. A small presentational component, `src/components/legal/DisclaimerNote.tsx`, taking `kind` and optional `category` / `className`, so the visual treatment (muted small text, or bordered card for the long variants) is also consistent.

## Refactor targets

Replace inline strings with imports at every confirmed site above:

- Quiz start / flow: `BodyStartPage`, `SleepStartPage`, `AthleteStartPage`, `BrainHealthFlow`, `IqStartPage`, `HiddenGeniusStartPage`, and `src/components/scale/ScaleQuizFlow.tsx` (its `disclaimer` config field defaults from the module instead of being required per page).
- Reports: `BrainHealthReportPage`, `HiddenGeniusReportPage`, `IqReportPage`, `BodyReportPage`, `SleepReportPage`, `AthleteReportPage`, `AddonReportPage`, and the long-form paragraphs in `src/engine/reportCopy/bodyIqCopy.ts` and `sleepHealthCopy.ts`.
- Preview / sample: `src/pages/SampleReportPage.tsx` footer note.
- Checkout and plans: `CheckoutPage`, `PlanCheckoutPaymentPage`, `TrialOfferPage`, `ChooseTierPage`, `PlanSelectionPage` — descriptor, renewal, cancel and refund lines.
- Legal and support: `TermsPage`, `RefundPolicyPage`, `HelpPage`, `MarketingFooter`, `LandingPage` FAQ.

Wording is preserved as-is where it is already correct; where versions conflict (the descriptor variant list, the renewal price sentence) the legal-page version wins and becomes canonical, so checkout stops showing stale `/IQ, /BRAIN, /GENIUS`.

Note: `src/data/likert-tests.ts` keeps its own per-test disclaimers — those are test-specific clinical caveats, not shared boilerplate.

## Guardrail

A vitest spec, `src/test/legalCopy.test.ts`, greps the `src` tree for the banned literal fragments ("not a medical test", "IQ-SCALE.COM/", "not a clinical", "entertainment purposes", "money-back guarantee") and fails if they appear anywhere outside `src/content/legalCopy.ts`, `src/data/likert-tests.ts` and the test itself. Future drift then breaks the build instead of shipping.
