# Customer website

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4. Phase 1: full UI on mock data — see the [project README](../README.md).

```bash
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (includes type-checking) |
| `npm start` | Serve the production build on port 3000 |
| `npm run typecheck` | TypeScript only |

## Where things live

**Design rule:** the look comes from the Figma design (Figtree, black section titles, orange gradient pill buttons,
rounded image panels, glass cards); the text and images come from the Olitec HTML design (`Olitec-Website/`).

- `src/app/(site)/` — public pages: home, leadership, products, applications, downloads, warranty registration,
  warranty status, service request, channel partners, homes and businesses, careers
- `src/content/legacy.ts`, `pages.ts`, `forms.ts`, `home.ts` — all page text and form fields (from the HTML design;
  FAQ answers are HTML text)
- `src/components/home/` — Figma home sections (hero, FAQ) and shared Figma primitives (`primitives.tsx`)
- `src/components/legacy/ui.tsx` — Figma-styled building blocks for the inner pages (banner, sections, cards, buttons)
- `src/components/legacy/` — animated illustrations, "What Olitec does" carousel, enquiry and warranty-status forms
- `public/images/legacy/`, `public/downloads/` — illustrations and datasheet/brochure PDFs from the HTML design
- `public/images/home/` — Figma logo, icons and the call-to-action cloud image
- `src/app/(site)/(content)/` — signed-in pages (my warranties, profile, support) and the sample product detail pages
- `src/app/(auth)/` — login and registration
- `src/components/ui/` — form and button kit, styled to match Figma
- `src/services/` — **the only place that reads data.** Each function is marked with the API endpoint that replaces it in Phase 2.
- `src/mock/data.ts` — sample data; nothing else should import it
- `src/app/globals.css` — Figma design tokens (OLITEC orange, fonts) and the illustration animations

The header menu follows the Olitec HTML design (Our Legacy, Products, Applications, Downloads, Customer Care ▾, Connect ▾)
and never shows account details. Menu items are defined in `src/lib/site.ts` (`mainNav`).
All enquiry forms (partners, consultation, careers, service request) validate input but are **simulated**: nothing is sent or saved.
Warranty status looks up the sample data only (try serial `AP750K24110387` with mobile `9876543210`).

Customers reach sign-in and registration from the
**Warranty** page (`/warranties/register`).

Demo sign-in: `priya.sharma@example.com` with any password. Authentication is simulated; no session is created.
