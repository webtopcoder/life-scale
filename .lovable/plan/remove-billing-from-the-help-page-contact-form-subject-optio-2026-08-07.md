## Remove "Billing" from the Help page contact form subject options

### Goal
Remove the "Billing" subject option from the support contact form on the Help page so users choose from Cancellation, Refund, Technical Issues, or Other. Keep the transaction-detail fields (amount, charge date) available for "Refund" requests.

### Changes
1. In `src/pages/HelpPage.tsx` at line ~1030, remove `"Billing"` from the subject options array:
   - Current: `["Cancellation", "Billing", "Refund", "Technical Issues", "Other"]`
   - New: `["Cancellation", "Refund", "Technical Issues", "Other"]`
2. Update the conditional rendering of the transaction detail fields at line ~1052 so it only appears when the subject is "Refund" (instead of `'Billing' || 'Refund'`).
3. Update the validation guard at line ~274 that checks whether to require billing details so it only checks for "Refund".
4. Verify there are no other hardcoded references to a "Billing" subject value in the Help form that would become stale.

### No-go
- Do not remove the Billing & Payments FAQ section from the Help page; only the contact-form subject button.
- Do not change the "Refund" pre-fill logic used by the "Request a Refund" link.

### Validation
- Type-check the workspace.
- Confirm the form renders only the four subject buttons and the transaction details still appear when "Refund" is selected.
