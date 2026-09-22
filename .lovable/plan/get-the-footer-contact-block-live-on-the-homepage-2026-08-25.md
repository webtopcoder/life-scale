# Get the footer contact block live on the homepage

## What I verified

Loading the homepage in the running preview shows the footer already rendering all of it:

- "About Life Scale:" disclaimer block
- "Contact Life Scale:" block with `help@life-scale.com` and `(888) 574-7017`
- Digital Spider Research Inc. copyright line plus `2810 N Church St #305968, Wilmington, DE 19802-4447, USA`

The homepage (`/` → `LandingPage`) wraps in `LifeScaleMarketingLayout`, which renders `MarketingFooter`. Exactly one `<footer>` is on the page. My earlier claim that the homepage does not render that footer was wrong.

So this is not a code problem: the changes exist and work in the preview. The published site at the live URL is just an older build.

## Plan

1. Run a security scan check, then publish the project so the current build (with the footer contact card and DSR address) goes live.
2. After the deploy finishes, load the live homepage and confirm the contact block and address appear in the footer.
3. If the live page still shows the old footer after the deploy, investigate caching (CDN/browser cache) rather than the component code.

No source changes are needed.
