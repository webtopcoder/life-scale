# Replace the brand logo everywhere

Swap the current brain-earth logo mark for the uploaded navy lightbulb mark, so every header, footer, funnel page and the browser tab icon use the new mark.

## What changes

- Add the uploaded lightbulb as an optimized in-repo asset (`src/assets/iq-scale-logo.webp`, transparent background preserved as PNG source if needed).
- Point the single shared logo component (`src/components/marketing/IQScaleWordmark.tsx`, used by `MarketingHeader`, `MarketingFooter`, `IQScaleMarketingLayout`, the funnel pages and upsell pages) at the new asset. This covers every place the mark currently appears in one edit.
- Update the favicon: square 64x64 copy at `public/favicon.png`, referenced from `index.html`, and remove the stale default icon file if present.
- Retire `src/assets/brain-earth-logo.webp` once no references remain.

## Notes

- The wordmark text "IQ Scale" next to the mark stays unchanged.
- Sizes stay as-is (28px default, per-page overrides untouched), so no layout shifts.
- Asset stays in-repo and optimized, per project asset rules — no CDN pointers.
