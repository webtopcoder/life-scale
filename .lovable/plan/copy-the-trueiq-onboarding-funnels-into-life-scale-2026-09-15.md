# Copy the TrueIQ onboarding funnels into Life Scale

## Goal
Recreate the source project’s funnel experiences at:
- `/onboarding-rvr2`
- `/onboarding-rvr2-tt`
- `/onboarding-888`
- `/onboarding-888-tt`
- `/onboarding-ff`

They will retain the source layouts, interactions, timing, stage order, scoring, multilingual behavior, and visual questions, while visible branding is updated to Life Scale.

## Funnel behavior
- Copy every non-payment screen and transition: intro, memory steps, assessment, reinforcement, social proof, calculation, email capture, and checkout.
- Preserve each funnel’s separate state, progress, back/skip behavior, restart behavior, answer handling, and scoring.
- Preserve the special 888 and 888-TT 40-question experiences, including their isolated state and memory sequence.
- Preserve FF’s English, Spanish, and Portuguese selector and localized question/copy behavior.
- Preserve RVR2’s source-specific reinforcement and checkout presentation.
- Add the five routes as explicit public routes while keeping the previously retired onboarding URLs blocked by the existing 404 rules.

## Checkout boundary
- Recreate each complete checkout page, including its offer copy, pricing display, testimonials, terms, FAQ, countdown, email gate, and surrounding design.
- Do not copy or initialize the Breeze payment iframe or its payment services.
- Replace only the payment area with a stable, clearly isolated placeholder so the page remains complete and ready for the separate payment integration.
- Do not add payment-success redirects or simulate a completed purchase.

## Questions, scoring, and persistence
- Treat RVR2’s source flow-ID collision as a migration blocker to resolve safely: compare the actual source rows against this project’s existing Life Scale rows, preserve the source RVR2 content exactly, and assign a new non-colliding ID if the datasets differ. Never silently reuse or overwrite a different assessment.
- Add dedicated backend flow records and exact question rows for FF, 888, and 888-TT using their source IDs and ordering.
- Extend the current API/seed pipeline so all five routes load their intended questions through the existing question endpoint.
- Port the isolated 888/888-TT state logic and connect shared RVR2/FF state to this project’s existing persistence API without bringing over the source project’s backend client.
- Keep integer question IDs, correct-answer handling, reinforcement flags, category scoring, final score calculation, and percentage calculation aligned with the source.

## Life Scale IQ report compatibility
- On calculation completion, create the same canonical IQ completion payload used by the current `/iq-start` flow: `score`, five-category `scores`, `percentiles`, raw `answers`, `flowId`, `totalQuestions`, and an immutable question snapshot containing ID, type, prompt, category, options, and difficulty.
- Save that payload under the existing `iq` completion branch, both locally before sign-in and through the authenticated completion endpoint after account creation/payment integration.
- Enrich saved answers with category, type, difficulty, and scored/self-report classification where the report engine needs them, while retaining the source answer fields and timing.
- Correct the 888 visual-question answer path: the source UI currently records visual answers with `isCorrect: null`; map the selected displayed asset back to the source answer key so visual questions are graded before category and final-score calculation.
- Keep personal questions unscored and preserve the existing Likert scoring rule; verify every other imported question type has an explicit correctness rule.
- Ensure the current IQ report can hydrate from the completion payload after refresh and shows valid score, category, timing, accuracy, difficulty, strongest/weakest, and speed-vs-accuracy sections.

## IQ add-on compatibility
- Map all five current IQ add-ons to the imported completion payload: Answer-by-Answer Breakdown, Speed & Accuracy Report, Weakness Report, Study & Work Fit, and 30-Day Sharpening Plan.
- Preserve exact question snapshots so answer labels, skipped items, graded/self-report denominators, category accuracy, and timing-based add-ons remain accurate even if funnel data changes later.
- Keep the existing IQ add-on keys, checkout routes, ownership checks, entitlement gates, builders, and report-view routes; imported funnels must produce the same `iq` branch contract rather than introducing parallel products.
- Because payment is intentionally excluded, verify report/add-on compatibility with seeded or test entitlements and payloads; do not falsely grant purchases from the checkout placeholder. Add a documented handoff contract for the later payment integration to call the existing completion/fulfillment path.

## Visual assets
- Bring over every required puzzle, answer option, memory visual, fingerprint, portrait, avatar, and checkout image.
- Download source-project asset pointers from their source origin before adding the actual binaries here; never copy source-only pointer files.
- Preserve the source directory conventions expected by the visual-question loaders so all problem and answer SVGs render in-app.
- Verify every visual question individually, including preload behavior and mobile/desktop sizing.

## Branding and excluded integrations
- Replace visible TrueIQ names and marks in the copied funnels with Life Scale while preserving the surrounding wording and visual hierarchy.
- Do not import or call PostHog or Klaviyo code from the source funnels.
- Do not import Breeze iframe code, Breeze styles, Breeze services, or Breeze payment callbacks.
- Keep the TT routes’ distinct content and behavior, but do not introduce unrelated tracking configuration while copying them.

## Integration details
- Add the source-specific pages, providers, localized copy, reinforcement renderers, path helpers, and visual loaders as focused files rather than altering unrelated current funnels.
- Reuse this project’s existing shared controls, theme tokens, API client, scoring utilities, and funnel types where behavior matches.
- Merge only the additional state fields and route mappings required by these experiences.
- Update seed data and API tests for the new flow IDs, exact question counts, question metadata, and answer keys.
- Add a shared completion adapter used by all imported IQ funnels so report and add-on payloads cannot drift between variants.

## Verification
- Type-check and run focused tests for route loading, question API responses, stage transitions, scoring, completion persistence, IQ report hydration, all five add-on builders, entitlement gates, and blocked legacy routes.
- Run each funnel from intro through the payment placeholder on desktop and mobile.
- Exercise every question type: text, Likert, sequence, timed memory, word recall, personal, and visual puzzle; assert correct, incorrect, skipped, and self-report outcomes.
- Confirm all visual questions and answer options load with no missing assets, clipping, overlap, or blank states.
- Confirm language switching works throughout FF and survives refresh.
- Complete each funnel with controlled answers and verify its stored IQ payload produces the expected report values and non-empty personalized output from all five IQ add-on builders.
- Confirm the five new routes work directly while `/onboarding-rvr` and the other retired routes still show the 404 page.
- Confirm no PostHog, Klaviyo, or Breeze requests/scripts are introduced by these funnels.
