# Remove "fictional" from sample results

The word appears in one user-visible place and two code comments.

## Change

- `src/pages/SampleReportPage.tsx:101` — replace the caption "Example results for {person} — fictional, for illustration only." with "Example results for {person} — for illustration only."
- `src/data/sampleReports.ts` — reword the file comment (line 4) and the `person` field comment (line 19) so "fictional"/"Fictional" no longer appear.

No other copy, layout, or data changes.
