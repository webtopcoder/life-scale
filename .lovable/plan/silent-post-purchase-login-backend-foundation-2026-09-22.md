# Silent post-purchase login: backend foundation

## Scope

Implement only Phases 1–4 now. Do not change checkout authorization, fields, prices, offers, upsell sequencing or redirects, conversion tracking, existing authenticated behavior, report generation timing, or Cognito-protected dashboard/report APIs.

## Database

- Add `CheckoutHandoff` to the Prisma schema with the requested lifecycle fields, expiry, transaction/user bindings, and lookup indexes.
- Create a checked-in Prisma migration named `add_checkout_handoff` without changing existing tables or purchase records.
- Generate the Prisma client so the API can use the new model.

## Public handoff API

- Add a dedicated billing handoff controller and service logic for:
  - `POST /billing/handoff/create`: validate and normalize inputs, generate a 32-byte random secret, store only a bcrypt hash, expire it after two hours, and return `null` rather than interfering with checkout if persistence fails.
  - `POST /billing/handoff/exchange`: accept only the raw handoff secret, compare it against eligible paid records, atomically consume exactly one matching record, and return a 15-minute signed report grant.
- Add per-IP rate limits of 5 create requests and 10 exchange requests per minute.
- Never log secrets, grants, or challenge material.
- Add the required bcrypt dependency and use the existing JWT library for report grants.

## Webhook binding

- After the existing checkout fulfillment has found/created the Cognito account and recorded the purchase, find the newest unexpired pending handoff matching normalized email and exact offer ID.
- Atomically move it to `paid` and bind the provider transaction ID and Cognito user ID.
- Keep this best-effort: missing handoffs or binding errors are logged without failing payment fulfillment or webhook acknowledgment.

## Configuration

- Add `REPORT_GRANT_SECRET` to the API configuration contract without committing a value.
- Generate and securely store the runtime signing secret in the deployment environment when that environment is available; do not put it in source control.
- Phase 5 Cognito triggers and all frontend work remain deferred until this backend foundation is deployed and verified.

## Tests and verification

- Add API tests for create success, silent create failure, valid exchange, wrong/expired/consumed secrets, and replay prevention.
- Verify migration SQL, Prisma generation, focused API tests, and static checks.
- Confirm existing billing fulfillment behavior remains unchanged when no handoff exists.

## Technical note

The API runs on horizontally scalable Lambda instances, so rate limiting will use a shared persistence-safe mechanism rather than relying only on one process's memory. The exchange consumes a record with a conditional database update to prevent replay under concurrent requests.  
  
