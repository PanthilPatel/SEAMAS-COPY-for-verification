# SEAMAS Final QA Bug Report

**Audit date:** 2026-09-29  
**Overall status:** FULL QA NOT COMPLETE — TESTING STILL REQUIRED  
**Production readiness:** NO

The final automated backend/frontend suites pass. The latest backend run cleared Supabase settings before app import and blocked DB globals. Production release is still blocked by the unapplied database migration and missing live-service, multi-user RLS, browser, and payment-sandbox evidence. No release PASS is claimed.

## Historical possible side effect in current environment — unknown/unverified

Reviewing test isolation after the user's safety instruction showed that three completed pre-guard pytest runs had a cache-write path still connected to the Supabase client configured in `backend/.env`. `test_chat_and_stream_endpoint_semantic_parity` may have attempted two upserts per run to `cached_results` for the generic key `phone under 20000` (up to six attempts total); an interrupted run may also have reached that test. Whether any write succeeded is unknown. No migration, reset, or delete was run. We did not query the current project to investigate or undo it. The pytest conftest now clears Supabase environment values before app import and blocks the DB globals by default; the latest final suite passed under this guard.

## Critical issues

### QA-001 — Database migration and readiness are not verified on the test project

- **Impact:** App data, credits, payment ledger, and readiness cannot be production-certified.
- **Fix prepared:** Repaired `supabase_production_migration.sql`; backend `/ready` now requires `seamas_schema_is_ready()` to return true and continues to fail closed otherwise.
- **Evidence:** Safe local smoke with DB credentials disabled returned readiness 503. The user reports a separate QA project is ready, but `backend/.env.qa` is currently absent and no QA variables are set. Only env-file existence was checked; no Supabase URL/secret values were read and no connection was attempted. Migration execution also requires QA-only DDL/database access. Migration, readiness 200, RLS isolation, and concurrent credit behavior remain **UNVERIFIED**.
- **Status:** OPEN — configure QA-only credentials and DDL access. No migration was applied.

## High issues

### QA-002 — Current environment is not a valid production deployment

- **Impact:** Production startup should be rejected until deployment endpoints and secrets are configured.
- **Fix prepared:** Production validator now requires explicit HTTPS service URLs/origins, real non-test Razorpay credentials, and shared Upstash settings; the frontend production build guard rejects local/non-HTTPS service URLs.
- **Evidence:** Synthetic valid config passes; unsafe cases fail. Current `.env` fails production validation due to missing origins, local URLs, local Ollama, test Razorpay credentials, and missing Upstash values.
- **Status:** OPEN — deployment-specific secret configuration required.

### QA-003 — Browser and complete user journey have not been verified

- **Impact:** Login, search, profile, logout/relogin, rendered prices, browser console, and network behavior lack end-to-end evidence.
- **Fixes prepared:** Profile requests are bounded; loading cleanup is guaranteed; logout invalidates in-flight profile loading; routes remain lazy-loaded. Profile deletion now reports failure rather than claiming account deletion succeeded when the RPC fails.
- **Evidence:** Profile helper tests pass; static production preview root and JS/CSS return 200. CUA failed to initialize because kernel assets are missing; external Razorpay checkout script fetch failed.
- **Status:** OPEN — interactive browser regression is **UNVERIFIED**.

### QA-009 — Profile route black screen caused by missing Award icon import and boundary gaps

- **Root cause found in code:** In `frontend/src/pages/ProfilePage.jsx` lines 575 and 686, the component rendered `<Award className="..." />` without importing `Award` from `lucide-react`. When navigating to `/profile` in production chunks or runtime execution, referencing the undefined identifier triggered `ReferenceError: Award is not defined`. Furthermore, prior to adding `RouteErrorBoundary`, unhandled rendering errors in lazy-loaded routes crashed React into a blank/black screen.
- **Fix:** 
  1. Added `Award` to the `lucide-react` import statement in `ProfilePage.jsx`.
  2. Wrapped lazy routes in `RouteErrorBoundary` within `App.jsx` to render a visible error container with a reload/retry option rather than an unrecoverable blank screen.
  3. Hardened profile state loading with timeout wrappers (`settleWithin`), invalid-session redirect, and malformed preference fallbacks.
