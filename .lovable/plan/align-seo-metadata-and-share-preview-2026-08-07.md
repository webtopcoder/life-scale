# Align SEO metadata and share preview

## What's already correct

- The new three-teardrop mark is the favicon (`public/favicon.png`, 64x64) and the single shared logo asset (`src/assets/iq-scale-logo.webp`) used by `IQScaleWordmark`, which every header, footer, funnel, dashboard and report page renders. No stale logo files remain.

## What does not match

1. **Head metadata is pre-repositioning.** `index.html` still says "a cognitive framework with three session branches: IQ Test, Brain Health Test, and Hidden Genius Test" in the title, description, `og:*` and `twitter:*` tags. The product is now six scales across Mind and Body, with more categories coming.
2. **Share-link tags are incomplete.** No `og:url`, no `og:site_name`. Without `og:url`, crawlers can attribute previews inconsistently.
3. **In-app share text is off-brand and points to a domain that isn't live.** `src/components/report/ShareModal.tsx` shares `https://iq-scale.com` with copy "I scored X on my IQ test!" — hardcoded to one scale and to a domain that isn't the published site.

## Changes

**`index.html`**
- New title (<60 chars) and description (<160 chars) built on the current positioning ("We give you the IQ of You" — scored scales across Mind, Body, and more).
- Mirror them into `og:title` / `og:description` / `twitter:title` / `twitter:description`.
- Add `og:site_name` and `og:url` pointing at `https://brainwave-booster-47.lovable.app/`.
- No `og:image` — Lovable hosting injects the social preview at serve time.
- Keep the page as-is with no `canonical` or `sitemap` additions (per request, no crawler signals).

**`src/components/report/ShareModal.tsx`**
- Point `shareUrl` at the published domain and make the share copy scale-neutral instead of hardcoding "IQ test".

## Notes

- Because this is a static SPA, only `index.html` metadata is visible to social crawlers — per-route previews would need SSR. This plan targets one accurate site-level set of tags.
- Changing a preview won't refresh instantly; crawlers cache the last scrape.
