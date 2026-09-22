# Always show a single card descriptor

The statement-descriptor copy currently lists dynamic variants derived from the live category registry (`IQ-SCALE.COM/MIND`, `IQ-SCALE.COM/BODY`, …). Simplify it to one fixed descriptor.

## Change

In `src/content/legalCopy.ts`:
- Remove `descriptorVariants()`.
- `statementDescriptorNote()` returns a single sentence: "Charges appear on your card statement as IQ-SCALE.COM."

All consumers already call `statementDescriptorNote()`, so no page edits are needed: checkout toasts (`CheckoutPage`, `short-iq/CheckoutPage`, `PlanCheckoutPaymentPage`), `TermsPage`, and `HelpPage` pick up the new wording automatically.

In `src/test/legalCopy.test.ts`:
- Drop the `descriptorVariants` import and the "derived from the live category registry" assertion; replace it with a check that the note contains `IQ-SCALE.COM` and no `IQ-SCALE.COM/` variant.
- Keep `IQ-SCALE.COM/` in the banned-fragments list so slash variants can't reappear anywhere.
