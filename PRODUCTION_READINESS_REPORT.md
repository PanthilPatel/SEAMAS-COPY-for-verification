# SEAMAS Production Readiness Report

## Executive Summary

**NOT PRODUCTION READY.** This pass hardens API identity, credit and payment paths, source price claims, SSRF defenses, production configuration, and documentation. Backend tests, frontend lint/build, and both dependency audits pass. Live config checks show production origins/URLs are not configured, and Supabase does not have the payment tables yet. Apply `supabase_production_migration.sql` and configure production URLs before deploying.

## Architecture Audited

Reviewed the React/Vite client, FastAPI API, Supabase Auth/database utilities and schema, Razorpay payment path, LangGraph/orchestrator entry, search tools, price comparison/finalizer agents, tests, requirements, package manifest, and deployment configuration. Preserved the React → FastAPI → LangGraph agent pipeline.

## Bugs Found

| ID | Severity | File | Problem | Root Cause | Fix | Validation |
|---|---|---|---|---|---|---|
| SEAMAS-001 | Critical | `backend/app/main.py` | Search and credits trusted the request's `user_id`; credit lookup exposed arbitrary account balances. | No validated authentication dependency. | Added Supabase bearer-token validation, authenticated `/api/credits/me`, and authenticated chat endpoints; JSON `user_id` is ignored. | Python syntax compile PASS; request behavior UNVERIFIED. |
| SEAMAS-002 | Critical | `backend/utils/credits_db.py`, `supabase_production_migration.sql` | Credit deduction/top-up used read-modify-write and could race or return fabricated balances. | Non-atomic profile writes and local fallback values. | Fail-closed RPC deduction plus ledger, nonnegative balance constraint, transactional payment credit RPC. | SQL not applied to a Supabase instance; concurrency UNVERIFIED. |
| SEAMAS-003 | Critical | `backend/app/main.py`, `supabase_production_migration.sql` | A signature plus client-selected user/plan/credits could issue free credits repeatedly. | No server transaction ownership, amount validation, or idempotency. | Added server-owned payment row, fixed plan/pack values, authenticated ownership, Razorpay link/payment fetch and amount/status/reference checks, atomic idempotent completion. | Razorpay/Supabase integration UNVERIFIED. |
| SEAMAS-004 | High | `backend/agents/price_comparison_agent.py`, `frontend/src/components/ProductGrid.jsx` | Search snippet values were displayed as verified prices and MRP; unverified values looked current. | Snippet confidence was treated as source verification. | Snippets now discover candidates only; page-check prices get timestamp/method; otherwise price/MRP are null and UI says unavailable. | Price/source tests PASS (21 passed). |
| SEAMAS-005 | High | `backend/agents/price_comparison_agent.py` | External product URLs could direct the backend scraper to local/private services. | Unrestricted URL fetch and redirect following. | HTTPS-only check, credential URL rejection, DNS resolution rejects non-global addresses, redirects disabled, short timeout retained. | Static review; network behavior UNVERIFIED. |
| SEAMAS-006 | High | `backend/core/config.py`, `backend/app/main.py` | Production could start with localhost URLs, wildcard/empty origins, or missing critical credentials. | Development defaults were not distinguished from production. | Startup production validation and explicit environment-based origins/callback URL. | Config validator rejects current missing production origins/local URLs; fail-fast behavior confirmed. |
| SEAMAS-007 | Medium | `frontend/src/services/api.js`, payment UI | Requests omitted bearer tokens; stream fallback could retry a billable operation. | Client-side identity fields and uncoordinated fallback behavior. | Bearer token attached; `getCredits` uses `/me`; automatic fallback removed to prevent duplicate charges. | Frontend build/lint PASS; authenticated browser flow UNVERIFIED. |
| SEAMAS-008 | Medium | `backend/app/main.py` | Generic API/payment errors leaked raw exceptions. | `detail=str(e)` and unsafe client-facing diagnostics. | Safe public messages and internal exception logging. | Python syntax compile PASS; API behavior UNVERIFIED. |
| SEAMAS-009 | Medium | `frontend/src/lib/config.js`, `frontend/src/lib/supabase.js` | Production frontend silently used localhost API defaults when deployment variables were missing. | Development defaults also shipped into production builds. | Production boot now rejects missing/local API and Supabase URLs or missing public anon key. | Vite production build PASS; production browser boot remains UNVERIFIED. |
| SEAMAS-010 | Medium | `backend/tools/price_discrepancy.py` | No repeatable way to compare the displayed price with captured source-page data. | No data-driven regression utility existed. | Added URL-matched JSON input → CSV difference report with timestamp and source URL. | Utility tests PASS (2 cases). |

## Security Fixes

- Supabase service role is required for backend database operations; it is not used as a frontend value.
- Added request IDs and basic security response headers.
- Production CORS only accepts configured origins; production config rejects wildcard, localhost and missing integrations.
- Supabase migration restricts profile writes to presentation columns and protects payment/credit tables with RLS and grants. Live schema probing confirmed `payment_transactions` is not present yet; readiness now returns 503 until the required tables exist.
- Added health (`/health`) and database readiness (`/ready`) endpoints.

## Authentication / Authorization

Chat, streaming, credit lookup, payment creation and verification require Supabase bearer authentication. Caller-supplied identity is never used for authority. The old `/api/credits/{user_id}` endpoint was removed. Real token expiry/wrong-user flows still require integration tests.

## Payment Security

Server configuration owns plan prices and credits. A pending transaction is written before the Razorpay call; verification requires the authenticated owner, signed callback, fetched captured payment, fetched paid link, matching transaction reference, amount, and currency. Credit application and completion occur through one row-locking database function. Razorpay and migration execution remain deployment requirements.

## Credit System

