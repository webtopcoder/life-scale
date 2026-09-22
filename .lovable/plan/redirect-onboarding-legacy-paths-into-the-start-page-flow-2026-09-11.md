# Redirect onboarding + legacy paths into the start-page flow

## Goal
Every old entry point sends visitors into the current start flow: Choose Test → Sign in → Choose Plan → Trial Offer → Checkout. The old paths are not publicly accessible in any way.

## What gets redirected
Onboarding paths (all sent to `/choose-test`):
- `/onboarding`, `/onboarding-home`, `/onboarding-plans`, `/onboarding-plans/pay`, `/onboarding-boa`, `/onboarding-rvr`, `/onboarding-alt`, `/onboarding-dev`

Legacy paths (all sent to `/choose-test`):
- `/short-iq`, `/checkout`, `/checkout2`, `/assessment2`, `/social-proof2`, `/calculating2`, `/email2`
- `/report` already points at the main dashboard and stays as is.

Internal preview paths for the old onboarding are also closed; the `/preview*` pages that preview the current start flow stay as they are.

## Does this hurt the start flow?
No. The start flow uses its own pages (`/choose-test`, `/auth-gate`, `/choose-tier`, `/trial-offer`, `/checkout-summary`) and never links to or returns to any of the old pages. One clean-up is needed: the old stage-based routing table still maps saved sessions back to `/onboarding`, so redirected paths are excluded from that guard — otherwise a stale session could bounce someone toward a closed page.

## Access after the redirect
None. There is no bypass flag, no query-string escape hatch, no internal route to the old pages. Anyone hitting an old URL lands on Choose Test.

## Technical notes
- Replace each route listed above in `src/App.tsx` with `<Navigate to="/choose-test" replace />`.
- Remove the now-unreachable page elements from the router (imports and lazy definitions) so nothing can render them.
- Exclude the redirected paths from `ROUTE_TO_STAGE` / stage-guard handling in `FunnelRouter`.
- Verify with a type check and a browser pass over `/onboarding`, `/onboarding-dev`, `/checkout`, `/short-iq`.
