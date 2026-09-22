# Update /careers page roles

## Goal
Simplify the /careers hiring page to only show the roles we are currently recruiting for.

## Change
- Remove the **Growth** role card from `src/pages/CareersPage.tsx`.
- Remove the **Creative Strategist** role card from `src/pages/CareersPage.tsx`.
- Keep the **Media Buyer** and **Product Manager** roles as-is.
- Update the page description meta tag so it no longer references removed roles.
- The role selection dropdown in the application form will automatically reflect the reduced `ROLES` list.

## Files affected
- `src/pages/CareersPage.tsx` (delete two role objects from the `ROLES` array; update meta description)

## Validation
- Open `/careers` and confirm only Media Buyer and Product Manager cards are visible.
- Confirm the "Role You Are Applying For" dropdown lists only those two roles.
