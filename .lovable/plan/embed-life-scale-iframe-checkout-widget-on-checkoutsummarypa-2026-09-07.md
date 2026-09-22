# Embed Life-Scale iframe checkout widget on CheckoutSummaryPage

## Goal
Replace only the payment form area on `CheckoutSummaryPage.tsx` with the Life-Scale iframe checkout widget, while keeping the existing header, order summary, membership terms, and footer copy intact.

## What will change

### File: `src/pages/funnel/CheckoutSummaryPage.tsx`

1. **Remove the old checkout-intent useEffect**
   - Delete the effect that calls `api.post('/billing/checkout-intent', …)` and sets `intentReady`.
   - The widget handles its own initialization, so the backend intent call is no longer needed.

2. **Remove unused state and imports**
   - Remove `const [intentReady, setIntentReady] = useState(previewMode);`.
   - Remove the `LifeScaleCheckout` component import.
   - Remove the `api` client import (no longer used after the intent call is removed).

3. **Add three new useEffects**
   - **Widget loader** (mount once): inject `<script src="https://sirius.bigdog.app/widget/life-scale-checkout.umd.js" async></script>` into `document.body`, and remove it on unmount.
   - **Offer ID setter**: when `offerId` is available, set `document.getElementById('ls-checkout').dataset.offerId = offerId`.
   - **Height resizer**: listen for `message` events where `e.data?.type === 'funnel:height'`, and apply `e.data.height` to `#ls-checkout` style height.

4. **Replace the payment button/form JSX block**
   - Replace the existing `<div className="mt-8">…</div>` contents with:
     - If `offerId` exists: render `<div id="ls-checkout" data-variant="home-iframe" data-offer-id={offerId} data-success-url="/thank-you" data-api-base-url="https://sirius.bigdog.app" style={{ width: '100%' }} />`
     - Else: render `<div>Loading checkout...</div>`
   - Keep the surrounding `<div className="mt-8">` wrapper.

5. **Preview mode behavior**
   - In `previewMode`, the widget should still render with the computed `offerId`, but the script will not complete a real transaction because the preview route is for display only.

## What will NOT change
- The order summary card.
- The membership terms card and billing descriptor note.
- The back button, page heading, and footer legal links.
- The `offerId` computation from `trialPricing` and `lifeScaleOffers`.

## Verification
- Type-check the project after edits.
- Visually confirm the widget div appears in the payment section and no legacy payment button remains.
