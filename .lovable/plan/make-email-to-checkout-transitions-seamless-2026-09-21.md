# Make email-to-checkout transitions seamless

## Goal
Remove the legacy checkout preloading and full-screen email popup from these funnels:
- `/onboarding-rvr2`
- `/onboarding-rvr2-tt`
- `/onboarding-888`
- `/onboarding-888-tt`
- `/onboarding-ff`

Each funnel will show email capture as a normal funnel step, then replace it with checkout after a valid submission.

## Current behavior
- RVR2, RVR2-TT, and FF move from calculation directly to checkout, then cover the already-mounted checkout with a full-screen email dialog.
- 888 and 888-TT already move through a dedicated email stage, but their checkout pages still contain the same fallback dialog and hidden checkout-preload machinery.
- All checkout pages retain an always-enabled `shouldInitCheckout` flag from the previous preload approach.
- The payment widget is currently mounted behind the email dialog and can be rebuilt when the submitted email arrives.

## Changes
1. Add a dedicated email stage to the RVR2, RVR2-TT, and FF flow renderers, using their existing email screens.
2. Change their calculation-complete transition to enter `email` instead of `checkout`.
3. Let successful email submission perform the existing `SET_EMAIL` followed by `SET_STAGE: checkout`, matching the already-correct 888/888-TT flow.
4. Remove the checkout-level email dialogs, overlay flags, scroll-lock behavior, and related dialog transition handling from all four shared checkout implementations covering the five routes.
5. Remove the obsolete `shouldInitCheckout` state and render the Life Scale payment widget normally only when checkout is the active stage.
6. Keep email validation, lead/session persistence, analytics events, offer IDs, route metadata, upsell sequence, checkout layout, and payment behavior unchanged.

## Customer-journey safeguards
- Preserve every visible email screen, its copy, validation, button behavior, and submitted-email handling; only change how it is placed in the stage sequence.
- Preserve the exact calculation-to-email and email-to-checkout order, with no new screens, waits, redirects, clicks, or loading overlays.
- Mount checkout only after the email is stored, so the widget starts once with complete customer data rather than loading invisibly and restarting.
- Keep saved-session behavior intact: customers with an existing email can resume at checkout without being forced backward.
- Make no changes to assessment, scoring, results calculation, checkout content, pricing, payment completion, upsells, or report access.

## Technical details
- RVR2 and RVR2-TT share `OnboardingFlowPage` and `CheckoutPageRVR2`.
- 888 and 888-TT already have separate `email` cases and email components; only their checkout fallback overlays need removal.
- FF needs an `email` case added to `OnboardingFlowPageFF`.
- Once checkout no longer mounts before email capture, `ImportedFunnelCheckout` will receive the final email on its first mount, avoiding the email-triggered teardown/reload during the handoff.

## Verification
- Complete each of the five funnels through calculation, email capture, and checkout on mobile and desktop.
- Confirm email appears as a normal full-page step, never as a dialog or popup over checkout.
- Confirm valid email submission advances once to checkout with the payment widget visible and correctly prefilled.
- Confirm the submitted email is available to checkout on its first mount and the widget initializes only once.
- Confirm checkout does not exist in the DOM and its script does not load while the email step is active.
- Confirm direct/resumed checkout with a saved email still works.
- Confirm refresh/back behavior at both email and checkout does not lose progress, duplicate submission, or create a loop.
- Confirm analytics fire once at the same logical milestones and no offer, upsell, or checkout styling changes occur.
- Add focused regression coverage for stage order and the absence of checkout preloading during email capture.
