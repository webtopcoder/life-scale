# Funnel migration

- [x] Import and wire RVR2 and RVR2-TT flows
- [x] Import and wire 888 and 888-TT flows
- [x] Import and wire FF multilingual flow
- [x] Add exact question datasets and resolve RVR2 flow-ID collision
- [x] Bring over every required visual asset as an in-repo binary
- [x] Connect all flows to canonical IQ report completion data
- [x] Verify all five IQ add-ons against imported completions
- [x] Preserve retired-route 404 behavior and excluded integrations
- [x] Validate desktop/mobile journeys and automated checks

# Imported funnel checkout and IQ upsells

- [x] Add route-specific production offer configuration slots
- [x] Wire imported checkout layouts to the Life Scale production widget
- [x] Add the ordered five-step IQ upsell sequence ending at the IQ Report
- [x] Add the supplied production offer, route, flow, and flow-tag metadata to all five checkout widgets
- [ ] Validate a live purchase through all five upsells (blocked: requires a real payment transaction)
- [x] Start imported purchases at upsell step 0 and finish the sequence on the thank-you page
- [x] Retry newly created Sirius customer readiness and prevent `/embed/checkout` 404 fallbacks

# Home checkout legal links

- [x] Replace the widget's fragment-only Terms and Privacy links with Life Scale legal pages
- [x] Link Help Center directly to cancellation and remove email cancellation wording
- [x] Verify all widget and checkout-footer links in the browser

# RVR2 editor preview

- [x] Point the preview frontend to `api-dev.life-scale.com`
- [x] Verify RVR2 starts and saves without a blank screen

# IQ Scale funnel branding

- [x] Scope `IQ Scale` to IQ, RVR2, 888, and FF funnels
- [x] Verify intro and assessment headers across all six funnel routes

# RVR2 email page

- [x] Copy the current TrueIQ RVR2 V2 email screen
- [x] Verify both RVR2 variants and email handoff to checkout

# Imported checkout duplicate totals

- [x] Remove the duplicate total from RVR2, RVR2-TT, 888, and 888-TT
- [x] Verify all four widgets remain visible with no separate total above them

# Purchase-path loop prevention

- [x] Route existing-subscriber upgrades through trial selection and payment
- [x] Preserve all six scale keys through upgrade checkout
- [x] Skip the login screen for signed-in homepage buyers
- [x] Show Dashboard instead of Login in the signed-in purchase header
- [x] Preserve the requested purchase page when authentication expires
- [x] Verify signed-in upgrade and homepage journeys reach payment without loops

# Seamless imported-funnel checkout handoff

- [x] Make email a normal stage in RVR2, RVR2-TT, and FF
- [x] Remove legacy checkout email overlays and preloading from all five funnels
- [x] Preserve validation, persistence, analytics, offers, payments, and upsells
- [x] Verify email, resume, back, and checkout journeys without loops

# Tracked RVR2 checkout access

- [x] Normalize trailing-slash imported-funnel paths without removing attribution parameters
- [x] Verify the tracked RVR2 URL resolves the checkout configuration with attribution intact

# Final upsell CTA wording

- [x] Change the final IQ, Brain Health, and Hidden Genius upsell buttons to `ADD + GO TO REPORT`

# Silent post-purchase login

- [x] Add checkout handoff storage, public create/exchange endpoints, shared rate limits, and webhook binding
- [ ] Apply the checked-in migration and provision `REPORT_GRANT_SECRET` (blocked: development database and AWS secret store are unavailable here)
- [ ] Add Cognito custom-auth triggers (deferred to Phase 5)
- [ ] Add flagged frontend handoff creation, exchange, and IQ report grant access (deferred to Phases 6–9)
- [ ] Stop including generated passwords in new-account email (deferred to Phase 10)