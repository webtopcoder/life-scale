# Fix the cancellation link on the homepage-flow checkout

## Problem
On the homepage-funnel checkout page (`/checkout-summary`), the support/cancellation footer link currently points to the generic Help Center home (`/help`). Users looking to cancel land on the help home instead of the cancellations section, so the cancellation path feels broken.

## Change
1. Update the footer copy on `/checkout-summary` so the support/cancellation link points directly to `/help?section=cancel`, which opens the Help Center on the "Cancellations and Pauses" section.
2. Keep the rest of the checkout page unchanged: header, order summary, membership terms, legal links, back button, heading, and widget.
3. Run type-check to confirm no regressions.

## Technical detail
- File: `src/pages/funnel/CheckoutSummaryPage.tsx`.
- Change the existing footer `<Link to="/help">Contact support</Link>` (lines 217–219) to link to `/help?section=cancel` and update the surrounding copy to make the cancellation destination clear (e.g., "Need help or want to cancel? Contact support or cancel your plan").
- No route or Help Center changes are required; `/help?section=cancel` already opens the cancel flow.
