# Resumify production review (main @ `50d12b63f16afc679c04fd72326b5d072d0fcb04`)

Date: 2026-09-23. Defensive source review and safe read-only checks only; no live payment/auth mutation tests were attempted.

## Changes made locally

- Fixed unsafe external links in CV publications. Previously `src/lib/templates/render.ts` emitted user-supplied `pub.url` directly into `href`; a `javascript:` URL could execute when a public share is rendered. All external links now go through `ensureUrl`, which allows only HTTP/HTTPS URLs, and unsafe values render as text/no link.
- Hardened auth redirects in email login, Google OAuth, and OAuth callback against protocol-relative/backslash/scheme-like redirect URLs.
- Removed webhook-triggered payment confirmation from exported Server Actions; moved it into a `server-only` module called by the webhook route after its secret check.
- Removed broad anonymous row-level SELECT access to shared CVs. Share-page lookup now uses a `server-only` service module that checks the opaque slug and owner’s current entitlement; public share pages carry `noindex` metadata.
- Added database enforcement for Pro-only templates/sharing and active Pro expiry, including direct PostgREST writes; expired Pro accounts now fall back to Free CV creation limits.
- Preserved valid bare host:port publication links while filtering unsafe URL schemes; added a regression test.
- Escaped the user-controlled CV title in the server-generated PDF HTML `<title>` in `src/lib/templates/styles.ts`; this avoids HTML/script injection in the document passed to headless Chromium.
- Updated Next.js and its ESLint config to 16.3.6 and refreshed lockfile dependencies. `npm audit` now reports 0 vulnerabilities; the original locked Next.js 16.2.11 had one critical and several high advisories in the current audit database.
- Added Node test runner/tsx and tests for publication URL scheme filtering and the database profile-field guard.
- Hardened database schema functions: pin SECURITY DEFINER `search_path`, restrict sensitive payment RPC execution to `service_role`, and allow trusted service role/database-owner plan updates while retaining the non-admin guard.

## Validation

- `npm test`: 8 tests passed.
- `npm run build`: passed on Next.js 16.3.6.
- `npm run lint`: 0 errors, 3 existing warnings in `legacy/js/app.js` (lines 19, 27, 585).
- `npm audit`: 0 vulnerabilities.
- `git diff --check`: passed.
- Live site read-only check: home returns HTTP 200; unauthenticated `/dashboard` and `/admin` redirect (307); unauthenticated payment status and webhook requests return 401. The curl output was discarded to avoid collecting page data.

## Independent privacy/authorization review

The original commit had two additional high-impact access-control gaps: anonymous PostgREST could enumerate all shared CV rows (the application page's slug filter did not constrain direct table API queries), and Free users could set `is_public/share_slug` directly because Pro sharing was checked only in the Server Action. The local changes remove broad anonymous row access, route token lookup through server-only code, and add database enforcement for Pro-only templates/sharing. Admin RLS can still read full CV content; the admin UI currently requests only a count, so least-privilege column/table policy separation remains recommended. Residual risks observed in the original-code review that remain unaddressed in this local patch include request-header-derived auth origins, incomplete runtime validation/body limits/rate limits, and raw internal/provider error messages reaching users/logs. Add production allowlisted auth URLs and sanitize errors.

## Production blockers / high-priority follow-up

1. **Database schema has not been applied or verified against your Supabase instance.** The local fixes to `supabase/schema.sql` need a migration/review and must be applied before claiming the database/payment flows are fixed. Existing public share links will need compatible migration/testing because direct anonymous table access is now disabled. No live database was modified.
2. **Expired subscriptions must not retain app-level Pro features.** The server actions now consult `plan_expires_at`, and DB triggers prevent direct expired-Pro use of Pro templates/sharing and apply the Free CV creation cap. No billing/expiry reconciliation job exists; decide how existing over-limit accounts are handled and run it in staging.
3. **Payment integrity needs a real PSP/bank source of truth.** Current QRIS auto-confirm endpoint matches on amount only (`src/app/api/payments/webhook/route.ts`, `src/lib/actions/payments.ts`). A shared bearer secret authenticates the request but does not prove a transfer; a leaked/replayed secret plus guessed pending amount could grant Pro without payment. Keep auto-confirm disabled until the bank/provider signature, transaction ID, amount, destination account, credit direction, and replay/idempotency checks are implemented. Manual confirmation should verify settlement in the merchant portal.
4. **Protect profile identity fields.** RLS lets users update their own profile row. The trigger protects plan/admin fields, not email/name/avatar; do not rely on these as identity claims. Prefer column-level update grants or a controlled function, with email sourced/verified from Auth.
5. **Do not treat the local patch as shipped.** It is in an audit clone at `C:\Users\user\AppData\Local\hermes\cache\scratch\resumify-audit`, not committed or pushed. Review, deploy, apply DB changes through migration, and verify staging first.

## Additional readiness work

- Add automated Supabase integration tests for RLS (cross-user reads/updates, public share read-only, profile role escalation blocked), payment RPC permissions, atomic/duplicate webhook processing, expired invoices, and simultaneous invoice creation.
- Validate and bound all CV input shape/length before persistence/render/PDF; add PDF request rate/size limits and PDF resource quotas to prevent expensive render abuse.
- Add rate limits for signup/login/payment creation/PDF/webhook and request body size limits for webhook; monitor repeated failed webhook auth and PDF resource exhaustion.
- Make payment settlement idempotent with immutable provider transaction identifiers. Avoid fragile invoice matching via a narrow random suffix on a static merchant QRIS for production at meaningful payment volume.
- Add CI gates for install/build/lint/test/audit; deployment preview and staging smoke checks. Set Supabase auth allowed redirect URLs for production only, require email confirmation, MFA for admins, and least-privileged secrets.
- Review privacy/legal pages: account deletion currently directs users to contact admin, while no visible contact details are provided in that page; add clear support/contact and retention/deletion procedures.
- Add backups/PITR, recovery drill, error monitoring, uptime alerting, audit logs for admin/payment changes, and incident response/contact ownership.

## Scope limits

This was a source review plus public home/auth-gate probes, not a full penetration test. No Supabase credentials were available, so no RLS database test, staging end-to-end account test, bank QRIS settlement verification, admin MFA check, or private environment/config review was performed. Production readiness is **not yet proven** until those gates are done.

## External security references

- Supabase guidance: `SECURITY DEFINER` functions need pinned `search_path`, and function grants must be treated separately from RLS; default function execution can be available to API roles if not revoked.[1][2]
- PostgreSQL documentation: newly created functions grant `EXECUTE` to `PUBLIC` by default; revoke and selectively grant for privileged routines.[3]
- Next.js security update: Next.js `>=16.2.0 <16.3.6` is affected by a critical Node `ImageResponse` issue; patched version used in this local clone is 16.3.6.[4]

## Sources

[1] https://supabase.com/docs/guides/database/functions
[2] https://supabase.com/docs/guides/api/securing-your-api
[3] https://www.postgresql.org/docs/current/sql-createfunction.html
[4] https://nextjs.org/blog/nextjs-security-update-september-22-2026