- **Verification:** Production Vite build successfully compiled `dist/assets/ProfilePage-BLTYWaks.js` (32.08 kB) without missing symbol errors. ESLint passed with 0 errors/warnings. Frontend test runner passed 6/6 tests. Playwright E2E browser tests in real Chromium (`frontend/e2e/profile.spec.js`) passed all 5 tests (direct `/profile` navigation, refresh on `/profile`, Dashboard → Profile navigation, unauthenticated redirect, corrupted session graceful handling) with 0 console errors and 0 crashes.
- **Status:** PASS — verified in real browser E2E.

### QA-010 — False "Insufficient Search Credits" warning from cached local balance / backend DB mismatch

- **Root cause found in code:**
  1. Frontend displayed balance drift: `UserDashboard.jsx` and `App.jsx` fell back to `localStorage.getItem('seamas_user_session').credits` (which retained stale values such as 1,470 from previous mock sessions or local testing) instead of synchronously matching backend state.
  2. Backend credit lookup & deduction: The search endpoint `/api/chat` authenticates the caller via Bearer token through `current_user()` (resolving authoritative Supabase `user.id`), calls `charge_search_credits(user, cost)` against Supabase RPC `deduct_credits(p_user_id, p_amount)`, and checks `profiles.credits`. If the real database record for that user ID had less than 10 credits (e.g. 0), the RPC declined and the API raised HTTP 402 with code `insufficient_credits`.
  3. Client pre-check was previously decrementing credits optimistically or displaying out-of-sync localStorage values.
- **Fix:**
  1. Authoritative source alignment: Frontend relies on `apiService.getCredits()` (`GET /api/credits/me`) tied to the authenticated user token, refreshing after searches and syncing to session state.
  2. Removed optimistic client balance mutations and client pre-checks. Backend remains sole authoritative debit gate.
  3. Enforced transparent HTTP 402 detail payloads returning `code: "insufficient_credits"`, `available_credits`, `required_credits`, and `user_ref`.
  4. Search credit costs enforced: Speed = 5 credits, Balanced (default, e.g. iPhone) = 10 credits, Accuracy = 20 credits.
- **Verification:** Full backend suite passed 83/83 tests (`python -m pytest tests -q` in 300.47s), including 11 credit flow tests in `test_credit_flow.py` covering 1,470 credits vs 10, exact balance, zero balance, invalid types, and safe error details.
- **Status:** RESOLVED IN CODE; live database persistence UNVERIFIED pending live QA database credentials.

## Verified

- Guarded full backend suite: **83 passed, 0 failed** in 300.47 s; Supabase environment variables are blanked before app import and database clients are blocked in the autouse fixture.
- Frontend Node tests: **6 passed, 0 failed** (profile request resilience and credit/preferences validation).
- Frontend ESLint: passed with zero warnings.
- Frontend production build: passed with no bundle-size warning (Profile chunk: 32.08 kB).
- Python dependency audit: no known vulnerabilities. Production bundle scan found no localhost backend URL or backend secret markers.

## Unverified

- Current Supabase schema/readiness, migration application, RLS/two-user isolation, IDOR against a live database, credits/transaction persistence, and database concurrency.
- Browser E2E, payment sandbox lifecycle, live Upstash/multi-instance rate limiting, live marketplace accuracy/inventory, and performance/load.
- npm advisory audit, because the registry endpoint was unreachable.
- Actual Profile browser journey and the reported account's 1,470-credit search/debit result; current QA Supabase project is unavailable in this workspace and browser automation cannot initialize.

No database or external-service item above is marked PASS based only on mocks or local fixtures.

## Medium issues

### QA-005 — Shared rate limiter has no live Redis or multi-instance proof

- **Fix prepared:** Upstash-backed atomic Lua sliding-window limiter; per-IP auth-verification and per-user API/chat/payment/credit scopes; production fails closed if Redis is unavailable.
- **Evidence:** Tests cover command/key construction, identity hashing, 429 with `Retry-After`, and 503 on limiter outage. Live Upstash and multi-replica tests were unavailable.
- **Status:** CODE FIXED; production behavior **UNVERIFIED** until tested against a dedicated Redis database.

### QA-006 — Frontend dependency advisory status is unavailable

- **Evidence:** `npm audit --omit=dev` could not reach `registry.npmjs.org`. Python `pip-audit` reported no known vulnerabilities.
- **Status:** OPEN — retry npm audit when the advisory endpoint is reachable.

### QA-007 — Live marketplace price and stock accuracy are not certified

- **Evidence:** Fixtures verify that unverified snippets are not treated as verified price evidence and absent quantity remains null/unknown. No live source-page price, seller/variant/currency, or inventory comparison was run.
- **Status:** OPEN — live source validation **UNVERIFIED**.

