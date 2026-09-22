# Auto-scroll to top on category confirmation in Choose Tier

## Goal
When a user selects a non-Complete plan (Insight, Guide, or Focus) in the homepage sign-up funnel, the page reveals a category picker. Ensure that picker renders scrolled to the top of the page so the heading and category choices are visible immediately.

## What to change

In `src/pages/funnel/ChooseTierPage.tsx`, add a small effect that runs whenever the category-confirmation branch picker becomes visible (`selectedTier` is set to a non-null value other than `'complete'`). The effect should call `window.scrollTo({ top: 0, behavior: 'instant' })` so the transition feels instant and reliable, matching the existing `ScrollToTop` pattern used across the funnel.

## Scope

- Homepage sign-up funnel only (`/choose-tier`).
- Upgrade mode (`/upgrade/:branch`) is unchanged because it does not show a category picker.
- Preview mode (`/preview-signup/choose-tier`) also benefits, because the same component and branch-picker branch is reused.
- No routing, pricing, or state changes.

## Verification

- Open `/preview-signup/choose-tier`.
- Scroll down and select Insight, Guide, or Focus.
- Confirm the page jumps to the top and the "Which category do you want?" heading is visible without manual scrolling.
