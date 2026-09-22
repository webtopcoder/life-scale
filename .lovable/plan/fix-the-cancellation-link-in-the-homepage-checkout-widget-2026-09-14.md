# Fix the cancellation link in the homepage checkout widget

## What is wrong

The sentence shown inside the production checkout widget currently says:

> Cancel in one click from your account or by emailing support.

That wording is embedded in the externally loaded production widget, while the checkout page footer already links correctly to `/help?section=cancel`.

## Change

1. Replace the widget sentence on the homepage checkout with **“Cancel in one click from our Help Center.”**
2. Make **Help Center** a working link to `/help?section=cancel`, which opens the cancellation flow directly.
3. Remove every suggestion in that widget sentence to cancel by email or through an account page.
4. Keep the selected offer, payment options, order summary, membership terms, and all other checkout content unchanged.
5. Apply the correction whenever the widget mounts or rerenders so switching plans cannot restore the old wording.
6. Verify the production widget displays the new linked wording and that clicking it opens the cancellation flow.

## Technical detail

- Update `src/pages/funnel/CheckoutSummaryPage.tsx` around the externally mounted `#ls-checkout` widget.
- Observe the widget content after its script mounts, replace only the exact cancellation sentence, and insert a same-site link to `/help?section=cancel`.
- Disconnect the observer when the checkout page unmounts and recreate it when `offerId` changes.
