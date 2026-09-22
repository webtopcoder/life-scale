# Careers role cards: balance copy and tone

## Goal
Improve the two role cards on `/careers` so they share the exact same structure (one focus sentence + three "What you will own" bullets) and roughly the same word count, while making the Media Buyer copy as plain and friendly as the Product Manager copy. Remove any technical or jargon-heavy language.

## Proposed changes
Edit the `ROLES` array in `src/pages/CareersPage.tsx`.

### Media Buyer
- **Focus:** Find the right people and invite them to try Life Scale.
- **Owns:**
  1. Create the messages and creative ideas that bring people in.
  2. Try different channels to see where our future users spend time.
  3. Keep what works, share what you learn, and help the team grow.

### Product Manager
- **Focus:** Shape the Life Scale experience people come back to every day.
- **Owns:**
  1. Decide what we build next based on what our users need most.
  2. Work with design and engineering to ship features that feel effortless.
  3. Listen to feedback and keep improving the product.

## Technical details
- File to edit: `src/pages/CareersPage.tsx`
- Update only the `ROLES` constant (lines 12-31).
- Preserve the existing rendering layout: each role renders a heading, a focus paragraph, a section label, and a three-item bullet list.
- No changes to the application form, API, or routing.
