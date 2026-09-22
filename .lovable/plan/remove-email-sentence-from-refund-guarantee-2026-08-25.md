# Remove email sentence from refund guarantee

## Goal
Remove the trailing email sentence from the checkout refund guarantee copy.

## Current state
- `src/content/legalCopy.ts` line 107 exports `REFUND_GUARANTEE` as:  
  `"Your introductory purchase is covered by a 30-day refund guarantee — request a full refund within 30 days of that first charge, no questions asked. Email help@life-scale.com."`
- `src/pages/funnel/CheckoutSummaryPage.tsx` line 180 renders this constant directly.

## Change
Update `src/content/legalCopy.ts` to remove the trailing sentence, resulting in:  
`"Your introductory purchase is covered by a 30-day refund guarantee — request a full refund within 30 days of that first charge, no questions asked."`

This keeps the single-source legal-copy rule intact and affects the checkout summary automatically.

## Verification
1. Confirm the file change compiles.
2. Check the checkout page preview shows the guarantee without the email line.
