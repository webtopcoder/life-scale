# Make every home-checkout legal link absolute

## Change

1. Replace the payment widget’s fragment and relative destinations with full Life Scale URLs:
   - **Terms** → `https://life-scale.com/terms`
   - **Privacy Policy** → `https://life-scale.com/privacy`
   - **Help Center** → `https://life-scale.com/help?section=cancel`
2. Inject those complete `href` values directly into every matching anchor after the widget mounts and after each rerender.
3. Keep the cancellation sentence as **“Cancel in one click from our Help Center.”**, with **Help Center** as a full hyperlink.
4. Update the links beneath the widget to use the same absolute destinations, including `https://life-scale.com/refund-policy` for Refund Policy.
5. Keep the checkout design, offer, payment options, and all other content unchanged.

## Verification

- Update focused tests to require full `https://life-scale.com/...` links.
- Verify the rendered checkout contains no `#terms`, `#privacy`, `#help`, or relative legal destinations.
- Confirm each legal and cancellation link opens the intended live Life Scale page.
