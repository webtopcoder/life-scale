# Temporarily point funnel checkout widgets to staging

## Change
- In `src/components/ImportedFunnelCheckout.tsx`, use `https://sirius.bigdog.app` as the widget service address.
- This updates both the widget script source and its `data-api-base-url` because they share the same constant.
- Keep the URL without a trailing slash so generated paths do not contain double slashes.

## Unchanged
- Funnel offers and route IDs
- Email handoff
- Upsell sequence and redirects
- Checkout layout and styling

## Verification
- Confirm the component references staging and no longer references the production service.
- Run the focused TypeScript check.