Credit reads fail closed when the database is absent. Search charges use atomic `deduct_credits` and produce a `search_usage` ledger row. Purchases produce a `purchase` ledger row in the same transaction as profile balance and payment status. Database-level concurrency behavior is UNVERIFIED until migration and concurrent integration checks run.

## Pricing Accuracy

Search snippets no longer set authoritative current or original price. The result contract includes `price_verified`, `price_verified_at`, `price_verification_method`, and INR currency. Live checks are capped by `MAX_PRODUCTS_TO_VERIFY` and `PRICE_VERIFICATION_CONCURRENCY`; failed checks return null price/MRP. Page extraction can still fail or misidentify page variants; real-source comparison is UNVERIFIED.

## Quantity / Inventory

New price results include `availability_status: unknown` and null quantity/source/check time. The UI does not invent quantities. Actual seller quantity parsing has not been implemented, and no claim of exact inventory is made.

## Search Reliability

Existing SearXNG/Tavily and agent structure was retained. This pass hardened the page-fetch boundary but did not validate live provider fallback, request-level retry semantics, or all relevance/counterfeit cases.

## Frontend

Bearer authorization is sent for chat, credits, checkout and callback verification. Unverified products no longer render ₹0 or claim a price was checked today. Unverified products remain visible without being included in price-only constraints. Displayed availability reflects known status or says unknown. Vite 6.4.3 production build and ESLint pass; the main JavaScript chunk is 629.64 kB and triggers the bundler's size warning.

## Backend

Added bearer auth, request validation, safe errors, health/readiness endpoints, production checks, atomic credit operations, and payment transaction persistence. The backend test suite passes. TestClient liveness returned 200; readiness returns 503 until the migration tables are applied. Production configuration validation correctly rejects missing origins and localhost production URLs.

## Testing

| Command | Result |
|---|---|
| `backend/venv/Scripts/python.exe -m pytest backend/tests -q` | PASS: 53 passed, 2 dependency deprecation warnings, 318.51 seconds. |
| `backend/venv/Scripts/python.exe -m pytest tests/test_relevance_pipeline.py tests/test_failures_and_fallbacks.py -q` | PASS: 21 passed, 90.11 seconds. |
| `backend/venv/Scripts/python.exe -m pytest tests/test_price_discrepancy.py -q` | PASS: 2 utility cases. |
| Bundled Python `-m py_compile` on edited backend modules | PASS. |
| `npm run lint` | PASS, zero warnings/errors. |
| `npm run build` | PASS, with large-chunk warning (629.64 kB minified JS). |
| `npm audit` | PASS: zero vulnerabilities. |
| `pip-audit -r backend/requirements.txt` | PASS: no known vulnerabilities found. |
| Backend TestClient health/readiness check | PASS liveness (`200`); readiness correctly fails (`503`) because migration tables are absent. |
| Frontend test suite | UNVERIFIED: no test script is configured. |
| Supabase RPC/payment/concurrency integration | UNVERIFIED: migration and external credentials not applied/configured. |

## Dependency Audit

**PASS for known advisories in the audited declared sets.** `npm audit` reports zero vulnerabilities and `pip-audit -r backend/requirements.txt` reports none. Frontend Vite was updated to 6.4.3, React Router to the patched 7.18.2 line, PostCSS to the patched 8.5.23 line, and vulnerable transitive packages were resolved. The frontend lint script now has ESLint and React JSX configuration. Requirements remain minimum-version ranges rather than a locked backend environment, so deployment should use a reviewed lock/constraints set.

## Deployment Configuration

Added backend and frontend environment examples. Production validation against the configured backend environment correctly rejected missing explicit origins and localhost production URLs. Supabase schema probing confirmed required payment tables are absent. Apply the migration and configure production domains before release. A local ignored `backend/.env` exists; secret values were not printed. Historical secret scanning remains UNVERIFIED.

## Remaining Risks

- **REQUIRES DEPLOYMENT CONFIGURATION:** apply migration, configure real production URLs, Supabase keys and Razorpay credentials.
- **UNVERIFIED:** Supabase RLS/RPC behavior after migration, end-to-end Razorpay transactions/idempotency, concurrent credit deductions, live variant price accuracy, SSE disconnects, live SearXNG/Tavily fallback, historical secret scan.
- The source parser remains storefront-dependent; a successful HTML parse is not a universal guarantee of correct variant/seller matching.
- A single canonical Pydantic product model across all agents, API, and TypeScript frontend remains incomplete; the current contract is still dictionary-based with compatibility fields.
- No shared/distributed rate limiter is configured for authenticated expensive search/payment endpoints.
- No exact inventory quantity extraction is claimed.
- Existing scratch/debug assets remain in the local working tree; ignore rules prevent those diagnostic files from being included as project source going forward.
- Existing uncommitted changes were already present at start and were preserved; this report covers the hardening changes in this task, not a clean baseline review of every prior diff.

## Production Checklist

- PASS — API does not authorize from body user IDs.
- PASS — Credit and payment grants are database RPC-based and ledger-backed in the migration.
- PASS — Client cannot choose credits, amount, or payment owner at verification.
- PASS — Search snippets do not become authoritative prices.
- PASS — Quantity is unknown/null unless known; no manufactured stock.
- PASS — Production config rejects localhost, wildcard origins, and missing credentials.
- PASS — Frontend production build and lint completed.
- PASS — Backend suite (53 passing) and focused pricing suite (21 passing).
- PASS — npm and pip dependency audits report zero known vulnerabilities.
- FAIL — Current deployment lacks explicit production origins/URLs and migration tables.
- UNVERIFIED — Exercise Supabase/Razorpay integration after migration.
- UNVERIFIED — Live price, search fallback, concurrency, streaming disconnect and browser authorization flows.
