# Turn the affiliate program into a hiring funnel

Replace the affiliate application page with a careers page for four roles: Media Buyer, Growth Lead, Creative Strategist, Product Manager. No database migration — submissions reuse the existing affiliate applications storage with remapped fields.

## New page: /careers

- Headline positioning Life Scale as a performance-driven consumer product team, with a short intro on what the team does and how it works.
- Four role cards (Media Buyer, Growth Lead, Creative Strategist, Product Manager), each with a one-line focus and 3 short "what you'll own" bullets. Clicking a card preselects that role in the form.
- Application form (all required):
  - Full name
  - Email
  - Role applying for (select: the four roles)
  - Portfolio / LinkedIn URL
  - Experience note (textarea, what you've shipped and results)
- Same success state as today, with copy adjusted for applications ("We review every application and reply within 5 business days.").
- Visual language matches the existing marketing pages (cobalt accents, mint wash cards, no emojis).

## Routing

- `/careers` renders the new page with the marketing header.
- `/affiliates` redirects to `/careers` so old links keep working.
- Footer "Affiliates" link becomes "Careers" pointing at `/careers`.

## Backend (no migration)

Field mapping onto the existing `affiliate_applications` record:

```text
fullName      -> fullName
email         -> email
businessName  -> role applied for
trafficSource -> role applied for (kept in sync; column is non-null)
websiteUrl    -> portfolio / LinkedIn URL
comment       -> experience note
```

The existing `POST /affiliates/applications` endpoint and DTO stay as-is; only the frontend payload composition changes. Nothing else in the API is touched.

## Technical notes

- New file `src/pages/CareersPage.tsx`; delete `src/pages/AffiliatesPage.tsx`.
- Roles list defined as a const in the page and reused by both the cards and the select.
- Client-side validation: required fields, URL must start with `http`, max lengths matching current DB-safe limits (100 / 255 / 500 / 1000).
- Update `src/App.tsx` (route + redirect) and `src/components/marketing/MarketingFooter.tsx` (label + link).
- SEO: page title "Careers at Life Scale" and a matching meta description on the route.
