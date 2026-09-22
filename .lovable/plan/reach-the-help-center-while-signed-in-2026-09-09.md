# Reach the Help Center while signed in

## Problem
Once someone signs in, there is no way to get to the Help Center from inside the app. The only links live on the public site's top menu and footer, so a paying member on their dashboard cannot find the pause, cancel, refund or contact options without going back to the marketing pages.

## Change

1. **Help link in the signed-in top bar.** Add a small "Help" link (support agent icon + label) to the shared top bar used by every signed-in page — main dashboard, category pages, report pages, add-on pages. It sits next to "Sign out" and goes to the Help Center.
2. **Hide it during a test.** The link is not shown while someone is actually answering questions in a test flow, so nothing distracts them mid-assessment.
3. **Way back.** The Help Center's back arrow returns the signed-in person to their dashboard instead of the public homepage.
4. **Email already filled in.** The email on the account is pre-filled in the cancel, pause, refund and contact forms. The 6-digit email verification code stays exactly as it is today for cancelling, pausing and refunds.

Nothing about the cancellation, pause, refund or ticket logic changes.

## Technical detail

- `src/components/marketing/LifeScaleHeader.tsx`: when `useAuth().user` is set and a new optional `showHelp` prop is not `false`, render a `Link to="/help"` in the right-hand area, before the existing `right` node. Uses the existing `support-agent.webp` asset and header text styles.
- Pass `showHelp={false}` from the in-test surfaces: `IqTestAssessmentPage.tsx`, `BrainHealthFlow.tsx`, `src/components/scale/ScaleQuizFlow.tsx`, `AssessmentPage.tsx`.
- `src/pages/HelpPage.tsx`: the existing back control navigates to `/main-dashboard` when `user` is present, otherwise `/` as today. Extend the current `user?.email` pre-fill effect to also seed `contactForm.email` (and keep seeding `otpEmail`) when empty. OTP flows untouched.
- No route changes needed: `/help` is already public and already listed in `HEADERLESS_FUNNEL_ROUTES`.
