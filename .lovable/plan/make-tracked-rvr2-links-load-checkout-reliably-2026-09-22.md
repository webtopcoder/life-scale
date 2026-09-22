# Make tracked RVR2 links load checkout reliably

## Scope
- Normalize imported-funnel paths so `/onboarding-rvr2/` and `/onboarding-rvr2` resolve to the same checkout configuration, including when affiliate parameters are present.
- Preserve `subid`, `transaction_id`, and UTM parameters unchanged for the checkout widget’s attribution handling.
- Add regression coverage for trailing-slash and tracking-query access without changing funnel content, payment offers, or upsells.

## Verification
- Confirm the tracked URL resolves the RVR2 checkout configuration.
- Run the imported-funnel checkout tests and type checks.
- Compare widget mounting with the bare and tracked RVR2 URLs.
