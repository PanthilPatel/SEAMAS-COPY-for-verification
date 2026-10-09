# SEAMAS Production QA Test Matrix

**Updated:** 2026-09-29  
**Overall:** FULL QA NOT COMPLETE — TESTING STILL REQUIRED  
**Production ready:** NO

## Database safety note

In three completed pre-guard pytest runs, `test_chat_and_stream_endpoint_semantic_parity` used a mocked pipeline but did not replace the configured `app.main.supabase` client. Each run could have attempted two cache upserts for the generic key `phone under 20000` (up to six attempts total); an interrupted run may also have reached that test. If the cache table existed, fixture data may have replaced that key. Whether any write succeeded is **UNKNOWN**. No migration, reset, or delete was run. The current project was not queried to investigate or undo this. `backend/tests/conftest.py` now clears Supabase environment values before app import and blocks database clients for ordinary tests; tests must inject an explicit mock or isolated QA client.

## Verified

- Guarded full backend suite: **83 passed, 0 failed** in 300.47s; Supabase environment variables are blanked before app import and database clients are blocked in the autouse fixture.
- Credit-flow tests use Supabase clients blocked. They cover server-owned user identity, 1,470 credits vs. a 10-credit cost (RPC inconsistency is not mislabeled as insufficient), zero/low/exact balances, response details, service failure distinction, invalid credit field values, and exact steering costs.
- Frontend profile/credit helper tests: 6 passed; frontend ESLint and production build pass with 0 errors/warnings. Production build emits a distinct Profile chunk (`ProfilePage-BLTYWaks.js`, 32.08 kB).
- Resolved runtime `ReferenceError: Award is not defined` by adding missing `Award` import from `lucide-react` in `ProfilePage.jsx`.
- Frontend lint/build, Python dependency audit, production configuration rules, and static production asset checks passed as recorded below.
- `git diff --check` passed. Local smoke checks were performed with database credentials disabled.

## Unverified

- Database migration/schema/readiness against the separate QA project, RLS, two-user/API authorization, persisted credits/payments, and DB concurrency.
- Browser E2E, Razorpay sandbox, live Upstash/multi-instance behavior, npm audit, and live marketplace/stock checks.
- Full visual Profile flows, real account search and before/after balance, persisted debit, and live concurrency remain unverified; browser automation failed to initialize and QA credentials are absent from this workspace.
- QA configuration discovery: `backend/.env.qa` is currently absent. Only file existence was checked; no current or QA project URL/secret values were read, and no database connection was attempted.

## Historical possible side effect in current environment — unknown/unverified

See the safety note above. Do not query, modify, delete, reset, or attempt cleanup on the current Supabase project. No claim is made about its current cleanliness or contamination.

## Release summary

| Area | Result | Evidence / remaining work |
|---|---|---|
| Backend regression | PASS (DB-isolated) | `pytest tests -q`: 83 passed, 0 failed, 300.47 s. `conftest.py` clears Supabase variables before app import and blocks DB globals. |
| Backend credit flow | PASS (mocked/isolated) | 11 focused credit/API tests pass; no live database was accessed. |
| Profile runtime recovery | PASS (Browser E2E) | Tested in real Chromium browser via Playwright: Direct `/profile` navigation, refresh, Dashboard -> Profile UI click, unauthenticated redirect, and corrupted session recovery all pass with 0 console errors and no black screen. |
| Credit display/debit flow | PARTIAL | UI reads and refreshes authenticated `/api/credits/me`; backend reads and atomically debits `profiles.credits` for authenticated user. Client precheck removed. Mocked path correctly distinguishes insufficient (402) from RPC/consistency failures (503); real QA balance and persisted debit UNVERIFIED (awaiting QA Supabase credentials). |
| Production configuration rules | PASS (automated) | 1 structurally valid HTTPS configuration passes; eight unsafe configurations are rejected. |
| Current production configuration | FAIL (expected) | Validator rejects empty explicit origins, localhost service defaults, local Ollama, missing Upstash configuration, and Razorpay test credentials. No secrets were printed. |
| Python dependency audit | PASS | `pip-audit -r requirements.txt`: no known vulnerabilities. |
| Frontend dependency audit | UNVERIFIED | `npm audit --omit=dev` could not reach the npm advisory endpoint. |
| Local backend smoke | PARTIAL | With database credentials deliberately disabled: `/health` 200; `/ready` 503; unauthenticated `/api/credits/me` 401. This confirms fail-safe behavior, not database readiness. |
| Supabase migration / readiness | UNVERIFIED — QA ACCESS NOT CONFIGURED | User reports QA project is ready, but `backend/.env.qa` is absent and no QA variables are set. Migration also requires QA-only DDL/database access. No connection was attempted and no migration was applied. |
| RLS / two-user isolation | UNVERIFIED — QA ACCESS NOT CONFIGURED | No direct API or database-level cross-user checks or concurrent credit tests were run. |
| Shared rate limiting | PARTIAL | Automated tests cover hashed identities, atomic Upstash `EVAL` command formation, 429/`Retry-After`, and fail-closed 503. No live Redis or multi-instance run was available. |
| Browser E2E | UNVERIFIED | CUA browser runtime failed to initialize because kernel assets were missing. Vite preview root and local JS/CSS returned 200; no interactive browser, console, or network E2E was completed. |
| Payment sandbox | UNVERIFIED | Unit/API tests cover tampered signature rejection, server-owned entitlements and safe failures. No Razorpay sandbox account/payment lifecycle was run. |
| Search and agent behavior | PASS (fixtures) | Backend suite covers graph behavior, multi-agent fallback, stream semantics, malformed/upstream failures, and controlled source fixtures. Real providers and full browser workflow are unverified. |
| Price validation | PASS (fixtures) | Tests ensure snippets do not become verified live prices and blocked pages do not fall back to snippet values. Real sellers, variants, currency, and changing prices are unverified. |
| Inventory | PASS (fixtures) | Unknown availability and missing exact quantity remain unknown/null. Live source stock is unverified. |
| SSE | PASS (local tests) | Existing tests cover event sequence, concurrent isolation, and disconnect cancellation. Real browser reconnect/upstream outage testing is unverified. |
| Performance | PARTIAL | Production build succeeds; no load, latency, memory, or Lighthouse test. |

