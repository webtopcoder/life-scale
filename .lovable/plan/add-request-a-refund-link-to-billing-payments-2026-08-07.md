# Add "Request a Refund" link to Billing & payments

Add a link at the bottom of the Help page's Billing & payments section that takes the user straight to the support contact form with the refund request pre-selected.

## What changes

- Below the billing FAQ accordion, add a "Request a Refund" link/button.
- Clicking it switches the Help page to the Contact Support section and pre-fills the form:
  - Subject preset to a new "Refund" option (added to the subject chips alongside Cancellation, Billing, Technical Issues, Other).
  - The transaction total + charge date fields (currently shown only for "Billing") also show for "Refund", and stay required.
  - Message box pre-filled with a short editable starter line requesting a refund.
- The page scrolls to the top of the contact form so the pre-filled state is visible.

## Technical notes

- All in `src/pages/HelpPage.tsx`: extend the subject chip list, change the `subject === 'Billing'` conditions (render + validation) to include `'Refund'`, and add a handler that calls `setSection('contact')` with a `setContactForm` prefill.
- No API change: `POST /support/tickets` already accepts an arbitrary `subject` string plus `billingAmount`/`billingDate`.
