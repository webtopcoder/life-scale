# Permanently fix the home checkout links

## Confirmed problem

The production payment widget defaults its legal links to page fragments (`#terms`, `#privacy`, and `#help`) instead of the Life Scale pages. The existing checkout repair can also run before the widget is mounted, then never retry, and it only recognizes one outdated cancellation sentence.

## Changes

1. Update the home checkout integration so the widget’s embedded links always point to:
   - **Terms** → `/terms`
   - **Privacy Policy** → `/privacy`
   - **Help Center** → `/help?section=cancel`
2. Replace the widget’s cancellation wording with **“Cancel in one click from our Help Center.”** and remove the email-cancellation language.
3. Apply the repair after the widget mounts and after every widget rerender or offer change, rather than only during the checkout page’s initial render.
4. Keep the checkout design, payment methods, offer selection, order summary, membership terms, and surrounding footer unchanged.
5. Verify both sets of checkout links:
   - Links inside the payment widget.
   - Terms, Privacy Policy, Refund Policy, and cancellation links below the widget.

## Validation

- Add focused coverage for all corrected destinations and remount behavior.
- Open the home checkout in a browser, click each link, and confirm the correct Life Scale page or cancellation flow opens without leaving a broken `#terms`, `#privacy`, or `#help` fragment.
