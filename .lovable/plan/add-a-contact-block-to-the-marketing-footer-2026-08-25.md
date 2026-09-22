# Add a contact block to the marketing footer

Under the "About Life Scale" disclaimer card in the site footer, add a second block:

**Contact Life Scale:** We would love to hear from you. You can email us at help@life-scale.com or call us at (888) 574-7017.

## Details

- Edit `src/components/marketing/MarketingFooter.tsx`, adding a sibling block directly below the existing disclaimer card (line 61-63), styled the same way (bordered card, muted text) with the bold "Contact Life Scale:" lead-in matching the "About Life Scale:" treatment.
- Email renders as a `mailto:help@life-scale.com` link, phone as a `tel:+18885747017` link, both using the cobalt hover color used elsewhere in the footer.
- Contact details are static copy in the footer component; no changes to `src/content/legalCopy.ts` (it holds disclaimer/billing copy, not contact info).
