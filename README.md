# Customer Warranty Project — Phase 1

Three independent applications for product registration and warranty management:

| App | Folder | Stack | Dev URL |
|---|---|---|---|
| Customer website | [`website/`](website/) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | http://localhost:3000 |
| Admin panel | [`admin/`](admin/) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | http://localhost:3001 |
| Backend API | [`backend/`](backend/) | Node.js, Fastify 5, TypeScript | http://localhost:4000 |
| E-commerce storefront | [`ecommerce/`](ecommerce/) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | http://localhost:3002 |

> **E-commerce module:** unlike the warranty screens, the shop is **fully implemented on real data** (MySQL, real auth,
> Razorpay). See [E-commerce](#e-commerce) below. The warranty Phase 1 notes that follow still apply to the warranty screens.

> **Phase 1 status — read this first.**
> - All screens and API responses use **mock data**. Nothing is saved; changes reset on reload/restart.
> - **Authentication is not implemented.** Sign-in forms are simulated. The backend's auth placeholder
>   attaches a demo user in development and **refuses all protected routes (501) when `NODE_ENV=production`**.
> - The frontends do **not** call the backend yet. Each app reads mock data through its own `src/services/`
>   layer, which is the single place to switch to real API calls in Phase 2.
> - The website is a **public site**: the header shows navigation only, never account details.
>   The home page follows the Figma design; see [Figma reference](#figma-reference) for what is still placeholder.

## Requirements

- Node.js **20.12 or newer** (tested with Node 24.21 and npm 11.19)
- npm

## Folder structure

```
customer-warranty-project/
├── README.md
├── website/                     Customer-facing Next.js app
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── (site)/          Public header + footer (from Figma)
│       │   │   ├── page.tsx               Home page (Figma "Desktop - 2")
│       │   │   └── (content)/             Inner pages with standard spacing
│       │   │       ├── products/          Listing + [slug] detail
│       │   │       ├── warranties/        My warranties, register, [id] detail
│       │   │       ├── profile/           Profile view/edit + history
│       │   │       └── support/           Contact + support requests
│       │   ├── (auth)/          login/, register/
│       │   ├── sitemap.ts, robots.ts
│       ├── components/          home/ (13 home sections), ui/, layout/, products/, warranties/, auth/, profile/, support/
│       ├── content/home.ts      Home page copy and image paths
│       ├── services/            Data access (mock now → API in Phase 2)
│       ├── mock/data.ts         Mock data (only imported by services)
│       └── lib/                 types, validation, formatting, site config
├── admin/                       Admin Next.js app
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── login/           Admin sign-in (no sidebar)
│       │   └── (panel)/         Sidebar layout: dashboard, customers/, warranties/
│       ├── components/          ui/, layout/, dashboard/, warranties/, auth/
│       ├── services/            Data access (mock now → API in Phase 2)
│       ├── mock/data.ts         Deterministic generated mock data
│       └── lib/                 types, permissions, formatting
└── backend/                     Fastify API
    ├── .env.example
    ├── database/schema.sql      MySQL schema proposal
    └── src/
        ├── app.ts               buildApp() — plugins, error handling, routes
        ├── server.ts            Starts the HTTP server
        ├── config/              env.ts, database.ts
        ├── routes/              One file per API group + health
        ├── controllers/         HTTP layer → services
        ├── services/            Business rules
        ├── repositories/        Interfaces + mock implementations
        ├── schemas/             JSON Schema request validation
        ├── middleware/          error-handler.ts, auth.ts (placeholder)
        └── utils/               api-response, errors, pagination
```

## Setup and run

Each app is installed and started on its own. Open three terminals:

```bash
# 1. Backend API → http://localhost:4000
cd backend
cp .env.example .env        # optional in Phase 1
npm install
npm run dev

# 2. Customer website → http://localhost:3000
cd website
cp .env.example .env.local  # optional in Phase 1
npm install
npm run dev

# 3. Admin panel → http://localhost:3001
cd admin
cp .env.example .env.local  # optional in Phase 1
npm install
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Other scripts (all three apps): `npm run build`, `npm start` (runs the production build), `npm run typecheck`.

> npm 11 may print `install-scripts ... @tailwindcss/oxide` during install. That optional script was not needed:
> both Next.js apps build and run without it.

### Demo sign-in

| App | Email | Password |
|---|---|---|
| Website | `priya.sharma@example.com` | any (other emails show the error state) |
| Admin | `anita.rao@olitech.example` | any (other emails show the error state) |

## Completed in Phase 1

### Customer website (http://localhost:3000)

| Page | Route | Notes |
|---|---|---|
| Home | `/` | Built from Figma: hero with glass stat cards, stats bar, products carousel, Why Choose OLITEC, Manufacturing & Quality, End-to-End, process steps, featured projects carousel (auto-advances), FAQ accordion, testimonials carousel, partner logos, spotlight, call to action. Organization + FAQ structured data |
| Products | `/products` | Category filter + search (URL-based), product cards with image, name, model, warranty |
| Product detail | `/products/[slug]` | Specs, features, warranty info, `Product` JSON-LD, per-page metadata; unknown slugs return HTTP 404 |
| Login | `/login` | Validation, password visibility toggle, loading/success/error states |
| Registration | `/register` | Name, email, mobile, password + confirm, terms; validation and all states |
| My warranties | `/warranties` | Status tabs with counts (All/Active/Pending/Expired/Rejected), empty state |
| Register warranty | `/warranties/register` | Product, serial number, purchase date, invoice number, dealer, invoice file (type/size checked) |
| Warranty detail | `/warranties/[id]` | Start/end dates, status, coverage progress, timeline, rejection remark |
| Profile | `/profile` | View/edit profile, registered products, warranty history table |
| Support | `/support` | Contact details, support request form, request list with statuses |
| SEO | `/sitemap.xml`, `/robots.txt` | Metadata on every page, sitemap, robots, structured data |

Also: public header and footer from Figma on every page (no account details in the header; customers reach
sign-in from the **Warranty** page), mobile menu, loading skeleton, error boundary, 404 page.

### Admin panel (http://localhost:3001)

| Page | Route | Notes |
|---|---|---|
| Admin login | `/login` | Separate layout, validation, loading/error states |
| Dashboard | `/` | Total customers, registered products, active, expired, pending; monthly registrations chart; status breakdown; pending queue |
| Customers | `/customers` | Search (name/email/mobile), status filter, pagination, status badges, empty state |
| Customer detail | `/customers/[id]` | Profile, registered products, all warranties |
| Warranties | `/warranties` | Search (warranty no./serial/invoice/customer), status + product filters, pagination |
| Warranty detail | `/warranties/[id]` | Full details, customer, invoice metadata, audit history; approve/reject pending requests; update status (Super Admin only); remark required for rejections and status changes; confirmation dialog for every action |

Also: responsive sidebar (drawer on mobile), header with profile menu, loading/empty/error states, role-based UI permissions (`src/lib/permissions.ts`).

### Backend (http://localhost:4000)

`GET /health` plus these groups under `/api` — all validated with JSON Schema, returning a consistent envelope:

```jsonc
{ "success": true, "data": { ... }, "meta": { "source": "mock", "persisted": false } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ... ] } }
```

| Group | Endpoints | Phase 1 behaviour |
|---|---|---|
| `/api/auth` | `POST /register`, `POST /login`, `POST /admin/login`, `POST /logout` | Validates input, then **501 NOT_IMPLEMENTED** |
| `/api/products` | `GET /`, `GET /:slug` | Mock catalogue (public) |
| `/api/customers` | `GET /me`, `PATCH /me` | Demo customer; PATCH not persisted |
| `/api/warranties` | `GET /`, `GET /:id`, `POST /` | Customer-scoped; POST checks duplicate serial, purchase date rules; not persisted |
| `/api/support` | `GET /`, `POST /` | Customer-scoped; POST checks warranty ownership; not persisted |
| `/api/admin` | `GET /dashboard`, `GET /customers`, `GET /customers/:id`, `GET /warranties`, `GET /warranties/:id`, `POST /warranties/:id/approve`, `POST /warranties/:id/reject`, `PATCH /warranties/:id/status` | Role checks + status-transition rules; writes not persisted |

Simulated writes always return `meta.persisted: false`. Errors use `400` validation, `404`, `409` conflict, `422` business rule, `501` not implemented, `500` (logged, generic message).

### Database

[`backend/database/schema.sql`](backend/database/schema.sql) — proposal for `customers`, `admins`, `products`, `warranties`,
`warranty_documents`, `support_requests`, plus a recommended `warranty_status_history` audit table. Primary/foreign
keys, unique constraints (email, mobile, product + serial, warranty/ticket numbers), timestamps, indexes for every
list/search/filter in the admin panel, and CHECK constraints. Passwords are stored only as hashes.
The SQL has not yet been executed against a MySQL server — run it on MySQL 8.0.16+ before building on it.

## Verification performed

- `npm run build` succeeds for all three apps (Next.js compile + TypeScript; backend `tsc`).
- `npm audit`: 0 vulnerabilities in each app (Next.js pinned to 16.4.3 for security advisories affecting 16.0.0–16.4.0).
- All three dev servers ran at the same time; a link crawler visited every internal link (35 website URLs, 106 admin URLs): all returned 200.
- 21 backend requests via `app.inject` returned the expected status codes and bodies; protected routes return 501 with `NODE_ENV=production`.
- Home page compared with the Figma render at 1440px, section by section (headless Edge screenshots); same total height (9431px).
  Mobile layout checked at 500px (the narrowest width headless Edge renders).
- Not yet done: automated tests, manual testing on real phones/browsers, executing `schema.sql`.

## Figma reference

Home page source: Figma file `4RL0Ps4BaU4pg1YPjHxUFi` ("ROUGTH"), frame **Desktop - 2** (node `3470:2`), 1440px wide.
The design is desktop-only; tablet/mobile layouts were derived from it.

Notes on the implementation:

- **Animated sections.** Hero, stats, Our Products and Why Choose OLITEC are animated components in Figma whose
  first frame is empty; they were built in their final (settled) positions.
- **Images.** Several Figma images are crops of larger reference screenshots. Each was pre-cropped to exactly the
  visible region and compressed (`website/public/images/home/`, ~3 MB in total instead of ~50 MB).
- **Font.** Figma uses **Faktum**, a licensed typeface. **Figtree** (Google Fonts) stands in for it; to use Faktum,
  add the font files and switch `--font-display` in `website/src/app/globals.css` (see the comment there).
- **Navigation.** Figma shows "Our Product" twice in the header; the second item is used for **Warranty**
  (warranty registration). Section links: About Us → Why Choose OLITEC, Our Services → process steps, FAQ’s → FAQ.
- **Placeholder copy.** The design repeats sample text (identical testimonials, projects and articles; FAQ 01's
  answer is a testimonial). It is kept as designed in `website/src/content/home.ts` — replace it with real content there.
  FAQ answers 02–04 have no text in Figma, so a short general answer was written. Partner logos are "logoipsum" placeholders.
- **Social links.** Footer icons render without links until URLs are added to `siteConfig.social` (`website/src/lib/site.ts`).

## Remaining for Phase 2 (only when requested)

- **Content:** real OLITEC copy, projects, testimonials, articles and partner logos; licensed Faktum font files.
- **Database:** add `mysql2`, migrations from `schema.sql`, MySQL repository implementations, seed data.
- **Authentication:** password hashing (argon2id/bcrypt), httpOnly Secure session cookies, login rate limiting,
  email/mobile verification, password reset, protected routes in both Next.js apps, server-side role checks.
- **API integration:** replace each app's `src/services/*` mock functions with calls to the backend.
- **CRUD:** real customer, warranty and support request create/update with audit history.
- **Documents:** multipart invoice upload, virus scanning, private object storage, signed download URLs for admins.
- **Business jobs:** nightly auto-expiry of warranties, expiry reminders by SMS/email, notification on approve/reject.
- **Production hardening:** security headers/CSP, CSRF protection, request rate limiting, structured audit logging,
  input sanitisation review, real 404 status for private record pages, monitoring.
- **SEO:** final production domain in `NEXT_PUBLIC_SITE_URL`, product images, Open Graph images.
- **Testing and deployment:** unit/integration tests (backend services, form validation), end-to-end tests,
  CI pipeline, hosting configuration for the chosen environment.

## E-commerce

An online shop built into this project without changing the warranty features:

| Part | Where | What |
|---|---|---|
| Storefront | [`ecommerce/`](ecommerce/README.md) | Home, categories, listing with filters/search, product detail, cart, checkout, payments, account, order tracking, bulk enquiry, policy pages |
| Shop admin | `admin/` → sidebar **E-Commerce** (`/ecommerce/*`) | Dashboard, orders, products, categories & brands, inventory, customers, payments & refunds, coupons, bulk enquiries & quotations, support, reviews, website content, reports/CSV, staff roles, settings, audit log |
| API + database | [`backend/src/modules/ecommerce`](backend/README.md#e-commerce-module-srcmodulesecommerce-mysql-backed) at `/api/ecommerce` | MySQL migrations, sessions, role permissions, transactional stock, Razorpay, webhooks, refunds |

The admin's E-Commerce section uses its **own real sign-in** (shop staff session from the backend). The warranty screens
and their mock sign-in are unchanged.

### Run locally

```bash
# 1. Database: fill DB_* in backend/.env (MySQL 8.0.16+), then
cd backend && npm install && npm run db:migrate
#    optional sample data + first Super Admin (set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, ≥12 chars):
npm run db:seed:dev
npm run dev                                # :4000 — PAYMENT_PROVIDER=mock simulates payments locally
# 2. Storefront
cd ../ecommerce && cp .env.example .env.local && npm install && npm run dev   # :3002
# 3. Admin (sign in under E-Commerce with the seeded Super Admin)
cd ../admin && npm run dev                 # :3001 → http://localhost:3001/ecommerce
```

### Files changed outside the new folders

Only additive changes; nothing existing was removed or rewritten:

- `backend/src/routes/index.ts` — registers the module at `/ecommerce` (2 lines)
- `backend/src/config/env.ts` — default `CORS_ORIGINS` now also includes `http://localhost:3002`
- `backend/package.json` — `mysql2` dependency; `db:migrate`, `db:migrate:status`, `db:seed:dev`, `test` scripts
- `backend/.env.example`, `backend/.gitignore` (`uploads/`), `backend/README.md`
- `admin/src/components/layout/AdminShell.tsx` — E-Commerce menu group (existing items unchanged); sidebar scrolls
- `admin/.env.example` — `NEXT_PUBLIC_SHOP_URL`; corrected the API comment
- New: `backend/database/migrations/`, `backend/src/db/`, `backend/src/modules/ecommerce/`, `admin/src/app/(panel)/ecommerce/`,
  `admin/src/components/ecommerce/`, `admin/src/services/ecommerce/`, `ecommerce/`

`website/` was not modified.

### Verification performed

- `npm test` in `backend`: 27/27 passed — 16 unit/HTTP tests (including warranty API regression) and 11 integration
  tests run against a MySQL 8.0.46 test database (all three migrations applied cleanly, including `schema.sql`).
- Builds: backend `tsc`, `ecommerce` (22 routes), `admin` (24 routes incl. all existing warranty routes), `website` (26 routes, unchanged).
- Live crawl with all servers running: every storefront and admin route returned 200; unknown products, categories and
  unpublished pages return 404; existing warranty endpoints still return 200 with mock data.
- Headless Edge screenshots of home (desktop + 500 px mobile), listing and product pages.
- **Not yet done:** real Razorpay test-mode payment (needs keys), browser-driven end-to-end tests of the admin UI,
  manual testing on real phones, load testing.

### Before going live — business decisions and integrations still required

1. **Razorpay:** set `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID/SECRET`, configure the webhook (URL and events in
   `backend/.env.example`) and test with `rzp_test_` keys.
2. **Store settings** (Admin → E-Commerce → Settings): GSTIN, legal name and address (printed on invoices), shipping fee and
   free-shipping threshold, serviceable pincodes, COD on/off, return window. Defaults are placeholders (free shipping, COD off, returns off).
3. **Policy pages** are created **unpublished** with placeholder text — publish only business-approved shipping, returns,
   cancellation, privacy, terms and warranty text. No delivery, warranty or refund promises were invented.
4. **Email/SMS provider:** not configured. Password-reset links are only logged in development; order and support
   notifications are not sent. Connect a provider in `auth.service.ts` (`deliverResetLink`) before enabling resets in production.
5. **Catalogue:** replace the seed's "Sample" products with real data and images; remove sample banner/FAQ/`TEST10` coupon.
6. **Production hardening:** HTTPS, `COOKIE_SECURE=true`, `COOKIE_DOMAIN`, strict `CORS_ORIGINS`, persistent storage (or object
   storage) for `ECOM_MEDIA_DIR`, nightly `mysqldump` backups, and a shared rate limiter if running several API instances
   (the built-in limiter is per process).
7. **Courier integration:** tracking is entered manually (courier, number, URL); no courier API is connected.
8. **Bulk quotation → order:** quotations are prepared and downloaded in the admin; an accepted quote is turned into an
   order by placing it in the shop and linking the order number (no automatic conversion).
