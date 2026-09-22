# Life Scale rebrand cleanup

The visible name is already "Life Scale" everywhere in the UI, and the tagline "The IQ of You" stays as agreed. What is left are two things: internal code still named after the old brand, and legal/support prose that frames the whole product as an IQ/cognitive testing service rather than a multi-category scoring platform.

## 1. Reword copy that ties the brand to IQ

Scale names stay as they are (IQ Test, Body IQ Test, etc.). Only surrounding prose changes so the platform reads as "scores across categories", with IQ as one scale among many.

- Terms: definition of "Service", the welcome paragraph, the disclaimer section, data-use bullets and liability bullets currently say "IQ assessments, cognitive ability tests, brain training". Reword to "assessments, scored scales, reports, and improvement tools across categories such as Mind and Body", keeping the same legal meaning and the existing not-clinical language.
- Privacy: "Assessment Responses", "Profile Data", and processing-purpose bullets currently reference IQ scores and cognitive training. Reword to scale results, scores, and category dashboards.
- Cookies and Refund pages: sweep for the same brain/IQ-only framing.
- Help page: sweep FAQ and support copy for any remaining IQ-only or brain-only framing of the product itself.
- Marketing pages get a read-through to confirm nothing describes the brand as an IQ-testing company; the hero, footer tagline, and page titles keep "The IQ of You".

Disclaimer, billing, and descriptor text keeps coming from the central legal copy module — no wording gets hardcoded into pages, so the existing drift guard still passes.

## 2. Rename old-brand code identifiers

Behaviour-neutral renames, done with all references updated in the same pass:

- `IQScaleWordmark.tsx` → `LifeScaleWordmark.tsx`, exporting `LifeScaleWordmark` / `LifeScaleMark`.
- `IqScaleHeader.tsx` → `LifeScaleHeader.tsx`; `IQScaleMarketingLayout.tsx` → `LifeScaleMarketingLayout.tsx`.
- Funnel page files `IqScaleAssessmentPage`, `IqScaleReinforcementPage`, `IqScaleCalculatingPage` keep their route behaviour; they belong to the IQ Test flow, so they are renamed to `IqTest*` names to make clear they are the IQ scale, not the brand.
- CSS wrapper classes `.iqscale-root` / `.iqscale-theme` → `.lifescale-root` / `.lifescale-theme`, updated in `src/index.css` and every page that applies them.
- Logo asset `src/assets/iq-scale-logo.webp` → `life-scale-logo.webp` with imports updated.
- Comments and doc headers mentioning IQScale updated.

Left untouched on purpose:

- `localStorage` keys (`iqscale.hgState`, etc.) — renaming them would wipe in-progress user state.
- The `--iq-*` design-token names and `iq-btn`/`iq-card` utility classes — purely internal, and renaming them touches nearly every file for no user-visible gain.
- Flow IDs such as `IQSCALE_V1`, which are database values shared with the API and seeds.

## 3. Verify

- Typecheck plus the existing legal-copy and sample-report test suites.
- Grep to confirm no user-visible "IQ Scale" string remains and no stale import paths.
- Load the landing page, one report, and the legal pages in the browser to confirm styling still applies after the CSS class rename.
