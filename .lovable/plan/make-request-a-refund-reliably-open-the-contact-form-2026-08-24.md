# Make "Request a Refund" reliably open the contact form

## What we know

In `src/pages/HelpPage.tsx`, the link already calls `startRefundRequest()`, which sets the subject to `Refund`, switches the section to `contact`, updates the URL to `?section=contact&subject=Refund`, and scrolls to top. So the current source code does the intended thing — the live site is likely serving a build from before this change, and the URL/state wiring has one weak point worth hardening.

## Changes

1. Verify behavior against the running app first (click the link, confirm the contact form renders with Refund selected). This confirms whether the issue is stale deploy vs. code.
2. Harden the wiring so the outcome does not depend on state-vs-URL ordering:
   - Add an effect that syncs `section` and `contactForm.subject` from the URL search params whenever they change, so `/help?section=contact&subject=Refund` and the button both land in the same state.
   - Keep the smooth scroll, but run it after the section switch so the form is in view.
3. If the local check passes, the remaining fix is publishing the current build so the live site picks it up.

## Technical notes

- Single file: `src/pages/HelpPage.tsx`. No API or form-validation changes; the Refund OTP gate stays as is.
- The `section` state initializer already reads the URL, so the new effect only covers later param changes (button click, back/forward, shared links).