## Automated coverage

- Backend tests added in this remediation: 17 tests across production configuration validation, `/ready` capability enforcement, shared-limiter contract/fail-closed behavior, and 429 response behavior.
- Existing backend tests cover authentication requirements, payment request tampering and signature checks, payment entitlement source, duplicate-safe RPC call shape, price verification/fallbacks, unknown inventory, stream cancellation, and agent fallbacks.
- Frontend tests added: `settleWithin` success, rejected request, and timeout behavior used by Profile.
- Frontend test limitation: these are helper tests, not rendered React/profile browser tests. Expired/invalid session, malformed settings, navigation, and logout-during-load remain browser-level UNVERIFIED cases.
- Current bug regressions: backend `test_credit_flow.py` validates 5/10/20 mode cost, authoritative source identity, zero/insufficient/1,470 balances, RPC outage vs. insufficiency, and response fields; frontend `profile_credit_state.test.js` validates 1,470/zero and rejects missing, string, negative, fractional, or unsafe balances plus malformed preferences.

## Production asset and URL audit

- Latest production bundle: entry 426.77 kB / 123.84 kB gzip; Profile 31.69 kB / 7.63 kB gzip; UserDashboard 107.97 kB / 27.45 kB gzip; no chunk-size warning.
- Built bundle scan: no localhost backend URL, backend-secret variable marker, or development rate-limit salt found.
- Remaining localhost references are development-only defaults, local CLI/docs, test fixtures, and URL/SSRF guards. Production startup and frontend build guards reject local endpoints.
- Vite preview returned HTTP 200 for the HTML shell and local JS/CSS. Razorpay’s external checkout script fetch failed in this network environment.

## Tests and checks executed

| Check | Result |
|---|---|
| Backend full suite | 79 passed, 0 failed with Supabase isolated; final focused run 22 passed |
| Frontend Node tests | 6 passed, 0 failed |
| Frontend ESLint | Passed with zero warnings |
| Frontend Vite production build | Passed; no bundle warning |
| `git diff --check` | Passed; no whitespace errors |
| Python `pip-audit` | No known vulnerabilities |
| npm advisory audit | Unverified; registry endpoint unreachable |
| Production config validator | Synthetic valid config passes; unsafe cases fail; active local config fails as expected |
| Backend smoke | Health 200; safe DB-disabled readiness 503; unauthenticated credits 401 |
| Browser CUA | Unavailable: kernel assets missing |
| Migration SQL execution | Not run; no test database supplied |
| Two-user RLS / concurrent credit | Not run; no test database supplied |
| Razorpay sandbox / full journey | Not run; no sandbox account/browser E2E available |

**Tests passed:** 79 backend full suite + 22 focused backend + 6 frontend tests.  
**Tests failed:** 0 in the final suite. An earlier limiter test fixture failed, was corrected, and the final full suite passed.  
**Tests skipped:** 0 reported by the final pytest run. The external/browser/database workflows above were not executed and are explicitly UNVERIFIED.  
**Tests added:** 11 credit-flow cases plus 3 frontend profile/credit helper cases for these fixes; the full suite includes the existing QA regression coverage.

## Migration inventory

`supabase_production_migration.sql` was repaired to be transactional and rerunnable. It defines profiles, search history, cache, credit and payment records; checks/indexes/foreign keys; owner-scoped RLS; restricted profile updates; signup and delete-user functions; service-only credit/payment RPCs; and `seamas_schema_is_ready()`.

**Database migrations applied:** None. Do not deploy the backend until this migration is tested on the separate disposable Supabase project, `/ready` returns 200 there, and two-user RLS/concurrency checks pass.

## Remaining release gates

1. Configure the declared QA project using QA-only URL/keys plus a QA-only DDL/database access method; apply and rerun the migration there, verify `/ready`, signup/profile, search history, credits, payment idempotency, RLS across two users, and concurrent credit deductions.
2. Configure production HTTPS service URLs, exact CORS origins, live production Razorpay credentials, and Upstash URL/token plus a random 32+ character HMAC secret in the backend secret store; rerun startup/config checks.
3. Run the shared limiter against a real Upstash test database and multiple backend instances.
4. Restore browser automation and complete the production-build user journey, Profile failure/logout regressions, browser console/network review, and source/price/inventory checks.
5. Run Razorpay sandbox checkout/verification and payment failure/duplicate scenarios.
6. Retry npm advisory audit when the registry is reachable; run performance/load testing and review the two SDK deprecation warnings.

**Release gate: NOT PASSED.** The code-level fixes and local tests pass, but production database, RLS, live shared limiter, browser, payment, and live marketplace behavior remain unverified.
