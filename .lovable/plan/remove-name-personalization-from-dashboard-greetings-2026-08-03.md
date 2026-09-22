# Remove name personalization from dashboard greetings

## Change

All four dashboards greet with a plain "Welcome back." — no name at all. That removes the mismatch between the email-derived name (main dash) and the stored profile name (branch dashes).

## Files

- `src/pages/funnel/MainDashboardPage.tsx` — greeting to "Welcome back."; drop `firstNameFromUser` helper and its `useMemo`.
- `src/pages/funnel/IqDashPage.tsx` — same.
- `src/pages/funnel/BrainHealthDashPage.tsx` — same.
- `src/pages/funnel/HiddenGeniusDashPage.tsx` — same.

Also remove any now-unused `firstName` derivation / imports in those files so nothing dangles. No changes to entitlements, scoring, points, or the profile data itself.

## Note

This is presentation-only: the seeded `display_name` value ("E2E Complete") may still exist on the account in the database, but it will no longer be displayed anywhere on these dashboards. Say the word if you also want the stored data cleaned up.
