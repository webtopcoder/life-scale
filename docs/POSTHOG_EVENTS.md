# PostHog Event Tracking – Summary for Client

This document lists all custom events and actions we track in PostHog so you can analyze funnels, conversion, and engagement.

---

## 1. Landing & Entry

| Event | When It Fires | Properties (for filtering/breakdown) |
|-------|----------------|--------------------------------------|
| **cta_clicked** | User clicks "Start Test" (any placement on landing) | `cta: start_test`, `location: landing` |
| **cta_clicked** | User clicks "See a sample result" or "See Sample Report" | `cta: view_sample_report`, `location: landing` |

---

## 2. Onboarding / IQ Funnel

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **onboarding_started** | User reaches the first onboarding screen (intro with gender question); fires when the intro page is shown, before any action | (none) |
| **funnel_step_completed** | User selects gender and starts the test (intro) | `step: intro`, `action: gender_selected`, `gender` (male/female) |
| **assessment_question_answered** | User answers or skips each IQ question | `question_number`, `total_questions`, `is_skip` (true/false), `category` (when answered) |
| **funnel_step_completed** | User finishes the full IQ assessment | `step: assessment`, `completed_questions` |
| **funnel_step_completed** | User clicks "Continue" after a reinforcement screen | `step: reinforcement`, `reinforcement_count` |
| **funnel_step_completed** | User clicks "Continue" on social proof (v2) | `step: social_proof_2` |
| **funnel_step_completed** | User clicks "I Understand" after calculating | `step: calculating_2` |
| **funnel_step_completed** | User submits a valid email to unlock results | `step: email_capture_2` |

The main onboarding flow (v1) also fires **funnel_step_completed** with `step: social_proof`, `calculating`, `email_capture` for the same user actions, so analysts can include both flows in funnels.

---

## 3. Checkout & Payment

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **checkout_cta_clicked** | User clicks any payment/CTA on checkout (e.g. "Get My IQ Score Now") | `location: checkout_2`, `button: primary` |
| **checkout_cta_clicked** | User clicks **Get My Report** on the plans funnel plan-selection page | `location: checkout_plans`, `button: primary`, `plan_id` (`1w` / `4w` / `12w`) |
| **checkout_completed** | User completes checkout and proceeds to report/upsells | `step: checkout_2`, `revenue_cents` (trial amount paid; **100** = $1.00 discounted trial) |
| **checkout_completed** | User completes plans-funnel payment | `step: checkout_plans`, `plan_id`, `revenue_cents` (499 / 1499 / 2999) |

The v1 funnel also fires **checkout_cta_clicked** with `location: checkout` and **checkout_completed** with `step: checkout`, `revenue_cents: 100` ($1.00 trial). The v2 funnel uses `revenue_cents: 100` as well.

---

## 4. Upsells (Post-Checkout & Dashboard)

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **upsell_purchased** | User buys an upsell (Weakness Report, Genius Blueprint, or Brain Coach) | `product` (weakness_report / genius_blueprint / brain_coach), `price_cents`, `revenue_cents` (amount paid; use for revenue reporting), `is_bundle` (for Genius Blueprint when applicable), `location: dashboard_home` when bought from dashboard, `is_win_back` when from dashboard |
| **upsell_skipped** | User clicks "No thanks, skip" on an upsell | `product` (weakness_report / genius_blueprint / brain_coach) |

---

## 5. Report & Dashboard Entry

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **cta_clicked** | User clicks "Start Your Brain Growth Plan" (go to dashboard) on the report | `cta: go_to_dashboard`, `location: report` |
| **dashboard_card_clicked** | User clicks a quick-start card on dashboard home (e.g. Tests, Brain Teasers, Puzzles, Lessons) | `card` (e.g. card title) |

---

## 6. Dashboard Activities (Tests, Brain Teasers, Puzzles, Lessons)

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **activity_started** | User opens a test, brain teaser, puzzle, or lesson (clicks the card) | `activity_type` (test / brain_teaser / puzzle / lesson), plus type-specific: e.g. `test_id`, `test_title`, `is_likert` for tests; `content_id`, `format`, `difficulty` for teasers/puzzles; `content_id`, `title`, `category` for lessons |
| **activity_completed** | User completes the activity and it's saved | `activity_type`, `content_id` (or `test_id` for tests), `score`; for tests also `percentage`, `result_label`, `total_score`, `max_score`; for puzzles also `mode` (e.g. timed/relaxed); for lessons also `title` |

---

## 7. Auth & Account

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **auth_login_success** | User signs in successfully | (none) |
| **auth_login_failed** | Login fails (e.g. wrong password) | `reason` (error message) |
| **auth_signup_success** | User signs up successfully | (none) |
| **auth_reset_password_requested** | User successfully requests a password reset email | (none) |

Logged-in users are also **identified** in PostHog by user ID so all later events can be tied to the same person.

---

## 8. Resume / Start Over

| Event | When It Fires | Properties |
|-------|----------------|------------|
| **funnel_session_resumed** | User chooses "Resume" when shown an in-progress session | (none) |
| **funnel_session_started_over** | User chooses "Start over" instead of resuming | (none) |

---

## How You Can Use This in PostHog

- **Funnels:** e.g. Landing → Start Test → Intro (gender) → … → Email → Checkout → Report; or Upsell view → Purchase/Skip per product.
- **Conversion:** Filter by `activity_type` to see completion rates for tests, brain teasers, puzzles, and lessons.
- **Drop-off:** Use `funnel_step_completed` and `step` to see where users leave the IQ flow. Compare **onboarding_started** vs **funnel_step_completed** (step: intro) to measure drop-off before the first question (gender).
- **Revenue:** Sum `revenue_cents` on **checkout_completed** (trial) and **upsell_purchased** (upsells). Use `product`, `location`, and `is_win_back` on upsell_purchased to compare funnel vs dashboard upsells.

All events include a `source: web` property so you can separate web from other sources if you add them later. No passwords or email addresses are sent in event properties; user identity is handled via PostHog's identify (user ID only).

When the user landed with UTM query parameters, all events may also include: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content` (first-touch per session), so you can filter and break down funnels by campaign.
