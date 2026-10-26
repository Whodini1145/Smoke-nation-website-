# Notes for Claude

- Read `SPEC.md` first: it has every decision made with the site manager.
- How to explain things to the site manager: short numbered steps (1, 2, 3), plain words, no filler. They are dyslexic; long paragraphs are hard to read.
- Live site: https://smoke-nation.web.app (custom domain smokenationtx.com, www redirects to it; bought at Porkbun, added to Hosting and Auth authorized domains). Pushing to the default branch uploads it (GitHub Actions). `npm run build:preview` builds a database-free copy for local testing (serve with `npx vite preview --outDir preview-dist`).
- Security rules tests: `npm run test:rules` (Firestore emulator).
- The live store is set up (Firestore has data). Changing `seed.ts` no longer changes the live site: product/catalog changes must also be written to Firestore, and the admin's own edits (Settings, slides, reviews) must be kept.
- Card payments: Authorize.Net. Browser tokenizes with Accept.js (`src/lib/payment.ts`); the payment server `functions/` (callable `placeOrder`) prices the cart server-side, holds stock, charges, then saves the order. Transaction Key is in Secret Manager (`AUTHNET_TRANSACTION_KEY`). The GitHub upload does NOT deploy functions: after changing `functions/` or `src/lib/{order,pricing,stock,catalog}.ts`, run `npx firebase deploy --only functions --project smoke-nation`. Changing the secret also needs a functions redeploy.
