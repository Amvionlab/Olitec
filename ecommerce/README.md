# OLITEC Shop — e-commerce storefront

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 — same stack and brand tokens as [`website/`](../website/).
All data comes from the shared backend's e-commerce module (`backend/src/modules/ecommerce`, mounted at `/api/ecommerce`).
Shop management screens live in the existing admin app under **E-Commerce** (`admin/src/app/(panel)/ecommerce`).

```bash
cp .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
npm install
npm run dev                     # http://localhost:3002  (backend must run on :4000)
```

Scripts: `npm run build`, `npm start` (port 3002), `npm run typecheck`.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public storefront URL — canonical URLs, sitemap, structured data |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base (`…/api`); browser calls go here with cookies |
| `API_INTERNAL_BASE_URL` | Optional API URL for server-side rendering (internal hostname). Defaults to the public one |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Where uploaded images are served (must equal backend `ECOM_MEDIA_BASE_URL`); allowed in `next/image` |

No secrets belong here — every `NEXT_PUBLIC_*` value is visible in the browser.

## Pages

| Route | Rendering | Notes |
|---|---|---|
| `/` | ISR 60 s | Banners, promos, trust badges, testimonials, FAQs from Admin → Content; featured / best sellers / offers / new arrivals from product flags; recently viewed |
| `/products` | Dynamic | Search, filters (brand, price, availability, specifications), sort, grid/list, pagination — all in the URL, all from the API |
| `/categories`, `/categories/[slug]` | Dynamic | Nested categories, breadcrumbs, subcategory chips; 404 for unknown/inactive |
| `/products/[slug]` | ISR 60 s | Gallery with zoom, variants, specs, pincode check, warranty/delivery info, reviews, related, recently viewed, `Product` JSON-LD; 404 for unknown |
| `/cart` | Client | Quantities, stock/limit errors, coupons, server-computed totals |
| `/checkout` | Client | Contact, saved/new shipping address, billing + GSTIN, payment method (COD only if enabled), idempotent order placement |
| `/order/[orderNumber]` | Client | Confirmation, payment (Razorpay Checkout or dev-only mock), status timeline, invoice, cancel/return requests |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Client | Guest cart is merged into the account on sign-in |
| `/account`, `/account/orders[/…]`, `/account/addresses`, `/account/support`, `/wishlist` | Client | Signed-in only (API enforces it) |
| `/track-order` | Client | Order number + email |
| `/bulk-purchase`, `/contact`, `/faqs`, `/policies/[slug]` | Mixed | Policy pages are CMS text, 404 until published |
| `/sitemap.xml`, `/robots.txt` | — | Private pages are disallowed and sent with `X-Robots-Tag: noindex` |

## How it is built

- `src/services/api.ts` — one fetch wrapper: credentials included, `x-olitec-client` header on writes (backend CSRF check),
  server-side GETs cached with `revalidate`, typed `ApiError`.
- `src/store/StoreProvider.tsx` — customer, cart and wishlist state plus toasts. The server is the source of truth: every
  action replaces local state with the API response. No extra state library.
- Prices, discounts, GST and shipping are **always** computed by the backend; the UI only displays them. Checkout sends the
  total the customer saw (`expectedTotal`) and the backend refuses the order (`409 PRICE_CHANGED`) if it no longer matches.
- Each checkout attempt has an idempotency key (`src/hooks/useIdempotencyKey.ts`), so double-clicks and retries return the same order.
- Guests get a one-time order access token, kept in `sessionStorage`, to view and pay their order.
- CMS text (pages, FAQs, testimonials) is rendered as text, never as HTML.

## Deploying

Deploy like any Next.js app (`npm run build && npm start`, or a Node host / container). It is independent of `website/`
and `admin/`. Recommended layout: `shop.example.com` (this app), `api.example.com` (backend), with
`COOKIE_DOMAIN=.example.com`, `COOKIE_SECURE=true` and both origins in the backend's `CORS_ORIGINS`.
To serve it under `/shop` on the main domain instead, set `basePath: "/shop"` in `next.config.ts` and route `/shop/*` to this app.
