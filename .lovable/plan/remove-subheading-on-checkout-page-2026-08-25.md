# Remove subheading on Checkout page

Delete the paragraph "Here is exactly what you selected and what you will be charged. Nothing is hidden." from the checkout step, leaving only the "Review and confirm." heading.

## Technical
- `src/pages/funnel/CheckoutSummaryPage.tsx`: remove the `<p>` at lines 110-112.
- This page powers both the live funnel step (`/checkout-summary`, `/upgrade/:branch/checkout`) and the `/preview-signup/checkout` preview, so one edit covers both.
- Publish afterwards so the live site reflects the change.
