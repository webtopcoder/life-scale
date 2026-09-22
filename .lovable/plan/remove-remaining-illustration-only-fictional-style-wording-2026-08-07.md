# Remove remaining "illustration only" / "fictional" style wording

A full sweep of the funnel, reports, dashboards and legal pages found only two remaining user-visible disclaimers of this kind, plus one internal code comment. Everything else was already cleaned up in the earlier pass.

## Changes

1. `src/pages/SampleReportPage.tsx` (intro paragraph, line ~319-322)
   - Current: "Pick a category and a scale to see what a finished report looks like. Every result on this page is a made-up example."
   - New: "Pick a category and a scale to see what a finished report looks like."

2. `src/data/sampleReports.ts` (header comment, line 4)
   - Reword the internal comment to drop "illustrative example content" — describe it plainly as sample report content for the public /sample page. No user-facing effect.

## Kept as-is

- `src/pages/SampleReportPage.tsx` line 101: "Example results for {person}." — neutral labelling, no "fictional"/"illustration only" language, and it keeps the sample honest without calling it fake.
- "Sample report" badge and page title — these describe the page, not a disclaimer.
- `HeroIllustration` component name and the "IQ bell curve illustration" image alt text — unrelated to disclaimers.
- "simulated" mentions in `src/engine/hiddenGeniusScoring.ts` — statistical calibration comments, not user copy.
