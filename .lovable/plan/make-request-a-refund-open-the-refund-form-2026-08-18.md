# Make "Request a Refund" open the refund form

## Problem
In the Help Center's "Refunds and Payment Inquiries" section, the "Request a Refund" link currently calls `openSupportChat()`, which opens the floating support chat widget instead of the refund request form.

## Change
Point the link at the contact form with the refund path pre-selected:

- Switch the Help Center to the Contact section.
- Pre-set the form subject to "Refund", which already reveals the Transaction Total and Date Charged fields.
- Scroll the view to the top so the form is visible immediately.

Nothing else about the form, its validation, or ticket submission changes.

## Technical detail
In `src/pages/HelpPage.tsx`, replace the body of `startRefundRequest` so it sets `contactForm.subject` to `'Refund'` and calls `setSection('contact')` (plus a `window.scrollTo({ top: 0 })`) instead of `openSupportChat()`. Remove the now-unused `openSupportChat` import if no other caller remains on the page.
