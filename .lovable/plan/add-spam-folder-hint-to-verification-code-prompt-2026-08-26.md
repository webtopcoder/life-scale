# Add spam-folder hint to verification code prompt

## Goal
Update the verification instruction on the account-creation email-code step so users know to check their spam folder if the code is not in their inbox.

## Current state
`src/pages/funnel/AuthGatePage.tsx` renders the pending-verification copy as:

```
Enter the code we sent to your inbox.
```

## Change
Replace that sentence with copy that explicitly mentions the spam folder:

```
Enter the code we sent to your inbox. If you do not see it, check your spam folder.
```

This is a static string inside the `pendingEmail` branch of the subheadline in `AuthGatePage.tsx`. The preview route (`/preview-signup/auth-gate-verify`) and the live signup flow both render the same component, so the update will apply to both.

## Verification
1. Run `bunx vitest run src/test/legalCopy.test.ts` (or full test suite) to ensure no copy-related drift-guard regressions.
2. Visually check `/preview-signup/auth-gate-verify` and the live `/auth-gate` after submitting the signup form to confirm the new line appears.

## Files to edit
- `src/pages/funnel/AuthGatePage.tsx` — update the pending-verification subheadline text.
