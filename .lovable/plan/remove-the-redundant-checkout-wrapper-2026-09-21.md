# Remove the redundant checkout wrapper

## Scope
- Update `/onboarding-rvr2`, `/onboarding-rvr2-tt`, `/onboarding-888`, and `/onboarding-888-tt`.
- Remove the outer bordered payment card and its extra padding from the standard checkout so the Life Scale widget sits directly in the page layout.
- Keep the widget itself, its offer configuration, and all payment behavior unchanged.
- Keep the money-back guarantee immediately below the widget without wrapping both elements in another card.
- Preserve the alternate-flow order summary where it contains information not duplicated by the widget.

## Verification
- Check all four checkout pages on mobile and desktop.
- Confirm there is only one visible checkout border, spacing is balanced, and each widget still initializes with the correct offer.
