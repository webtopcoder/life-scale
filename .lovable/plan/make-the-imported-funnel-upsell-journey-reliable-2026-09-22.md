# Make the imported-funnel upsell journey reliable

## Goal

After a successful purchase on any imported IQ funnel, show all five screenshot-style one-click upsells in order, then open the thank-you page. Never send the buyer to the nonexistent `/embed/checkout` page.

## Changes

1. Start imported-funnel checkout success at `/upsell?step=0`, preserve attribution and the returned `customer_id`, and set `/thank-you` as the checkout fallback while storing `/iq-report` as the destination after thank-you.
2. Before mounting each Sirius upsell, check the returned customer against the same Sirius service used by the widget. Retry briefly while a newly created payment customer is still propagating.
3. Mount the screenshot-style Sirius upsell only after the customer is ready. Pass the full five-offer sequence, current step, customer reference, and `/thank-you` completion destination to the widget.
4. Override the widget's invalid default checkout fallback with a valid in-project recovery destination, so a delayed or rejthank-you actions instead of a blank screen or 404.

## Validation

- Verify checkout attributes begin at step 0, preserve tracking values, and end at `/thank-you`.
- Verify the five IQ offer IDs remain in the approved order and customer data survives every step.
- Verify temporary 404 responses are retried before the upsell mounts.
- Verify permanent readiness failure never requests `/embed/checkout`.
- Verify accept and skip advance through all five offers and finish at `/thank-you`.
- Run focused tests and TypeScript validation, then inspect the upsell page at desktop and mobile widths.

## Technical details

The Sirius upsell widget calls `/api/customer/summary?customer_id=...` once and immediately navigates to its default `/embed/checkout` when that call returns 404. The parent page will perform a bounded readiness check before inserting `#ls-upsell`, and `LifeScaleUpsell` will receive an explicit safe `data-checkout-url`. This leaves payment and one-click charging inside Sirius while preventing its invalid fallback from escaping the app.ected customer check cannot navigate to `/embed/checkout`.

1. Keep both “Add to My Report” and “No thanks” advancing exactly once through steps 1–5. After step 5, route to `/thank-you`; its Continue action opens `/iq-report`.
2. If readiness still cannot be confirmed after retries, keep the customer on the upsell page with Retry and Continue-to-