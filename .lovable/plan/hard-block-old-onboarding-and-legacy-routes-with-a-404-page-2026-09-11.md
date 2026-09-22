# Hard-block old onboarding and legacy routes with a 404 page

## Goal
Old onboarding and legacy paths show a 404 "Page not found" screen instead of redirecting into the start flow. No content from the old pages is reachable in any way.

## Important constraint
The app is hosted as a static single-page app: the hosting layer serves the app shell for every path, so there is no server that can return a real HTTP 404 status for these routes. The guard is therefore enforced inside the app itself: hitting an old path renders the 404 page immediately, at that same URL, with no redirect and no way through.

## What changes
In `src/App.tsx`, replace the `<Navigate to="/choose-test" replace />` redirects with the existing `NotFound` 404 page for:
- `/onboarding/*`, `/onboarding-home`, `/onboarding-plans/*`, `/onboarding-boa`, `/onboarding-rvr`, `/onboarding-alt`, `/onboarding-dev`
- `/assessment2`, `/social-proof2`, `/calculating2`, `/email2`, `/checkout`, `/checkout2`, `/short-iq/*`, `/checkout2-preview`

Behavior for a visitor hitting any of these URLs:
- The address bar stays on the old URL (no redirect).
- The screen shows "404 — Page not found" with a Return to Home link.
- Nothing from the retired pages loads or renders.

## Left as-is
- `/report` and `/dashboard/*` keep redirecting to `/main-dashboard` (they map to live product surfaces).
- `/upsell/weakness-report`, `/upsell/genius-blueprint`, `/upsell/brain-coach`, `/auth`, `/affiliates` keep their current redirects (they point at live pages, not retired flows).
- The current start flow (`/choose-test` → `/auth-gate` → `/choose-tier` → `/trial-offer` → `/checkout-summary`) is untouched.

## Technical notes
- Import `NotFound` in the outer router and swap each redirect element for `<NotFound />`.
- Remove the now-unneeded `Navigate` usages for those routes only.
- Verify with `bunx tsgo --noEmit` and a browser pass over `/onboarding`, `/onboarding-dev`, `/checkout`, `/short-iq` confirming each shows the 404 page.
