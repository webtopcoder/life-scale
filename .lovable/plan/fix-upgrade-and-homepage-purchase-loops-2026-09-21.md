# Fix upgrade and homepage purchase loops

## Confirmed causes

- The existing-subscriber upgrade button updates the saved plan directly and navigates to the locked test without opening checkout. Because no purchase has completed, the access check redirects the user back to the upgrade page, creating the loop shown in the recording.
- The shared marketing header always displays “Login,” including on the choose-tier, trial, and checkout pages when the user is already signed in.
- The standard upgrade tier path already has trial and checkout routes, but the existing-subscriber shortcut bypasses them.

## Changes

1. **Send upgrades through payment**
   - Replace the direct plan-update shortcut with the existing upgrade sequence:
     `upgrade plan selection → trial selection → checkout widget → successful return`.
   - Preserve the requested category/scale across each step and ensure the selected offer matches the chosen plan and trial.
   - Do not grant access or navigate into a locked test until checkout has succeeded and entitlement data confirms access.

2. **Respect signed-in state throughout purchase pages**
   - Update the shared header so authenticated users see an account/dashboard action instead of “Login.”
   - Keep signed-in users on their intended upgrade path rather than routing them through account creation or login.
   - Preserve the intended destination if authentication genuinely expires mid-flow.

3. **Harden the homepage purchase path**
   - Audit and correct the complete homepage sequence:
     `choose test → account → choose tier/category → trial → checkout widget → thank-you/dashboard`.
   - Prevent stale funnel selections, missing trial data, or entitlement checks from bouncing users backward between steps.
   - Keep existing offer computation, checkout presentation, legal links, and upsell behavior unchanged.

4. **Regression coverage and verification**
   - Add focused tests for authenticated upgrade routing, signed-in header behavior, selected plan/trial persistence, and homepage checkout routing.
   - Browser-test both paths while signed in, confirming each reaches a visible payment screen without repeating pages or showing a login prompt.
   - Verify successful-return routing does not reopen the upgrade flow.

## Technical scope

Likely touchpoints are the tier-selection actions, shared marketing header, checkout success destination, route guards, and funnel-state helpers. No pricing, offer IDs, checkout-widget styling, or entitlement rules will be changed.
