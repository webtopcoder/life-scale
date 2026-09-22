Update the Transaction Total selector on the Help page contact form so it only offers the recurring subscription price points: $7.99, $13.99, $29.99, $39.99.

## Files to edit
- `src/pages/HelpPage.tsx`: replace the existing amount button array at the refund transaction total selector.

## Technical details
- Current array: `['$1.00', '$2.99', '$4.99', '$9.99', '$14.99', '$19.99', '$29.99', '$39.99']`
- New array: `['$7.99', '$13.99', '$29.99', '$39.99']`
- No other component file contains this array; add-on and checkout trial copy elsewhere should remain unchanged because it reflects real business logic, not the refund form selector.

## Verification
- Run a type check with `tsgo`.
- Use Playwright to open `/help`, click "Request a Refund", and confirm the buttons now show only the four recurring prices.
