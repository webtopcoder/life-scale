# Preview of the homepage sign-up flow

Goal: one place, `/preview-signup`, where every screen of the "Start Test" funnel can be seen and edited without signing in, paying, or completing a test.

## What the preview shows

A slim index page at `/preview-signup` listing each step, plus a direct route per screen:

1. Choose your test (`/preview-signup/choose-test`)
2. Create account (`/preview-signup/auth-gate`)
3. Create account — verification code state (`/preview-signup/auth-gate-verify`)
4. Choose your plan (`/preview-signup/choose-tier`)
5. Trial offer / paywall (`/preview-signup/trial-offer`)

Each screen renders the real production component with real copy and styling, so edits made there show up in the live funnel too.

## Behavior in preview mode

- No auth: the account screen never redirects, never calls sign-up, and the verify-code state can be shown on demand.
- No payments: plan and trial buttons don't start a checkout; they advance to the next preview screen instead.
- No entitlement checks: plan/trial screens render their default (non-upgrade) state.
- A persistent step bar at the top of each preview screen lets you jump between steps, and a "Back to index" link returns to the list.

## Technical notes

- New folder `src/pages/preview/signup/` with a `PreviewSignupIndex` plus one thin wrapper per screen, following the existing `src/pages/preview/PreviewPlanSelection.tsx` pattern.
- Add an optional `previewMode?: boolean` prop to `ChooseTestPage`, `AuthGatePage`, `ChooseTierPage`, and `TrialOfferPage`. When set: skip the `useEffect` auth/subscription redirects, skip billing calls, and replace `navigate(...)` targets with the next preview route. Default (unset) behavior is unchanged.
- `AuthGatePage` gets an extra preview-only flag to force the pending-verification view.
- Register routes in `src/App.tsx` under `/preview-signup/*` and add `/preview-signup` to `HEADERLESS_FUNNEL_ROUTES` / the `isPreviewRoute` check so the marketing header isn't doubled.
- No database, edge function, or pricing-logic changes.
