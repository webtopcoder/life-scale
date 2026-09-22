# Scope the “IQ Scale” header to IQ funnels only

## What changed
- The shared header’s fallback label was changed from `Life Scale` to `IQ Scale`.
- This affected every page using that header without supplying its own label: the IQ Scale intro/test, RVR2 assessment, the separate IQ test assessment, and the upsell preview page.
- Category pages that explicitly supply labels such as Brain Health, Genius, or a scale-specific name were not affected.

## Correction
- Restore the shared fallback label to `Life Scale` so category-neutral pages remain correctly branded.
- Pass `IQ Scale` explicitly within `/iq-start`, `/onboarding-rvr2`, `/onboarding-rvr2-tt`, `/onboarding-888`, `/onboarding-888-tt`, and `/onboarding-ff`, including their intro and assessment stages.
- Leave every explicitly configured category label unchanged.

## Verification
- Confirm all six IQ funnel routes show `IQ Scale` during intro and assessment.
- Confirm representative non-IQ category pages retain their own labels and generic pages use `Life Scale`.
