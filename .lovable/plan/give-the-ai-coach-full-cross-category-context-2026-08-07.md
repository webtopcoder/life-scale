# Give the AI Coach full cross-category context

## What's wrong today

The coach's context is built in `api/src/ai/ai.controller.ts` (`coachChat`):

- It fetches the user's test completions, then only sends **the 3 most recent** into the prompt (`completions.slice(0, 3)`). A Complete subscriber who has finished Mind and Body scales can have up to 6 completions, so the coach silently loses half of them — and which half depends on completion date.
- The Focus filter still scopes to a **single scale** (`branch: profile.entitledBranch`), but Focus now entitles a whole **category**. A Focus (Mind) user's coach can't see Brain Health or Hidden Genius results.
- Nothing tells the model which scales/categories the user owns, which are still untaken, or how each scale is meant to be read, so it can't say "you haven't done Sleep Health yet" or compare across categories.

## What to build

1. **Complete = everything.** For `complete`, send every completion the user has, one compact record per scale — no `slice`. Keep each record small (scale key, category, completion date, headline result/archetype, category sub-scores) so 6 scales still fit comfortably in the prompt instead of dumping raw payloads.
2. **Focus = its whole category.** Replace the single-branch filter with a category filter: expand `entitledBranch` to its category and include every scale in that category.
3. **Structured context block.** Build the system prompt from a small summary object instead of raw JSON dumps:
   - plan tier and what it covers (which categories/scales are unlocked),
   - per-scale summaries for completed scales, grouped by category,
   - a list of unlocked-but-not-yet-taken scales,
   - existing profile bits (streak, level).
4. **Coaching instructions.** Tell the model it may compare and connect findings across categories for Complete users (e.g. sleep quality against cognitive results), and to reference only scales present in the context — never invent results for untaken scales.

## Technical notes

- Scale/category mapping currently lives in the frontend registry `src/config/scales.ts`. The API can't import it, so add a small server-side map (scale key → category, role, display name) in the api package and drive both the Focus filter and the grouped prompt from it.
- Summarisation happens per `TestCompletion.payload`; write one normaliser that pulls a short result line per scale role (core → score + band, health → status band, hidden → archetype) with a safe fallback for unrecognised payload shapes.
- No schema, entitlement, or frontend changes; access checks (`complete`/`focus` only) stay exactly as they are.
- Verify with a real request through `POST /ai/coach/chat` for a Complete test account with completions in more than one category, and confirm the streamed answer references scales from both.
