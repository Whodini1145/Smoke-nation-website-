# Smoke Nation website

Online shop for Smoke Nation, 420 Pine St, Frankston, TX: THCA flower and nicotine vapes, with in-store pickup or shipping, optional customer accounts, and an admin panel. The first staff account is the main one and can give other people staff access.

See `SPEC.md` for the full plan and every decision made so far.

## Run it

```bash
npm install
npm run dev            # local dev server
npm test               # pricing and deal tests
npm run build          # production build into dist/
npm run build:preview  # one self-contained HTML file in preview-dist/ to click through on a phone
```

## Where things live

- `src/data/types.ts`: everything the site stores (products, deals, orders, settings…)
- `src/data/seed.ts`: starting content. Product names and prices are placeholders.
- `src/data/store.ts`: preview data layer (browser storage). Swap for Supabase here.
- `src/lib/pricing.ts`: sale prices, the deal engine (repeating, best-savings), tax, shipping
- `src/pages/`: storefront pages; `src/pages/admin/`: the admin panel
- `src/styles/`: design (`app.css` storefront, `admin.css` admin)

## Status

First pass: the full site works in the browser with sample data. Still to do before going live:
connect Supabase (database, logins, photo storage), hosting on Vercel, a domain, and the payment processor.