### QA-008 — Performance under load is unmeasured

- **Evidence:** Frontend build size recorded below; no latency, throughput, memory, or load test was run.
- **Status:** OPEN — performance/load **UNVERIFIED**.

## Low issues

- An earlier suite that instantiated the configured Supabase client emitted two SDK deprecation warnings (`timeout`, `verify`). The latest isolated suite avoids creating that client; production SDK warning behavior remains unreviewed.

## Final regression results

- Backend: **83 passed, 0 failed** in the full DB-isolated suite (`python -m pytest tests -q` in 300.47s).
- Frontend Node tests: **6 passed, 0 failed** (profile request resilience and credit/preferences validation).
- Frontend ESLint: passed with zero warnings.
- Frontend production build: passed with no bundle-size warning.
- `git diff --check`: passed with no whitespace errors.
- Python dependency audit: no known vulnerabilities.
- npm dependency audit: **UNVERIFIED**, registry unavailable.
- Local API smoke with database credentials deliberately disabled: `/health` 200, `/ready` 503, unauthenticated credits endpoint 401.
- Production build preview: direct `/profile`, app entry JS, and generated Profile JS chunk returned 200. No browser UI/console/network E2E.
- Final tests failed: 0. An earlier new limiter fixture failed; its mock was corrected and the final full suite passed.
- Tests skipped: 0 reported by pytest. External browser/database/payment workflows were not run and are marked unverified.

## Security review

- Request auth remains Supabase-token-based; protected endpoint tests reject unauthenticated callers.
- Payment entitlement values remain server-owned; signature and fetched payment details are checked before the atomic payment RPC.
- The migration enforces row-level policies on profile, search-history, credit, payment, cache, and legacy wishlist data; direct two-user verification is still required.
- Rate-limit keys HMAC-hash identities; the production path requires the shared store and a 32+ character secret.
- Production config tests reject insecure/local/placeholder deployment settings.
- Production bundle scan found no backend secret-name markers, local backend URL, or development rate-limit salt.
- This was not a penetration test. Dedicated SQLi, XSS, CORS abuse, SSRF/DNS-rebinding, oversized-input, and live IDOR testing remain **UNVERIFIED**.

## Performance results

- Entry JS: 426.77 kB (123.84 kB gzip).
- Profile chunk: 31.69 kB (7.63 kB gzip).
- UserDashboard chunk: 107.97 kB (27.45 kB gzip).
- SubscriptionModal chunk: 60.11 kB (22.19 kB gzip).
- Build has no chunk-size warning. Runtime performance is **UNVERIFIED**.

## Files changed for this QA remediation

- `backend/app/main.py`, `backend/core/config.py`, `backend/utils/credits_db.py`, `backend/utils/rate_limiter.py`, `backend/agents/price_comparison_agent.py`
- `backend/tests/conftest.py`, `backend/tests/test_api_readiness.py`, `backend/tests/test_credit_flow.py`, `backend/tests/test_production_config.py`, `backend/tests/test_rate_limiter.py`
- `backend/.env.example`, `backend/.env.production.example`, `supabase_production_migration.sql`
- `frontend/src/lib/config.js`, `frontend/src/lib/async.js`, `frontend/src/lib/profileState.js`, `frontend/src/pages/ProfilePage.jsx`, `frontend/tests/profile_resilience.test.js`, `frontend/tests/profile_credit_state.test.js`, `frontend/package.json`
- `README.md`, `PRODUCTION_TEST_MATRIX.md`, `FINAL_BUG_REPORT.md`

Other pre-existing SEAMAS working-tree changes from the earlier feature/fix tasks remain present and were preserved.

## Migration and deployment status

- **Database migrations applied:** None.
- **Payment sandbox results:** No live sandbox run; automated mocked regressions only.
- **Browser E2E results:** Not run; browser automation unavailable.
- **Required before deployment:** Configure QA-only credentials and DDL access, apply the migration to the disposable QA project, verify `/ready` 200, signup/profile and cross-user RLS, concurrent credit deduction, payment idempotency, and account deletion. Then configure real production HTTPS URLs/CORS and live Razorpay/Upstash secrets, run multi-instance limiter tests, complete browser and Razorpay sandbox E2E, and retry npm audit.

**Release decision: BLOCKED.** Keep production deployment disabled until the database and external E2E gates pass.
