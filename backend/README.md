# Backend API

Node.js + Fastify 5 + TypeScript (ES modules). Phase 1: modular skeleton serving **mock data** — see the [project README](../README.md).

```bash
npm install
cp .env.example .env    # optional in Phase 1
npm run dev             # http://localhost:4000  (watch mode via tsx)
```

| Script | Purpose |
|---|---|
| `npm run dev` | Run `src/server.ts` with reload on change |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm run typecheck` | TypeScript only |

Quick check: `curl http://localhost:4000/health` and `curl http://localhost:4000/api/products`.

## Request flow

`routes/` (path + JSON Schema + preHandler) → `controllers/` (HTTP in/out) → `services/` (business rules) → `repositories/` (data access)

- **Repositories** are interfaces (`repositories/types.ts`) with mock implementations in `repositories/mock/`.
  Phase 2 adds MySQL implementations and switches them in `repositories/index.ts`; services stay unchanged.
- **Responses** always use `ok()` / `fail()` from `utils/api-response.ts`. Simulated writes set `meta.persisted: false`.
- **Errors** are thrown as `AppError` subclasses (`utils/errors.ts`) and formatted centrally in `middleware/error-handler.ts`.
- **Auth** (`middleware/auth.ts`) is a placeholder: a fixed demo user in development, `501` for every protected route
  when `NODE_ENV=production`. `/api/auth/*` endpoints validate input and return `501 NOT_IMPLEMENTED`.

## Database

`database/schema.sql` is the MySQL schema proposal. No database connection is made in Phase 1 and no MySQL driver
is installed. Credentials come only from environment variables (`DB_*` in `.env.example`); `/health` reports
whether they are set, never their values.

## E-commerce module (`src/modules/ecommerce`, MySQL-backed)

Mounted at `/api/ecommerce` (one line in `routes/index.ts`). It is separate from the warranty routes above — those keep
their mock repositories and are unaffected. Shared with warranty: the `customers` and `admins` tables, the response
envelope (`ok/fail`), `AppError` classes, JSON Schema validation and the error handler.

```
src/db/                      pool.ts (mysql2 pool + withTransaction), migrate.ts, seed-ecommerce-dev.ts
database/migrations/         001_warranty_base.sql (= schema.sql), 002_ecommerce.sql, 003_ecommerce_defaults.sql
src/modules/ecommerce/
  index.ts                   registers all groups; CSRF/origin check; admin preValidation auth; reservation sweeper
  shared/                    config, auth (scrypt + cookie sessions + guards), permissions, rate-limit, audit, settings, sequences, schemas, http
  auth/ products/ categories/ cart/ coupons/ orders/ payments/ inventory/ customers/ bulk-enquiries/ content/ admin/
  tests/                     unit.test.ts (no DB), integration.test.ts (real MySQL, opt-in)
```

Each feature folder follows the existing layering in a compact form: `*.routes.ts` (paths, JSON Schema, guards, thin
handlers) → `*.service.ts` (rules + SQL). There is no ORM in this project, so services use parameterised SQL through `db/pool.ts`.

### Database

```bash
# backend/.env: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
npm run db:migrate            # creates DB_NAME if missing, applies pending migrations, records them in schema_migrations
npm run db:migrate:status
npm run db:seed:dev           # DEV ONLY (refused in production): Super Admin from SEED_ADMIN_* + labelled sample catalogue
```

Back up the database before migrating production (`mysqldump --single-transaction`). MySQL DDL is not transactional; never
edit an applied migration — add a new numbered file. All e-commerce tables are prefixed `ecom_`. Migration 003 widens
`admins.role` with `'none'` (shop-only staff); existing values are unchanged.

### Key rules

- **Overselling:** stock rows are locked (`SELECT … FOR UPDATE`, id order) inside the order transaction. Online orders
  *reserve* stock; payment *commits* it; failure keeps the hold so the customer can retry; expiry (`reservationMinutes`,
  swept every `ECOM_RESERVATION_SWEEP_MS`) or cancellation *releases* it. COD deducts at once. Every change is in `ecom_inventory_movements`.
