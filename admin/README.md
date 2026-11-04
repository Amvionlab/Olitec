# Admin panel

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4. Phase 1: full UI on mock data — see the [project README](../README.md).

```bash
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev                  # http://localhost:3001
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server on port 3001 |
| `npm run build` | Production build (includes type-checking) |
| `npm start` | Serve the production build on port 3001 |
| `npm run typecheck` | TypeScript only |

## Where things live

- `src/app/login/` — admin sign-in (no sidebar)
- `src/app/(panel)/` — dashboard, customers, warranties (sidebar layout)
- `src/components/` — reusable UI (`ui/`: table, pagination, filter bar, confirm dialog…) and feature components
- `src/services/` — **the only place that reads data**; swap for `/api/admin/*` calls in Phase 2
- `src/mock/data.ts` — deterministic generated data (32 customers, 57 warranties: 12 pending, 28 active, 14 expired, 3 rejected) dated relative to 28 Oct 2026
- `src/lib/permissions.ts` — role → permission map and allowed status transitions (UI only; the backend must enforce the same rules)

Approve/reject/status changes are simulated: they update the page and audit history until reload, but nothing is saved.

Demo sign-in: `anita.rao@olitech.example` with any password. There is no real authentication and panel routes are not protected yet.
