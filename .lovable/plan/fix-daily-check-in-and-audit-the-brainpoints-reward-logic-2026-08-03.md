# Fix daily check-in and audit the BrainPoints reward logic

## What's wrong today (verified in code)

1. **Daily check-in awards points on every page load.** `POST /dashboard/check-in` always adds 10 points with no same-day guard — it only recalculates the streak from `lastLoginDate`, then writes points regardless. Meanwhile `useBrainScore()` calls it on mount, and that hook is mounted on ~10 dashboard pages (twice inside `DashboardLayout`), so every navigation grants another 10 points.
2. **`already_checked_in` is fake.** The client maps the response with `already_checked_in: false` hardcoded, so the UI can never tell a repeat check-in from a real one.
3. **Two different level formulas.** Backend uses `floor(xp/100)+1`; the frontend (`src/lib/xp.ts`) uses a tiered curve (75/125/200/300/450/600, max level 30). Displayed level and progress bar disagree with the stored level.
4. **Activity points can be farmed by repetition.** `completeActivity` awards points every time an item is finished, even if a `completed` progress row already exists for that content.
5. **Likert tests re-award 25 points** on every retake in `TestsPage`.
6. **`POST /dashboard/add-xp` accepts any number** from the client — no validation or cap (negative and huge values pass through).
7. **Achievement grant races.** Achievement checks read stale `userAchievements` state, so a duplicate grant + duplicate points award is possible on rapid completions.

## The fix

### Check-in: once per UTC day (server-authoritative)
Rewrite the `check-in` handler:
- Compare `lastLoginDate` to today (UTC midnight). If already today: return `{ alreadyCheckedIn: true, xpGain: 0, streak, longestStreak }` and write nothing.
- Otherwise apply streak logic (consecutive day → +1, gap → reset to 1), award the bonus, and stamp `lastLoginDate`.
- Streak bonus becomes tiered instead of flat 10: 10 base, +5 at 3-day, +10 at 7-day, +25 at 30-day, with a milestone label returned so the existing celebration overlay fires only on real milestones.

Client side:
- `checkInDaily` maps the real `alreadyCheckedIn` / `milestone` fields instead of hardcoding.
- Move the check-in out of per-page mounts: fire it once per session from a single owner (the authenticated layout) guarded by a module-level in-flight/completed flag plus a `lastCheckIn` date key in localStorage, so page navigation never re-hits it. Toast only when points were actually awarded.

### Points hardening
- Single source of truth for levels: backend imports/duplicates the same tiered curve as `src/lib/xp.ts` (shared constant) and clamps to level 30.
- `add-xp`: validate the amount is an integer between 1 and 500; reject anything else.
- Award activity points only on first completion: server checks for an existing `completedAt` row for that `contentType`/`contentId` before granting, so retries and retakes give no points (progress/score still updates).
- Same first-completion rule for Likert tests (25 points once per test id).
- Achievement grants use an idempotent create (catch unique violation) and re-read granted achievements from the server before awarding, so no double points.

### Verification
- Load several dashboard pages in a row and confirm exactly one check-in award, and that a second call in the same day returns `xpGain: 0`.
- Replay an already-completed puzzle/lesson and confirm the balance does not change.
- Confirm displayed level matches stored level after crossing a level boundary.

## Technical notes
Files touched: `api/src/dashboard/dashboard.controller.ts` (check-in, add-xp, progress, user-achievements), `src/services/dashboardService.ts`, `src/hooks/useBrainScore.ts`, `src/pages/dashboard/DashboardLayout.tsx`, `src/pages/dashboard/TestsPage.tsx`, `src/lib/xp.ts` (export shared curve), `src/constants/storage.ts` (new `LAST_CHECK_IN` key). No schema change required — `lastLoginDate`, `currentStreak`, `longestStreak`, and the `userId_contentType_contentId` unique key already exist.
