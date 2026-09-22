# Wire imported funnels to the IQ upsell flow

## Goal
Make successful purchases from all five imported funnels enter a five-step IQ upsell journey, then land on the IQ Report:

- `/onboarding-rvr2`
- `/onboarding-rvr2-tt`
- `/onboarding-888`
- `/onboarding-888-tt`
- `/onboarding-ff`

## Changes
1. Add one explicit production base-offer configuration entry for each route. Do not guess these five IDs; the payment developer will supply them before checkout activation.
2. Replace the temporary payment placeholder inside each imported checkout page with the existing Life Scale widget from `https://sirius.bigdog.app`, without changing the surrounding imported checkout design.
3. Pass the captured customer email and route-specific base offer into the widget, and begin the upsell sequence only after successful payment.
4. Expand `/upsell` into this ordered IQ sequence, using the existing catalog identifiers:
   1. Weakness Report — `addon_iq_weakness_report`
   2. Answer Breakdown — `addon_iq_answer_breakdown`
   3. Speed vs Accuracy Report — `addon_iq_speed_accuracy_report`
   4. Study & Work Fit Report — `addon_iq_study_work_fit`
   5. 30-Day Sharpening Planner — `addon_iq_30day_sharpening`
5. Make both acceptance and decline advance to the next offer. After the fifth offer, complete confirmation and send the customer to `/iq-report`.
6. Preserve the customer/payment reference and checkout result across every upsell step, refresh, and widget remount.
7. Preserve widget reinitialization behavior so returning to checkout cannot leave a blank payment area.
8. Keep unsuccessful or abandoned payments on checkout; do not grant access or start upsells without a confirmed purchase.

## Validation
- Verify all five routes render the live checkout widget in their existing checkout layouts.
- Verify each route receives its exact payment-developer-supplied production base offer.
- Verify successful payment enters all five IQ offers in the specified order; accepting or declining each offer advances exactly once.
- Verify the fifth offer ends at `/thank-you`, whose stored success destination is `/iq-report`.
- Check return navigation/remounting does not produce a blank widget.
- Run focused checkout tests and TypeScript validation, then test desktop and mobile funnel checkout rendering.

## Technical details
The current imported routes use four checkout components; both RVR2 routes share `CheckoutPageRVR2`, so route-based lookup is required if RVR2 and RVR2-TT receive different base offers. The existing checkout component supports one post-payment upsell; the upsell page will become a guarded five-step sequencer that passes the next step as both the accept and decline destination. The API host will be pinned to `https://sirius.bigdog.app` for this production flow. Checkout activation remains blocked until the payment developer supplies all five base offer IDs.