- **Duplicate orders:** unique `idempotency_key` per checkout attempt. **Duplicate payments:** `markCaptured` locks the
  payment and order rows and is a no-op when already captured; webhook events are de-duplicated by event id; a second
  captured attempt for an already-paid order opens a refund.
- **Prices:** computed only on the server (GST-inclusive). Order items snapshot SKU, name, price and tax rate.
- **Payments:** Razorpay orders created server-side for the order total; checkout signature verified (HMAC) and the payment
  re-fetched from Razorpay; webhook body verified with `RAZORPAY_WEBHOOK_SECRET`. `PAYMENT_PROVIDER=mock` is for local
  development and the server refuses to start with it in production.
- **Refunds:** opened automatically by cancellations/returns of paid orders or manually; sent to the gateway only by staff
  with `refunds.manage`. COD refunds are recorded with an offline transfer reference.
- **Auth:** scrypt password hashes; random session token in an httpOnly `SameSite=Lax` cookie (`Secure` in production),
  only its SHA-256 stored. Writes need the `x-olitec-client` header and an allowed `Origin` (CSRF). Admin routes authenticate
  *before* body validation and check a per-route permission (`shared/permissions.ts`). Admin actions go to `ecom_audit_logs`.
- **Uploads:** JPEG/PNG/WebP ≤ 5 MB, checked by file signature, random file names, served with `nosniff` and `default-src 'none'`.

### Endpoints (all under `/api/ecommerce`)

| Group | Endpoints |
|---|---|
| Auth | `POST auth/register · login · logout · change-password · forgot-password · reset-password`, `GET/PATCH auth/me` |
| Catalogue | `GET products` (q, category, brand, minPrice, maxPrice, inStock, flag, spec[], sort, page), `products/facets`, `products/suggest`, `products/sitemap`, `products/:slug`, `GET/POST products/:slug/reviews`, `GET categories`, `categories/:slug`, `brands` |
| Cart | `GET cart`, `POST cart/items`, `PATCH/DELETE cart/items/:itemId`, `POST/DELETE cart/coupon`, `GET cart/delivery-check` |
| Checkout & orders | `GET checkout/preview`, `POST checkout/orders`, `GET orders`, `GET orders/:orderNumber`, `POST orders/:orderNumber/cancel · return`, `GET orders/:orderNumber/invoice`, `POST orders/track` |
| Payments | `POST payments/initiate · verify · failure`, `POST payments/mock/complete` (mock only), `POST payments/webhooks/razorpay` |
| Account | `GET/POST account/addresses`, `PATCH/DELETE account/addresses/:id`, `GET account/wishlist[/ids]`, `POST/DELETE account/wishlist/:productId`, `GET account/support` |
| Public forms & content | `POST support`, `POST bulk-enquiries`, `GET content/home · settings · faqs`, `GET pages[/:slug]`, `GET media/:name` |
| Admin (`admin/…`) | `auth/*`, `dashboard`, `products[/:id[/status]]`, `brands`, `reviews`, `categories[/reorder]`, `inventory[/movements · /:id/adjust · /reconcile]`, `orders[/staff · /:id · /:id/status · shipping · assign · notes · requests/:requestId · invoice]`, `payments`, `refunds[/:id/process · reject]`, `customers[/:id/status]`, `support[/:id]`, `coupons[/:id]`, `bulk-enquiries[/:id · notes · quotations · quotations/:id[/document]]`, `content[/:id]`, `pages[/:id]`, `settings[/:key]`, `uploads`, `reports[/:key]` (`?format=csv`), `users[/roles · /:id]`, `audit-logs` |

### Tests

```bash
npm test                                   # unit + HTTP tests (no database) — includes a warranty API regression check
# Integration tests (write data; DB_NAME must end in _test):
#   PowerShell: $env:ECOM_TEST_DB=1; $env:DB_NAME="olitec_shop_test"; npm run db:migrate; npm test
```

The integration suite covers product CRUD and duplicate SKUs, backend role enforcement, cart totals and stock limits, coupon
limits, idempotent checkout, payment failure/success, concurrent checkouts for the last unit, reservation expiry and
cancellation, webhook signature + de-duplication, the full fulfilment → return → refund path, registration/login/cart
merge/order history, bulk enquiries with quotations, dashboard and reports.
