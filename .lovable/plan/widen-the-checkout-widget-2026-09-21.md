# Widen the checkout widget

## Change
- Update the shared checkout widget used by `/onboarding-rvr2`, `/onboarding-rvr2-tt`, `/onboarding-888`, and `/onboarding-888-tt`.
- Override the widget’s built-in `440px` maximum width so it fills the existing checkout column and aligns with the promo banner above it.
- Remove the widget’s redundant horizontal inset at wider sizes while retaining safe spacing on narrow mobile screens.
- Keep the page column, payment fields, offer configuration, and checkout behavior unchanged.

## Verification
- Check all four checkout pages on mobile and desktop.
- Confirm the widget aligns with the surrounding content, remains fully visible without horizontal scrolling, and still initializes correctly.
