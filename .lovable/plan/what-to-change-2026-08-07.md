Remove "for illustration only" disclaimer from the sample report page.

## What to change
- In `src/pages/SampleReportPage.tsx` line 101, remove the trailing phrase ` — for illustration only.` from the example-results line.
- The remaining text should read: `Example results for {sample.person}.`

## Verification
- Search the project again to confirm no "for illustration only" / "illustration only" strings remain.
- Build the project to ensure no TypeScript/JSX errors are introduced.
