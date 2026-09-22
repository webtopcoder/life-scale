# Point the preview funnel to the development API

## Confirmed cause
- The current preview uses `https://api.life-scale.com`, whose response does not allow the Lovable editor origin.
- `https://api-dev.life-scale.com` accepts that origin, successfully saves sessions, and serves all 36 RVR2 questions.

## Change
1. Set `VITE_API_URL="https://api-dev.life-scale.com"` in the project environment file.
2. Verify `/onboarding-rvr2` starts normally, displays question 1, and saves the session without the warning or blank screen.

No funnel content, scoring, layout, or production API configuration will change.
