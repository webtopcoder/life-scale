# Pricing card "Sign up" enters the real signup flow

The four "Sign up" buttons in the homepage pricing section should start the same funnel as the hero "Start Test" button, in the same order shown at `/preview-signup`:

```text
Choose your test -> Create account -> Choose your plan -> Trial offer
```

## Behavior

- Clicking "Sign up" on a plan card remembers that plan (Insight, Guide, Focus, or Complete) and goes to the first step, "Choose your test".
- The plan step is still shown later in the flow, with the clicked plan visually highlighted as the current pick, so the person can change their mind.
- The hero "Start Test" button is unchanged: no plan preselected, no card highlighted.

## Technical notes

- `src/pages/LandingPage.tsx`: add a `handlePlanSignup(planId)` handler that writes `setFunnelValue('selectedTier', planId)`, fires the existing `CTA_CLICKED` event with `cta: 'signup_<plan>'`, then navigates to `/choose-test`. Wire each pricing card button to it instead of the shared `handleStart`.
- `src/pages/funnel/ChooseTierPage.tsx`: read `getFunnelValue('selectedTier')` on mount and use it purely for presentation — mark that tier's card as preselected/highlighted. No change to the click/checkout logic; the user must still confirm a plan to advance.
- No routing, pricing, billing, or preview-route changes.
