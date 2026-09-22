# Fix mobile upsell-card previews

## Cause
The sample-data choices are inside a non-wrapping `inline-flex` row. On a narrow screen, that row creates an oversized minimum page width. The site’s horizontal clipping then hides the overflow, so the upsell cards render wider than the visible phone area and appear cut off.

## Changes
- Keep the sample-data choices contained within the mobile viewport, with horizontal scrolling inside that control instead of widening the page.
- Allow the preview grid and each card wrapper to shrink to the available phone width.
- Preserve the current desktop grid, filters, sample personas, card copy, and card styling.

## Verification
- Check `/preview-upsells` at the current 320px mobile width.
- Confirm every card is fully visible, the page itself has no sideways overflow, and all filter/sample controls remain usable.
- Confirm the existing multi-column desktop layout is unchanged.
